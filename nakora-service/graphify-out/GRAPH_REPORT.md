# Graph Report - .  (2026-04-23)

## Corpus Check
- 16 files · ~4,585 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 102 nodes · 119 edges · 15 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]

## God Nodes (most connected - your core abstractions)
1. `DnsActivator` - 12 edges
2. `ScoringEngine` - 7 edges
3. `DnsWorker` - 7 edges
4. `EtwMonitor` - 7 edges
5. `NamedPipeIpcServer` - 7 edges
6. `BlocklistCache` - 6 edges
7. `LocalDnsResolver` - 5 edges
8. `IEtwMonitor` - 5 edges
9. `GoAnalyzerClient` - 5 edges
10. `FeedRefreshWorker` - 4 edges

## Surprising Connections (you probably didn't know these)
- `DnsWorker` --inherits--> `BackgroundService`  [EXTRACTED]
  NakoraService/DNS/DnsWorker.cs →   _Bridges community 4 → community 8_
- `IEtwMonitor` --inherits--> `IDisposable`  [EXTRACTED]
  NakoraService/ETW/EtwMonitor.cs →   _Bridges community 10 → community 1_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (2): DnsActivator, IHostedService

### Community 1 - "Community 1"
Cohesion: 0.24
Nodes (2): EtwMonitor, IEtwMonitor

### Community 2 - "Community 2"
Cohesion: 0.36
Nodes (2): IScoringEngine, ScoringEngine

### Community 3 - "Community 3"
Cohesion: 0.28
Nodes (3): IAsyncDisposable, IIpcServer, NamedPipeIpcServer

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (3): BackgroundService, EtwWorker, FeedRefreshWorker

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (6): DbContext, AuditLogEntity, DnsEventEntity, DomainListEntry, NakoraDbContext, SettingEntity

### Community 6 - "Community 6"
Cohesion: 0.32
Nodes (4): IOnnxInferenceService, OnnxInferenceService, OnnxInput, OnnxOutput

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (1): BlocklistCache

### Community 8 - "Community 8"
Cohesion: 0.48
Nodes (1): DnsWorker

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (2): GoAnalyzerClient, IGoAnalyzerClient

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (3): IDisposable, IDnsResolver, LocalDnsResolver

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (1): DnsForwarder

### Community 12 - "Community 12"
Cohesion: 0.67
Nodes (1): IDnsResolver

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **6 isolated node(s):** `DnsEventEntity`, `AuditLogEntity`, `DomainListEntry`, `SettingEntity`, `OnnxInput` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 13`** (1 nodes): `Program.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `Verdict.cs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `IEtwMonitor` connect `Community 1` to `Community 10`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `DnsWorker` connect `Community 8` to `Community 4`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `DnsEventEntity`, `AuditLogEntity`, `DomainListEntry` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._