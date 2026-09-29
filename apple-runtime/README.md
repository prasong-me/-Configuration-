# Apple NetworkExtension compile fixture

This target establishes a real macOS/Xcode toolchain compilation boundary for the generated NetworkExtension provider shape.

It is not a signed app extension and does not prove entitlement, provisioning, device execution, or end-to-end DNS forwarding.

The fixture intentionally keeps handleNewFlow fail-closed, matching Provider Runtime Generator v1.
