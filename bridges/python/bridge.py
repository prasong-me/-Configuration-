#!/usr/bin/env python3
"""Language-neutral JSONL bridge.

The bridge deliberately does not contain target-specific routing or export logic.
It validates and exchanges machine-readable envelopes between runtimes.
"""

import json
import sys

PROTOCOL = "configuration-bridge/0.1"
REQUIRED = ("protocol", "request_id", "action", "payload")


def process(message):
    if not isinstance(message, dict):
        raise ValueError("Envelope must be a JSON object")

    missing = [key for key in REQUIRED if key not in message]
    if missing:
        raise ValueError("Missing envelope fields: " + ", ".join(missing))

    if message["protocol"] != PROTOCOL:
        raise ValueError("Unsupported bridge protocol")
    if not isinstance(message["request_id"], str) or not message["request_id"].strip():
        raise ValueError("request_id must be a non-empty string")
    if not isinstance(message["action"], str) or not message["action"].strip():
        raise ValueError("action must be a non-empty string")

    return {
        "protocol": PROTOCOL,
        "request_id": message["request_id"],
        "status": "ACCEPTED",
        "action": message["action"],
        "payload": message["payload"],
    }


def main():
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            message = json.loads(line)
            response = process(message)
        except (json.JSONDecodeError, ValueError) as exc:
            response = {
                "protocol": PROTOCOL,
                "status": "ERROR",
                "error": str(exc),
            }
        print(json.dumps(response, ensure_ascii=False, separators=(",", ":")), flush=True)


if __name__ == "__main__":
    main()
