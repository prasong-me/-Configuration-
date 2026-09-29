import Foundation
import Network
@preconcurrency import NetworkExtension
import ConfigurationNetworkExtensionShim

public enum DNSProxyTransportRuntimeError: Error {
    case unsupportedFlow
    case invalidConfiguration
    case upstreamFailed
}

public struct DNSProxyUpstreamConfiguration: Sendable {
    public let host: Network.NWEndpoint.Host
    public let port: Network.NWEndpoint.Port

    public init(host: String, port: UInt16) throws {
        guard !host.isEmpty, let port = Network.NWEndpoint.Port(rawValue: port) else {
            throw DNSProxyTransportRuntimeError.invalidConfiguration
        }
        self.host = NWEndpoint.Host(host)
        self.port = port
    }
}

public final class DNSProxyFlowSession: @unchecked Sendable {
    private let flow: NEAppProxyFlow
    private let upstream: DNSProxyUpstreamConfiguration
    private var connection: NWConnection?
    private var closed = false
    private let udpBridge = ConfigurationNetworkExtensionShim()

    public init(flow: NEAppProxyFlow, upstream: DNSProxyUpstreamConfiguration) {
        self.flow = flow
        self.upstream = upstream
    }

    public func start() {
        guard !closed else { return }
        if let udp = flow as? NEAppProxyUDPFlow {
            startUDP(udp)
        } else if let tcp = flow as? NEAppProxyTCPFlow {
            startTCP(tcp)
        } else {
            close(DNSProxyTransportRuntimeError.unsupportedFlow)
        }
    }

    private func startUDP(_ flow: NEAppProxyUDPFlow) {
        let connection = NWConnection(host: upstream.host, port: upstream.port, using: .udp)
        self.connection = connection
        connection.stateUpdateHandler = { [weak self] state in
            if case .failed = state { self?.close(DNSProxyTransportRuntimeError.upstreamFailed) }
        }
        connection.start(queue: .global(qos: .userInitiated))
        flow.open(withLocalFlowEndpoint: nil) { [weak self] error in
            guard let self else { return }
            if let error { self.close(error); return }
            self.readUDP(flow)
        }
    }

    private func readUDP(_ flow: NEAppProxyUDPFlow) {
        guard !closed else { return }
        udpBridge.readDatagrams(from: flow) { [weak self] datagrams, endpoints, error in
            guard let self else { return }
            if let error { self.close(error); return }
            guard let datagrams, let endpoints, datagrams.count == endpoints.count else {
                self.close(DNSProxyTransportRuntimeError.upstreamFailed)
                return
            }
            let endpointArray = endpoints as NSArray
            for index in 0..<datagrams.count {
                let data = datagrams[index]
                let endpoint = endpointArray.object(at: index)
                self.connection?.send(content: data, completion: .contentProcessed { [weak self] sendError in
                    if let sendError { self?.close(sendError) }
                })
                self.connection?.receiveMessage { [weak self] response, _, _, receiveError in
                    guard let self else { return }
                    if let receiveError { self.close(receiveError); return }
                    guard let response else { self.close(DNSProxyTransportRuntimeError.upstreamFailed); return }
                    self.udpBridge.writeDatagrams([response], flowEndpoints: [endpoint], to: flow) { [weak self] writeError in
                        if let writeError { self?.close(writeError) }
                    }
                }
            }
            self.readUDP(flow)
        }
    }

    private func startTCP(_ flow: NEAppProxyTCPFlow) {
        let connection = NWConnection(host: upstream.host, port: upstream.port, using: .tcp)
        self.connection = connection
        connection.stateUpdateHandler = { [weak self] state in
            if case .failed = state { self?.close(DNSProxyTransportRuntimeError.upstreamFailed) }
        }
        connection.start(queue: .global(qos: .userInitiated))
        flow.open(withLocalFlowEndpoint: nil) { [weak self] error in
            guard let self else { return }
            if let error { self.close(error); return }
            self.readTCP(flow)
        }
    }

    private func readTCP(_ flow: NEAppProxyTCPFlow) {
        guard !closed else { return }
        flow.readData { [weak self] data, error in
            guard let self else { return }
            if let error { self.close(error); return }
            guard let data, !data.isEmpty else { self.close(nil); return }
            self.connection?.send(content: data, completion: .contentProcessed { [weak self] sendError in
                guard let self else { return }
                if let sendError { self.close(sendError); return }
                self.receiveTCP(flow)
            })
        }
    }

    private func receiveTCP(_ flow: NEAppProxyTCPFlow) {
        guard !closed else { return }
        connection?.receive(minimumIncompleteLength: 1, maximumLength: 65535) { [weak self] data, _, isComplete, error in
            guard let self else { return }
            if let error { self.close(error); return }
            if let data, !data.isEmpty {
                flow.write(data) { [weak self] writeError in
                    guard let self else { return }
                    if let writeError { self.close(writeError) } else { self.readTCP(flow) }
                }
            } else if isComplete {
                self.close(nil)
            } else {
                self.receiveTCP(flow)
            }
        }
    }

    public func close(_ error: Error?) {
        guard !closed else { return }
        closed = true
        connection?.cancel()
        flow.closeReadWithError(error)
        flow.closeWriteWithError(error)
    }
}

// Runtime validation boundary: current NetworkExtension APIs are compile-tested by macOS CI.
