import XCTest
@testable import ConfigurationAppleProvider

final class DNSProxyTransportRuntimeTests: XCTestCase {
    func testValidUpstreamConfiguration() throws {
        let configuration = try DNSProxyUpstreamConfiguration(host: "9.9.9.9", port: 53)
        XCTAssertEqual(String(describing: configuration.host), "9.9.9.9")
        XCTAssertEqual(configuration.port.rawValue, 53)
    }

    func testInvalidEmptyHostFailsClosed() {
        XCTAssertThrowsError(try DNSProxyUpstreamConfiguration(host: "", port: 53))
    }

    func testInvalidZeroPortFailsClosed() {
        XCTAssertThrowsError(try DNSProxyUpstreamConfiguration(host: "9.9.9.9", port: 0))
    }
}
