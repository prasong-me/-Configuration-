# Target Data Evidence Contract

Version: 1.0.0

Target definitions contain two distinct kinds of information:

- normative target facts: facts derived from the target's own documentation/specification;
- project rules: constraints imposed by this project, such as refusing silent PROXY-to-DIRECT conversion.

Evidence records should preserve:
- source URL or document identifier;
- source type;
- source version/date when available;
- exact target feature or field supported by the evidence;
- retrieval date;
- notes on ambiguity or deprecation.

Evidence does not become an implementation rule merely by being recorded. The architecture layer decides when an evidence-backed condition is promoted into an enforced contract.
