# DNS Wire Encoder Contract v1

## Scope

This contract defines the boundary from the semantic DNS_MESSAGE model to raw DNS wire bytes.

The encoder is deterministic and fail-closed. Section counts are derived from the message rather than accepted as independent caller-controlled fields.

## Wire strategy

v1 uses **no DNS name compression on output**. This is intentional: RFC 1035 permits uncompressed domain names, while compression pointers are offsets into the message and therefore introduce additional state. The encoder must not invent compression or rewrite semantics merely to reduce size.

## Header

The encoder preserves transaction ID and DNS header flags. Question/answer/authority/additional counts are derived from the arrays.

The DNS header layout and section structure follow RFC 1035. citeturn0search1

## RDATA

RDATA is encoded according to an explicit mode:

- A → IPv4 octets
- AAAA → IPv6 octets
- CNAME/NS/PTR → domain name
- MX → preference + domain name
- SRV → priority + weight + port + target
- TXT → length-prefixed character-string chunks
- SVCB/HTTPS → priority + target + parameter list

The implementation must reject a record whose semantic RDATA cannot be represented by its declared mode. It must never silently copy a potentially offset-sensitive compression pointer from a previous wire message.

## Round-trip semantics

v1 does not promise byte-identical encode(decode(bytes)).

It targets semantic round-trip for the fields and record types explicitly supported by the encoder.

Byte-identical preservation would require retaining original wire representation, including compression choices and other byte-level details, which is a separate contract.

## EDNS(0)

OPT is intentionally outside the v1 encoder record set. RFC 6891 defines OPT as a DNS pseudo-RR with special CLASS/TTL semantics and extended RCODE handling. It will be added only through an explicit EDNS contract rather than being treated as an ordinary RR. citeturn0search3
