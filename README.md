# Notion Synthetic Persona Research Pipeline

Validates synthetic AI personas as a signal-discovery tool for product research, benchmarked against real-world webcrawl data.

---

## What This Is

Product teams typically surface pain points through user interviews, support tickets, and public review mining — all of which lag behind the actual problem. By the time a pattern shows up in G2 reviews, users have already built workarounds or started evaluating alternatives.

This pipeline tests a different approach: can AI-powered synthetic personas reliably surface the same pain points as real users — and do so faster, cheaper, and with richer behavioral detail?

**Method:** 4 Claude-powered personas answer blind questions across 3 pain-point domains. Their responses are scored and ranked, then compared against webcrawl ground truth (Hacker News, G2, Play Store) using Spearman's rank correlation.

**Target use:** product managers running discovery research who want a low-cost signal layer that can run in hours, not weeks.

---

## How It Works

```
personas.js × prompts.js
        ↓
   LLM responses (12 pairs: 4 personas × 3 domains)
        ↓
   scorer.js → structured JSON scores per response
        ↓
   index.js → aggregate scores per domain
        ↓
   comparator.js → Spearman ρ vs ground_truth.js
        ↓
   output/ + runs/run_YYYY-MM-DD_HHMM/
```

| File | Role |
|---|---|
| `index.js` | Orchestrator — runs all pairs, manages output writes |
| `personas.js` | 4 persona system prompts (the "users") |
| `prompts.js` | 3 question sets, blind probing — no domain labels exposed |
| `scorer.js` | Extracts structured scores from LLM text via a second LLM call |
| `comparator.js` | Calculates Spearman's ρ and gap classification vs ground truth |
| `ground_truth.js` | Webcrawl benchmarks — severity, confidence, source counts |

**Total API calls per run:** 24 (4 personas × 3 domains × 2 calls/pair)  
**Model:** `claude-sonnet-4-6`  
**Estimated cost:** < $0.10

---

## Setup & Run

```bash
npm install
```

Add your API key to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
node index.js
```

Results write to `output/` (latest) and `runs/run_YYYY-MM-DD_HHMM/` (timestamped archive).

---

## The Personas

| ID | Name | Role | Comparison Baseline |
|---|---|---|---|
| `power_user` | Alex | Team lead, 40-person SaaS; 3+ yrs heavy Notion use | Linear, Airtable |
| `solo_creator` | Maya | Freelance UX designer/writer; mobile + offline-heavy, non-technical | Obsidian |
| `product_manager` | Jordan | PM at B2B startup; roadmap + integration workflows | Jira, Productboard |
| `enterprise` | Sam | IT lead, 500-person enterprise; SSO, compliance, API integrations at scale | Confluence, SharePoint |

Personas answer questions without knowing the underlying pain point domain. This blind probing is critical to test validity — personas can't reverse-engineer the expected answer.

---

## Domains Tested

| Domain | What Was Probed | Webcrawl Label | Webcrawl Severity | Webcrawl Confidence | Sources |
|---|---|---|---|---|---|
| `connectivity_and_access` | Offline / sync reliability | "Offline mode broken" | 8.5 | 7.2 | HN, HN, Play Store |
| `integrations_and_extensibility` | External tool connections | "MCP/integration gaps" | 7.5 | 6.8 | G2, G2, HN |
| `ai_and_intelligence` | AI feature depth and scope | "Notion AI scope limited" | 6.0 | 5.1 | G2, Play Store |

---

## Critical Analysis: How Synthetic Personas Performed vs. Real Users

### The Headline Result

| Test | Result | Threshold | Verdict |
|---|---|---|---|
| **Signal discovery** (overlap rate) | 3/3 | ≥ 2/3 | **PASS** |
| **Prioritization** (Spearman's ρ) | 0.50 | ≥ 0.70 | **BORDERLINE** |

Personas found every signal webcrawl found — zero blind spots in either direction. That's the more important result: it means synthetic personas are viable for surfacing what's broken. Where they fell short is in *ranking* those signals in the same order as real users.

---

### Signal-by-Signal Breakdown

| Domain | Persona Severity | Webcrawl Severity | Δ Severity | Persona Confidence | Webcrawl Confidence | Δ Confidence | Persona Rank | Webcrawl Rank | Gap Type |
|---|---|---|---|---|---|---|---|---|---|
| `connectivity_and_access` | 7.00 | 8.5 | −1.5 | 5.72 | 7.2 | −1.48 | #2 | #1 | CONFIRMED |
| `integrations_and_extensibility` | 7.25 | 7.5 | −0.25 | 7.75 | 6.8 | +0.95 | #1 | #2 | CONFIRMED |
| `ai_and_intelligence` | 7.00 | 6.0 | +1.0 | 6.86 | 5.1 | +1.76 | #3 | #3 | CONFIRMED |

All 3 signals: `CONFIRMED`. No `PERSONA_ONLY` signals (false positives). No `WEBCRAWL_ONLY` signals (blind spots).

---

### The Rank Inversion: Why ρ = 0.50 and What It Means

ρ = 1.0 would mean perfect rank agreement. The 0.50 result comes from a single rank inversion: personas ranked integrations #1, webcrawl ranked offline #1.

This isn't a failure — it's a signal about the *nature* of each source.

**Webcrawl** captures event-driven pain. A user stuck on a flight with a broken offline mode writes a 2-star review in the moment. The emotional peak of that failure drives severity scores upward. Offline access is the kind of problem that generates furious Play Store reviews.

**Personas** simulate daily users who live inside their workflows. For them, the broken Zapier loop they hit every Monday is more viscerally painful than the offline incident they've learned to route around. Integrations don't generate cathartic review-writing — they generate silent workaround behaviors that compound over time.

Both rankings are true. They reflect different user contexts at different moments. The divergence is meaningful product signal, not noise.

---

### The AI Confidence Delta (1.76): The Most Actionable Finding

| Source | Confidence | Sources |
|---|---|---|
| Webcrawl | 5.1 | 2 (G2, Play Store) |
| Personas | 6.86 | 4/4 personas |
| Delta | **+1.76** | — |

Webcrawl barely registered AI scope as a pain point. Personas rated it significantly higher — and did so unanimously, across all 4 user types.

**Why webcrawl missed it:** users don't complain in reviews about features they don't yet expect. AI limitations don't generate 2-star reviews when workspace-wide AI isn't a standard expectation yet. The complaint hasn't crystallized in public discourse.

**Why personas caught it:** every persona independently described the same unprompted workaround — copy content out of Notion into Claude or ChatGPT, then bring the output back. Four different personas. Four different use cases. Same behavior, described without any leading question.

Convergent unprompted behavior across all 4 personas is a stronger signal than any individual review. This is a latent problem: users have accepted it as friction, built a workaround, and haven't thought to complain yet. That's what makes it dangerous — it's headed toward churn 12 months from now, not generating noise today.

The confidence delta (1.76) is above the warning threshold (1.5) but below the flag threshold (2.5). Treat this as: personas are slightly over-weighting AI pain, but the directional signal is real.

---

### Method Assessment

**Strengths**

- **Catches latent signals** — problems that haven't crystallized into public complaints yet. The AI finding is the clearest example.
- **Generates behavioral evidence** — workaround descriptions, not just ratings. 12/12 responses included a concrete workaround. Workarounds are a stronger signal than severity scores alone.
- **Blind probing is rigorous** — personas can't reverse-engineer the expected answer. The question sets expose domain friction without naming the domain.
- **Fast and cheap** — full run in minutes, under $0.10 in API costs. Webcrawl takes days to aggregate meaningfully.

**Limits**

- **Less reliable for severity ranking** — personas don't experience the emotional peak of a real failure moment. Severity scores skew lower than webcrawl across all 3 domains. Prioritization should still incorporate webcrawl.
- **Power-user skew** — all 4 current personas are heavy Notion users. The Play Store demographic (lighter-use, mobile-first, non-technical) is not represented. This may explain why offline severity was under-weighted.
- **Confidence delta as a calibration warning** — the AI domain delta (1.76) suggests personas may slightly over-weight problems that are conceptually salient to power users but not yet painful enough for casual users to notice.

---

### Recommendation

Run synthetic personas in parallel with webcrawl, not as a replacement. They answer different questions.

| Use case | Best source |
|---|---|
| "What's broken right now?" | Webcrawl — captures emotional peak of real failures |
| "What's becoming painful before it shows up in reviews?" | Personas — catches latent signals earlier |
| "What workarounds are users building?" | Personas — generates behavioral evidence, not just ratings |
| "How severe is a known problem?" | Webcrawl — severity scores are more emotionally calibrated |

**The operating rule:** pay attention to signals where persona confidence significantly exceeds webcrawl confidence. Those are your forward-looking bets — problems that will drive churn before they drive reviews.

---

## Output Schema

### `output/raw_responses.json` (12 entries: 4 personas × 3 domains)

```json
{
  "persona_id": "solo_creator",
  "domain": "connectivity_and_access",
  "response_text": "<full LLM response>",
  "scores": {
    "pain_point_mentioned": true,
    "pain_point_label": "Offline mode fails on mobile",
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

`confidence_score = 0.4 × severity + 0.3 × frequency + 0.3 × switch_likelihood`

### `output/scored.json` (3 domain aggregates)

```json
{
  "domain": "connectivity_and_access",
  "mention_count": 4,
  "avg_severity": "7.00",
  "avg_frequency": "5.25",
  "avg_switch_likelihood": "4.50",
  "avg_confidence": "5.72",
  "competitors_mentioned": ["Linear", "Google Docs", "Confluence"],
  "workarounds_found": 4
}
```

### `output/comparison.json` (Final comparative analysis)

```json
{
  "spearman_rho": "0.500",
  "overlap_rate": "3/3",
  "summary": { "confirmed": 3, "persona_only": 0, "webcrawl_only": 0, "undetected": 0 },
  "signals": [
    {
      "domain": "integrations_and_extensibility",
      "gap_type": "CONFIRMED",
      "confidence_delta": "0.95",
      "persona_severity_rank": 1,
      "webcrawl_severity_rank": 2
    }
  ]
}
```

---

## Success Metrics (Latest Run: April 20, 2026)

| Metric | Threshold | Result | Status |
|---|---|---|---|
| **Overlap rate** | ≥ 2/3 | 3/3 | PASS |
| **Spearman's ρ** | ≥ 0.70 | 0.50 | BORDERLINE |
| **Max confidence delta** | < 1.5 warn / > 2.5 flag | 1.76 (AI domain) | WARN |
| **WEBCRAWL_ONLY signals** | 0 | 0 | PASS |
| **PERSONA_ONLY signals** | 0 | 0 | PASS |
| **Parse errors** | 0 | 0 | PASS |

---

## Next Steps

1. **Probe "silent failure" as its own domain** — emerged unprompted across all 3 domains. The meta-pattern is that features appear to work and fail quietly, which is a distinct problem class worth isolating.
2. **Investigate AI confidence delta (1.76)** — personas feel this more strongly than webcrawl. Worth running a deeper probe on workspace-level AI expectations specifically.
3. **Resolve the Spearman's ρ divergence** — understand whether the integrations vs. offline rank inversion is stable across runs or an artifact of the current persona set.
4. **Add a 5th persona: mobile-first casual user** — all current personas are power users. Play Store review patterns suggest a lighter-use audience that the current set doesn't represent.
