# Response template policy

This document defines the cross-cutting rules that all response templates in
kumogakure must follow. It is the source of truth for category-specific
template work in `src/bait/templates/`.

## A. Fake data principles

All fabricated content returned by templates must comply with the following:

1. **No actionable credentials.** Fake API keys, passwords, tokens, and other
   secrets must use clearly non-functional values. Examples:
   - `EXAMPLE_AKIA1234567890ABCDEF`
   - `REDACTED_FOR_HONEYPOT`
   - `do-not-use-this-password`
2. **No false attribution to real entities.** Fabricated content within
   responses must use invented organization names, individuals, and contact
   details. Visually mimicking a vulnerable service's interface is permitted
   where it serves the honeypot function (HTML layout, CSS structure, generic
   error phrasing), but do not reproduce trademarked logos and do not claim
   that response content originates from a specific real organization.
3. **Use the `.invalid` TLD for fabricated domains.** RFC 6761 reserves
   `.invalid` as never-resolvable, which prevents fake domain references from
   accidentally pointing at a real registration. Examples:
   - `example-honeypot.invalid`
   - `auth.example.invalid`
4. **No payloads that could harm an attacker's system.** Fake files must not
   contain executable content, archives that could exploit decompression bugs,
   or any data designed to harm whoever retrieves it. The goal is observation,
   not retaliation.

## B. Realism tiers

Every template is assigned one of three realism tiers. Category-specific
issues record the tier for each path.

### Tier 1 — Plausible

Hand-crafted responses that closely mimic a real vulnerable service. Includes
realistic HTML structure, version strings, and timing characteristics. Used
where high attacker engagement reveals the most valuable follow-up behavior
(typically login forms and Spring Boot Actuator endpoints).

### Tier 2 — Generic

Minimal but format-valid responses (well-formed JSON, plain text, or short
HTML). Catches automated scanners without investing effort in deep mimicry.
Used for most config-leak, SSRF metadata, and API reconnaissance paths.

### Tier 3 — Status-only

Returns a status code (typically 404 or 403) with no body or a single short
line of text. Used where any plausible body content would carry too much
legal or ethical risk, or where there is no engagement value (most webshell
paths).

## C. Canary marker

Responses **do not** include any honeypot identification marker. No hidden
HTML comments, no custom response headers, no subtle artifacts that would
allow an external party to determine that a given endpoint is kumogakure.

Rationale: any marker that helps the research community detect honeypots is
equally available to attackers, who would then fingerprint and exclude
kumogakure deployments from scanning campaigns. Maximizing the volume and
fidelity of captured attacker traffic outweighs the value of providing a
canary for honeypot researchers.

## Applying this policy

When implementing a template:

- Confirm the assigned realism tier from the category-specific issue
- Cross-check every fabricated value against the four fake-data principles
- Verify no canary-like markers are introduced (Server header rotation
  through `src/fingerprint/headers.ts` is a deliberate anti-fingerprinting
  measure, not a canary)
- Note the policy version this template was reviewed against if material
  changes are later proposed
