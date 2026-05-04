# PRD: Notion Synthetic Persona Research Pipeline

**Status:** Ready to run  
**Budget ceiling:** $0.10 (Claude API)  
**Total API calls:** 24  
**Model:** claude-sonnet-4-6

---

## 1. Overview

### Problem
We have webcrawl-derived pain point signals for Notion (HN, G2, Play Store). Before investing in real user interviews, we need to validate whether those signals hold up when probed with realistic synthetic personas — and whether the personas' severity rankings match the webcrawl's engagement-weighted rankings.

### What this pipeline does
Runs 4 synthetic personas across 3 pain point domains using blind, domain-neutral questions. Each persona generates a free-form qualitative response plus structured scores (severity, frequency, switch likelihood). Those scores are aggregated and compared against webcrawl ground truth using 4 comparison methods.

### What it does NOT do
- Replace real user research
- Generate statistically significant findings (n=4 is directional only)
- Validate that Notion actually has these problems (it validates signal alignment between two synthetic sources)

---

## 2. Personas

| ID | Name | Role | Key traits | Comparison benchmark |
|---|---|---|---|---|
| `power_user` | Alex | Team lead, 40-person SaaS | Heavy Notion user, 3+ yrs, technical non-engineer | Linear, Airtable |
| `solo_creator` | Maya | Freelance UX designer/writer | Mobile + offline-heavy, not technical, cost-sensitive | Obsidian |
| `product_manager` | Jordan | PM at B2B startup | Roadmap + integration workflows, evaluates Jira/Productboard | GitHub, Slack |
| `enterprise` | Sam | IT lead, 500-person enterprise | SSO, compliance, API integrations at scale | Confluence, Sharepoint |

Personas are defined in [`personas.js`](./personas.js). Pain point names are **not** mentioned in any persona system prompt — this preserves the blind test.

---

## 3. Pain Point Domains

Three question sets probe three domains without naming the underlying signal:

| Domain | Blind probe area | Ground truth signal |
|---|---|---|
| `connectivity_and_access` | Offline / sync reliability | "Offline mode broken" |
| `integrations_and_extensibility` | External tool connections | "MCP/integration gaps" |
| `ai_and_intelligence` | AI feature depth and scope | "Notion AI scope limited" |

Questions live in [`prompts.js`](./prompts.js). Each domain has 3 questions. After answering, the persona rates severity / frequency / switch likelihood on a 1–10 scale.

---

## 4. Technical Architecture

```
index.js  (orchestrator)
  ├── personas.js       → system prompts for 4 personas
  ├── prompts.js        → 3 question sets (blind)
  ├── scorer.js         → extractScores() — LLM extraction call (call #2)
  ├── comparator.js     → compare() — M1–M4 + Spearman's ρ
  └── ground_truth.js   → webcrawl benchmarks as constants

output/
  ├── raw_responses.json   (12 entries: 4 personas × 3 domains)
  ├── scored.json          (3 domain aggregates)
  └── comparison.json      (final comparative analysis)
```

### Data flow per iteration
```
persona × domain
  → Call 1: generation  (persona system prompt + question set → free-form text + scores)
  → Call 2: extraction  (scorer LLM parses text → structured JSON)
  → aggregateScores()   (rolls up across 4 personas per domain)
  → compare()           (persona aggregate vs ground_truth.js)
```

---

## 5. API Design

| Parameter | Value |
|---|---|
| Model | `claude-sonnet-4-6` |
| Generation max_tokens | 1,000 |
| Extraction max_tokens | 400 |
| Calls per persona×domain | 2 (generate + extract) |
| Total calls | 4 personas × 3 domains × 2 = **24** |
| Estimated tokens | ~1,200 (gen) + ~400 (extract) per pair = ~38,400 total |
| Rate limit buffer | 500ms between iterations |
| Cost ceiling | **$0.10** |

---

## 6. Output Schema

### `output/raw_responses.json`
Array of 12 objects:
```json
{
  "persona_id": "solo_creator",
  "domain": "connectivity_and_access",
  "response_text": "<full LLM response>",
  "scores": {
    "pain_point_mentioned": true,
    "pain_point_label": "offline mode fails on mobile",
    "severity": 9,
    "frequency": 7,
    "switch_likelihood": 6,
    "competitor_mentioned": "Obsidian",
    "workaround_described": true,
    "workaround_text": "Downloads pages manually before travel",
    "confidence_score": 7.50
  }
}
```

### `output/scored.json`
Array of 3 domain aggregates:
```json
{
  "domain": "connectivity_and_access",
  "mention_count": 4,
  "personas_mentioning": ["power_user", "solo_creator", "product_manager", "enterprise"],
  "avg_severity": "8.25",
  "avg_frequency": "6.75",
  "avg_switch_likelihood": "5.50",
  "avg_confidence": "7.10",
  "competitors_mentioned": ["Obsidian"],
  "workarounds_found": 2
}
```

### `output/comparison.json`
```json
{
  "spearman_rho": "0.XXX",
  "overlap_rate": "X/3",
  "summary": {
    "confirmed": 0,
    "persona_only": 0,
    "webcrawl_only": 0,
    "undetected": 0
  },
  "signals": [
    {
      "domain": "connectivity_and_access",
      "overlap": true,
      "gap_type": "CONFIRMED",
      "confidence_delta": "0.XX",
      "persona_severity_rank": 1,
      "webcrawl_severity_rank": 1,
      "persona_mention_count": 4,
      "webcrawl_source_count": 3,
      "personas_mentioning": [...],
      "competitors_mentioned": ["Obsidian"]
    }
  ]
}
```

---

## 7. Success Metrics

These are the explicit pass/fail thresholds for interpreting the run:

| Metric | Pass threshold | Fail / flag threshold | Interpretation |
|---|---|---|---|
| **Overlap rate** | ≥ 2/3 signals confirmed | < 2/3 | Personas viable for signal discovery |
| **Spearman's ρ** | ≥ 0.7 | < 0.7 | Personas reliable for prioritization ranking |
| **Confidence delta** | < 1.5 per signal | > 2.5 per signal | Scores well-calibrated vs webcrawl |
| **`WEBCRAWL_ONLY` signals** | 0 | Any | Persona blind spot — LLM prior missing real-world signal |
| **`PERSONA_ONLY` signals** | 0 | Any | Possible noise OR latent signal — flag for manual review |
| **Parse errors** | 0 | Any | scorer.js extraction failed — inspect raw response |

### What to do on failure

- **Low overlap rate (<2/3):** Persona system prompts may be too abstract. Tighten role specificity and re-run.
- **Low Spearman's ρ (<0.7):** Severity rankings diverge from engagement signals. Check if webcrawl_severity values need recalibration or if a persona is outlier-scoring.
- **High confidence delta (>2.5):** One signal is over/under-weighted by personas. Check which persona is driving the outlier score.
- **WEBCRAWL_ONLY:** A real pain point that personas didn't surface. This is the most important failure mode — indicates LLM training prior doesn't include enough signal for this complaint.

---

## 8. Ground Truth Benchmarks

Derived from `raw_items.json` webcrawl. These are the benchmarks persona output is measured against.

| Domain | Signal label | Sources | Peak upvotes | Webcrawl severity | Webcrawl confidence | Competitor evidence |
|---|---|---|---|---|---|---|
| `connectivity_and_access` | Offline mode broken | HN ×2, Play Store ×1 | 28 | 8.5 | 7.2 | Obsidian |
| `integrations_and_extensibility` | MCP/integration gaps | G2 ×2, HN ×1 | 31 | 7.5 | 6.8 | Coda, Obsidian |
| `ai_and_intelligence` | Notion AI scope limited | G2 ×1, Play Store ×1 | 25 | 6.0 | 5.1 | — |

Severity values are inferred from review language ("completely broken" → 8.5, "years behind" → 7.5, softer 3–4 star language → 6.0).

---

## 9. Setup & Run

```bash
# 1. Install dependencies
cd notion-persona-research
npm install

# 2. Set API key
export ANTHROPIC_API_KEY=your_key_here

# 3. Run
node index.js

# 4. Inspect outputs
cat output/raw_responses.json   # 12 entries
cat output/scored.json          # 3 domain aggregates
cat output/comparison.json      # spearman_rho, overlap_rate, signals
```

**Expected runtime:** ~2–3 minutes (24 API calls + 500ms buffers)  
**Cost:** < $0.10 at claude-sonnet-4-6 pricing
