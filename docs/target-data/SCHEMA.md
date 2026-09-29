# Target Data Schema

Version: 1.0.0

Target Data is the source-of-truth description of a target format. It is specification data only; it does not itself enforce runtime behavior.

## Required top-level fields
- id
- version
- platforms
- capabilities
- required
- optional
- unsupported
- constraints
- syntax
- validation
- output
- artifactStatus

## Field semantics
- `id`: stable target identifier.
- `version`: version of this target-data definition.
- `platforms`: platform identifiers supported by the target definition.
- `capabilities`: canonical capability names represented by the target.
- `required`: required native fields grouped by capability/resource.
- `optional`: fields or features that may be emitted when supported and supplied.
- `unsupported`: concepts the target cannot represent or must reject.
- `constraints`: semantic rules that must not be violated during mapping/export.
- `syntax`: target-native serialization and notation rules.
- `validation`: checks required before an artifact can be considered valid.
- `output`: artifact format, extension, and MIME metadata.
- `artifactStatus`: normalized artifact-state vocabulary for this target.

## Notation rules
- Dot notation (`a.b`) denotes a logical field path, not literal output syntax unless the target syntax says so.
- Array notation (`items[]`) denotes an element of a repeated collection.
- Angle brackets (`<name>`) denote a placeholder, never literal output.
- A pipe (`A|B`) denotes alternatives in a schema expression only.
- Question mark (`?`) denotes optional syntax in documentation expressions only.
- Exact target field names in `syntax` are case-sensitive when the target is case-sensitive.
- Canonical field names must not be substituted for target-native field names during serialization.

## Status semantics
- runnable: required semantic and runtime data are present and target syntax is valid.
- template: structural definition exists but runtime-specific data is missing.
- partial: only a documented subset is mapped.
- invalid: required syntax/schema/semantic validation failed.
- rejected: target cannot represent the requested capability or constraint.
