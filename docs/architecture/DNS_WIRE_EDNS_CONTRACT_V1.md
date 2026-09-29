# DNS Wire EDNS Contract v1

EDNS(0) is represented separately from ordinary RR semantics.

RFC 6891 defines OPT as RR type 41, a pseudo-RR used for transaction control information. It is carried in the additional section, uses CLASS for the requestor UDP payload size, and uses TTL for extended RCODE, version, and flags. Its RDATA is a sequence of option code/length/data tuples. citeturn0search1

v1 supports EDNS version 0 only. The DO bit and remaining Z bits are explicit. Unknown option codes are preserved as opaque octets; the implementation does not infer option semantics.

The encoder must emit at most one OPT RR per message. The decoder rejects malformed option boundaries. Semantic option-specific behavior remains outside this contract.
