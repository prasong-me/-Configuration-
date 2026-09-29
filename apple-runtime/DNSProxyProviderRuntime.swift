@available(macOS 15.0, *)
import Foundation
import NetworkExtension

public final class DNSProxyProviderRuntime: NEDNSProxyProvider {
    private var sessions: [ObjectIdentifier: DNSProxyFlowSession] = [:]
    private let upstream: DNSProxyUpstreamConfiguration

    public override init() {
        guard let configuration = try? DNSProxyUpstreamConfiguration(host: "1.1.1.1", port: 53) else {
            fatalError("invalid compile-fixture upstream")
        }
        self.upstream = configuration
        super.init()
    }

    public override func startProxy(options: [String : Any]? = nil, completionHandler: @escaping (Error?) -> Void) {
        completionHandler(nil)
    }

    public override func stopProxy(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) {
        for session in sessions.values { session.close(nil) }
        sessions.removeAll()
        completionHandler()
    }

    public override func handleNewFlow(_ flow: NEAppProxyFlow) -> Bool {
        guard flow is NEAppProxyUDPFlow || flow is NEAppProxyTCPFlow else { return false }
        let session = DNSProxyFlowSession(flow: flow, upstream: upstream)
        sessions[ObjectIdentifier(flow)] = session
        session.start()
        return true
    }
}
