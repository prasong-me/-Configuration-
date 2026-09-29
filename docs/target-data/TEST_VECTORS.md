# Target Test Vector Contract

Version: 1.0.0

Every target should eventually have at least these cases:

- VALID_MINIMAL — minimum representable configuration.
- VALID_FULL — representative configuration exercising optional supported features.
- MISSING_REQUIRED — required field absent.
- INVALID_SYNTAX — malformed native syntax or invalid data type.
- UNRESOLVED_REFERENCE — policy/node/group reference does not exist.
- UNSUPPORTED_CAPABILITY — canonical capability cannot be represented.
- PARTIAL_MAPPING — only a documented subset can be represented.
- NO_RUNTIME_DATA — output must remain template rather than runnable.

Test vectors belong to target verification. They do not authorize the exporter to invent missing values.
