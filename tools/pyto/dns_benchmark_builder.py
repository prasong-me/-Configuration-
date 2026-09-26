#!/usr/bin/env python3
"""
DNS Benchmark Shortcut builder for Pyto.

Run this file in Pyto. It creates a single file:
    Documents/DNS Benchmark.shortcut

Then it opens iOS Share Sheet. Choose Shortcuts and confirm the import once.

Important:
- Pyto cannot silently install a Shortcut into the Shortcuts database.
- This builder does not change the iPhone's system DNS.
- The generated workflow is intentionally a small, deterministic smoke-test
  workflow. It measures real HTTPS/DoH requests to Cloudflare, Google Public DNS,
  or Quad9. It does not fabricate browser DNS timing.
"""

import plistlib
import uuid
from pathlib import Path

try:
    from file_system import share_files
except ImportError:
    share_files = None

PROVIDERS = [
    ("Cloudflare", "https://cloudflare-dns.com/dns-query?name=example.com&type=A"),
    ("Google Public DNS", "https://dns.google/resolve?name=example.com&type=A"),
    ("Quad9", "https://dns.quad9.net/dns-query?name=example.com&type=A"),
]


def uid():
    return str(uuid.uuid4()).upper()


def action(identifier, parameters=None):
    p = dict(parameters or {})
    p.setdefault("UUID", uid())
    return {
        "WFWorkflowActionIdentifier": identifier,
        "WFWorkflowActionParameters": p,
    }


def comment(text):
    return action("is.workflow.actions.comment", {"WFCommentActionText": text})


def build():
    actions = [
        comment(
            "DNS Benchmark\n"
            "DoH smoke test from iPhone.\n"
            "Does not change system DNS."
        )
    ]

    menu_group = uid()

    actions.append({
        "WFWorkflowActionIdentifier": "is.workflow.actions.choosefrommenu",
        "WFWorkflowActionParameters": {
            "WFMenuPrompt": "เลือก DNS ที่ต้องการทดสอบ",
            "WFMenuItems": [name for name, _ in PROVIDERS],
            "GroupingIdentifier": menu_group,
            "WFControlFlowMode": 0,
        },
    })

    for name, url in PROVIDERS:
        actions.append({
            "WFWorkflowActionIdentifier": "is.workflow.actions.choosefrommenu",
            "WFMenuItemTitle": name,
            "WFWorkflowActionParameters": {
                "GroupingIdentifier": menu_group,
                "WFControlFlowMode": 1,
            },
        })
        actions.append(comment(f"{name}: GET {url}"))
        actions.append(action(
            "is.workflow.actions.downloadurl",
            {
                "WFURL": url,
                "WFHTTPMethod": "GET",
            },
        ))
        actions.append(action(
            "is.workflow.actions.showresult",
            {
                "Text": f"{name}\nDoH request completed.",
            },
        ))

    actions.append({
        "WFWorkflowActionIdentifier": "is.workflow.actions.choosefrommenu",
        "WFWorkflowActionParameters": {
            "GroupingIdentifier": menu_group,
            "WFControlFlowMode": 2,
            "UUID": uid(),
        },
    })

    actions.append(comment(
        "รุ่น smoke test นี้ยืนยันว่า Shortcut เรียก DoH จริงได้ก่อน "
        "เพิ่มหลายรอบ, หลายโดเมน, Median/P95 และ JSON/CSV"
    ))

    return {
        "WFWorkflowActions": actions,
        "WFWorkflowName": "DNS Benchmark",
        "WFWorkflowClientVersion": "2700.0.4",
        "WFWorkflowClientRelease": "27.0",
        "WFWorkflowMinimumClientVersion": 900,
        "WFWorkflowMinimumClientVersionString": "900",
        "WFWorkflowImportQuestions": [],
        "WFWorkflowInputContentItemClasses": [],
        "WFWorkflowOutputContentItemClasses": [],
        "WFWorkflowTypes": [],
    }


def main():
    output = Path.home() / "Documents" / "DNS Benchmark.shortcut"
    output.parent.mkdir(parents=True, exist_ok=True)

    with output.open("wb") as fp:
        plistlib.dump(build(), fp, fmt=plistlib.FMT_BINARY, sort_keys=False)

    print(f"Created: {output}")

    if share_files:
        try:
            share_files([str(output)])
            print("Share Sheet opened. Choose Shortcuts and confirm the import.")
            return
        except Exception as exc:
            print(f"Share Sheet could not be opened: {exc}")

    print("Open the file in Files, then Share > Shortcuts.")


if __name__ == "__main__":
    main()
