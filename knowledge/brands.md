# Brands

One directory per brand. Resolve the name you were given to a partition key here, then read
only that directory.

| Brand | Partition key | Knowledge |
|---|---|---|
| Arsys | `83b881f9-2d3b-4df3-962b-e5c0213acb0e` | [`83b881f9-2d3b-4df3-962b-e5c0213acb0e/`](83b881f9-2d3b-4df3-962b-e5c0213acb0e/index.md) — 9 atoms |
| Fasthosts | `8aa9afcc-f2bf-4388-9066-482448eaa32d` | [`8aa9afcc-f2bf-4388-9066-482448eaa32d/`](8aa9afcc-f2bf-4388-9066-482448eaa32d/index.md) — 14 atoms |
| IONOS | `0d7e8bcb-999b-4f96-8a31-3cfb42959e22` | [`0d7e8bcb-999b-4f96-8a31-3cfb42959e22/`](0d7e8bcb-999b-4f96-8a31-3cfb42959e22/index.md) — 1013 atoms |
| STRATO | `4e947002-cc58-4265-affb-15d213f39b2e` | [`4e947002-cc58-4265-affb-15d213f39b2e/`](4e947002-cc58-4265-affb-15d213f39b2e/index.md) — 403 atoms |
| Strefa | `7f29907c-2b09-4034-a78e-c920230b1599` | [`7f29907c-2b09-4034-a78e-c920230b1599/`](7f29907c-2b09-4034-a78e-c920230b1599/index.md) — 11 atoms |
| UDAG | `2c8dbf9f-db4f-41ef-a62c-beac1c8f6384` | [`2c8dbf9f-db4f-41ef-a62c-beac1c8f6384/`](2c8dbf9f-db4f-41ef-a62c-beac1c8f6384/index.md) — 10 atoms |
| home.pl | `4af13eab-54c2-4444-86ed-9d0ffbe2317b` | [`4af13eab-54c2-4444-86ed-9d0ffbe2317b/`](4af13eab-54c2-4444-86ed-9d0ffbe2317b/index.md) — 9 atoms |
| world4you | `b3b16375-5373-4fb1-be97-ed0f20a86339` | [`b3b16375-5373-4fb1-be97-ed0f20a86339/`](b3b16375-5373-4fb1-be97-ed0f20a86339/index.md) — 10 atoms |

## Why the directory is an id and not the name

The partition key is the brand's **team id**. It is also the string the Hub's API expects as
`brand`, so the offline route and the API name a brand identically.

It is not the team's NAME because names carry no unique index: any admin can create or
rename a second brand to an existing name, and from that moment the two would share one
directory — one brand's voice, terminology and claims assembling into the other's prompts.
The database still separates them; the leak would happen entirely in this tree. An id
cannot collide and cannot be edited, and a rename produces no diff here at all.

A brand listed with no published knowledge has no directory. That is a real state — nothing
has passed review yet — and not a missing file.
