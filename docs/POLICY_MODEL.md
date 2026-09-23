# Canonical Policy Model

The Canonical Policy Model is the platform-neutral representation of user intent.

## Goals

- Express intent without target-specific syntax.
- Remain deterministic and versioned.
- Allow target adapters to report partial support.
- Avoid silently changing requested behavior.

## Initial domains

- vpn
- dns
- proxy
- routing
- blocking
- privacy
- providers

## Example

```json
{
  "version": "0.1",
  "policy": {
    "name": "privacy-basic",
    "vpn": { "enabled": false },
    "dns": { "enabled": true },
    "routing": { "ipv4": true, "ipv6": true },
    "blocking": {
      "malware": true,
      "tracker": true
    }
  }
}
```

This model describes intent only. It does not claim that every Target can implement every field.
