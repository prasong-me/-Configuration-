# Excel interchange

Excel is an interchange boundary for the canonical configuration model.

Flow: Excel workbook -> parser -> schema/reference/duplicate validation -> canonical configuration -> target adapter/exporter.

## Workbook sheets

- Metadata: schema and canonical configuration versions.
- Policy: scalar fields as field/value/type rows.
- DNS Profiles: one row per DNS profile.
- DNS Servers: resolver servers keyed by profile ID.
- Blocklists: blocklist source metadata.
- Rules: canonical rule JSON per row.
- Targets: target metadata JSON per row.
- Web Entry: web entry fields.

Schema version is 1. Changes require an explicit migration.

## Duplicate policy

Duplicates are rejected; the adapter never silently deletes or merges records. Keys are DNS profile `id`, DNS server `profile_id + server`, blocklist `id`, and target `id`. Missing DNS profile references are rejected before conversion.

## Round trip

The adapter supports export -> import for represented canonical fields. Target adapters never read Excel directly.
