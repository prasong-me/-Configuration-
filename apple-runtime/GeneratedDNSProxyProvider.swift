import Foundation
import NetworkExtension
public struct GeneratedStage: Sendable {
    public let id: String
    public let order: Int
    public let dependsOn: [String]
    public let mutation: String
    public let resultOnSuccess: String
    public let timeoutMs: Int?
    public let onParseError: String
    public let onTimeout: String
    public let onUpstreamError: String
}
public enum GeneratedProviderRuntime {
    public static let sourceChainId = "xcode-validation-fixture"
    public static let transports: [String] = ["UDP", "TCP"]
    public static let stages: [GeneratedStage] = [
        GeneratedStage(id: "dns", order: 1, dependsOn: [], mutation: "IMMUTABLE_CONTEXT", resultOnSuccess: "CONTINUE", timeoutMs: 1000, onParseError: "ERROR", onTimeout: "TIMEOUT", onUpstreamError: "ERROR")
    ]
    public static func validateStageOrder() -> Bool {
        var seen = Set<String>()
        for stage in stages {
            for dependency in stage.dependsOn where !seen.contains(dependency) { return false }
            seen.insert(stage.id)
        }
        return true
    }
}
public final class DNSProxyProvider: NEDNSProxyProvider {
    public override func startProxy(options: [String : Any]? = nil, completionHandler: @escaping (Error?) -> Void) {
        completionHandler(GeneratedProviderRuntime.validateStageOrder() ? nil : NSError(domain: "ConfigurationPlatform.ProviderRuntime", code: 1))
    }
    public override func stopProxy(with reason: NEProviderStopReason, completionHandler: @escaping () -> Void) { completionHandler() }
    public override func handleNewFlow(_ flow: NEAppProxyFlow) -> Bool { return false }
}
