# Export Artifact Test Plan

Version: 1.0.0

## Purpose

This test set inspects the files produced by the target exporters against the Target Data contract. It is an inspection layer: it does not turn Target Data into runtime enforcement rules.

The test flow is:

```
Canonical Test Input
      ↓
Target Exporter
      ↓
Artifact
      ├─ presence / non-empty
      ├─ filename + MIME
      ├─ declared output format
      ├─ target syntax markers
      ├─ canonical data preservation
      └─ target-specific structural checks
```

## Test data

The fixture intentionally uses resolver addresses that are not the project's historical default values:

- `9.9.9.9`
- `149.112.112.112`

It also includes two rule policies:

- `DIRECT`
- `PROXY`

This makes the test capable of detecting silent policy degradation.

## Test classes

| Class | Check | Failure meaning |
|---|---|---|
| E01 | compiler reachable | target has no usable export path |
| E02 | non-empty artifact | exporter emitted no file content |
| E03 | filename/extension | artifact metadata disagrees with Target Data |
| E04 | MIME | transport metadata disagrees with Target Data |
| E05 | output format | serializer contract disagrees with Target Data |
| E06 | DNS preservation | supplied DNS data is lost during export |
| E07 | policy preservation | canonical policy may be silently transformed |
| E08 | target structure | native section/top-level structure is absent |
| E09 | JSON validity | JSON target cannot be parsed |
| E10 | YAML structure | YAML target loses required top-level sections |

## Acceptance rule

A target is **export-test clean** only when:

1. compilation succeeds;
2. the artifact is non-empty;
3. filename and MIME agree with Target Data;
4. output format agrees with the declared serializer model;
5. supplied DNS values are preserved when the target has DNS capability;
6. canonical policy intent is not silently downgraded;
7. required target structure is present;
8. structured JSON artifacts parse successfully.

Warnings are retained separately from failures. A warning is not evidence that an artifact is runnable.

## Important distinction

This suite verifies the exporter output. It does **not** prove that the resulting file runs on a real device or application.

Runtime verification remains a separate gate:

```
EXPORT TEST
   ↓
ARTIFACT VALIDATION
   ↓
APP / DEVICE IMPORT
   ↓
RUNTIME VERIFICATION
```

## Current known signal

The current exporters intentionally expose several conditions that this suite is designed to catch, especially:

- canonical `PROXY` policy being transformed in some YAML exporters;
- template exporters that contain sections but no user-supplied proxy node;
- WireGuard artifacts that may lack required runtime key material;
- metadata where an INI-like artifact is reported as `ini` while Target Data models the final output as text.

These are test findings, not automatic proof that every target is unusable.

## Execution

Run:

```bash
node scripts/inspect-export-artifacts.mjs
```

Exit code:

- `0` = no hard export-contract failures detected.
- `1` = one or more hard export-contract failures detected.

The script prints a JSON inspection report suitable for CI artifacts or later aggregation.
