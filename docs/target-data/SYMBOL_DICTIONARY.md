# Target Syntax and Symbol Dictionary

Version: 1.0.0

## Meta notation
| Symbol | Meaning |
|---|---|
| `.` | logical field-path separator |
| `[]` | repeated collection element |
| `<...>` | documentation placeholder, not literal output |
| `?` | optional element in a documentation expression |
| `|` | alternative in a schema expression |
| `=` | target-native assignment operator where defined |
| `:` | YAML mapping separator where defined |
| `,` | target-native list/rule delimiter where defined |

## Important distinction
A symbol used in schema documentation is not automatically literal target syntax. The `syntax` object in each target definition is authoritative for serialization notation.

## Case sensitivity
- Apple payload keys are case-sensitive.
- YAML keys are case-sensitive.
- INI-like target sections/keys follow the target's native spelling and case rules.
- WireGuard canonical field names are case-sensitive in configuration syntax.

## Prohibited ambiguity
Do not use `proxy.id` as a substitute for a target-native name field during serialization. Do not interpret `PROXY` as a universal target-native literal; it is a canonical policy concept unless the target explicitly defines that literal.
