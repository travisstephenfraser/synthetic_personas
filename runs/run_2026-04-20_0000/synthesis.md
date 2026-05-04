# Run Synthesis — 2026-04-20

**Model:** claude-sonnet-4-6
**Personas:** 4 (power_user, solo_creator, product_manager, enterprise)
**Domains probed:** 3 (connectivity, integrations, AI)
**Total API calls:** 24
**Scorer fix:** JSON extraction via `indexOf("{")` — no parse errors this run

---

## Headline Results

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Overlap rate | 3/3 | ≥ 2/3 | ✅ Pass |
| Spearman's ρ | 0.500 | ≥ 0.7 | ⚠️ Borderline |
| Max confidence delta | 1.76 (AI domain) | < 1.5 warn / > 2.5 flag | ⚠️ Slight over-weight |
| WEBCRAWL_ONLY signals | 0 | 0 | ✅ Pass |
| PERSONA_ONLY signals | 0 | 0 | ✅ Pass |
| Parse errors | 0 | 0 | ✅ Pass |

All 3 webcrawl signals confirmed. No blind spots, no noise signals.

---

## Signal-by-Signal Breakdown

### 1. Connectivity & Offline Access

| | Persona avg | Webcrawl | Delta |
|---|---|---|---|
| Severity | 7.00 | 8.5 | −1.5 |
| Frequency | 5.25 | — | — |
| Switch likelihood | 4.50 | — | — |
| Confidence | 5.72 | 7.2 | −1.48 ✅ |

**Personas mentioning:** all 4 · **Workarounds found:** 4/4 · **Rank:** personas #2, webcrawl #1

**What they said in plain terms:** Every persona had a concrete story — a flight, a train ride, an offsite — where Notion failed silently with no indicator. Pages appeared to load but were read-only or blank. No one said "offline mode doesn't exist"; they said "I don't know what's cached until I need it." All 4 described workarounds they'd adopted: screenshots before travel, Apple Notes as fallback, parallel OneNote notebooks, scheduled PDF exports.

**Rank divergence note:** Webcrawl ranks this #1 (severity 8.5, "completely broken" language). Personas rank it #2 (severity 7.0). Likely because enterprise and PM personas have higher tolerance for connectivity friction than the consumers leaving Play Store reviews.

**Competitors named:** Linear (sync transparency), Confluence (offline reliability), Google Docs

---

### 2. Integrations & Extensibility

| | Persona avg | Webcrawl | Delta |
|---|---|---|---|
| Severity | 7.25 | 7.5 | −0.25 |
| Frequency | 8.50 | — | — |
| Switch likelihood | 5.25 | — | — |
| Confidence | 7.75 | 6.8 | +0.95 ✅ |

**Personas mentioning:** all 4 · **Workarounds found:** 4/4 · **Rank:** personas #1, webcrawl #2

**What they said in plain terms:** The most concrete and detailed responses of the three domains. Every persona described a specific broken integration — GitHub sync that's decoration-only, Zapier bridges that fire inconsistently, HubSpot with no service account auth, Jira middleware that silently hit rate limits during incidents. The shared complaint: Notion's integrations are one-directional and stateless. Changes in external tools don't flow back. The workaround in all four cases was some form of manual reconciliation — weekly Monday syncs, bi-weekly copy-paste meetings, custom-built middleware.

**Rank divergence note:** Personas rank this #1 while webcrawl ranked it #2. This makes sense — direct users living in these workflows feel the integration gap more acutely than review writers. The frequency score of 8.5 (highest of any metric in the run) reinforces this.

**Competitors named:** Linear (native GitHub sync), HubSpot (bidirectional field mapping), Confluence (Atlassian ecosystem depth)

---

### 3. AI & Intelligence

| | Persona avg | Webcrawl | Delta |
|---|---|---|---|
| Severity | 7.00 | 6.0 | +1.0 |
| Frequency | 7.75 | — | — |
| Switch likelihood | 5.75 | — | — |
| Confidence | 6.86 | 5.1 | +1.76 ⚠️ |

**Personas mentioning:** all 4 · **Workarounds found:** 4/4 · **Rank:** personas #3, webcrawl #3

**What they said in plain terms:** The tone here was more resigned than the other two domains — less "this is broken" and more "this is a squandered opportunity." All 4 personas described the exact same gap independently: Notion AI only sees the page you're on, not the workspace. The workaround was also universal — all 4 described exporting data or copy-pasting context into an external AI (Claude, ChatGPT, Copilot) to do what Notion AI should do natively. Enterprise added a dimension not in the question bank: the absence of an AI audit trail is a compliance liability, not just a missing feature.

**Confidence delta note (⚠️ 1.76):** Personas rate this signal higher than webcrawl implied. Likely because this is a newer complaint — AI gaps don't generate Play Store reviews the way crashes do, but they're felt acutely by heavy users.

**Competitors named:** Claude, ChatGPT, Microsoft Copilot (all named as the workaround tool, not just a comparison)

---

## Cross-Signal Patterns

**1. Silent failure is the meta-theme.** Across all 3 domains the frustration isn't that features don't exist — it's that they appear to work and fail quietly. Offline pages load with a spinner. Zapier integrations fire 0 or 3 times. AI generates plausible text with no workspace context. This surfaced unprompted across every persona and every domain.

**2. Every persona has a workaround stack.** 12/12 responses described an active workaround. This suppresses switch likelihood (it's a 4.5–5.75 range across domains) but signals deeper entrenchment of frustration — users have invested effort adapting to the limitations.

**3. The external AI workaround is a product signal.** All 4 personas independently described copying Notion content into Claude or ChatGPT. This is the clearest single indicator of what Notion AI should be doing and isn't.

**4. Spearman's ρ = 0.500 — one rank inversion.** Personas rank integrations #1, connectivity #2, AI #3. Webcrawl ranks connectivity #1, integrations #2, AI #3. The inversion (connectivity vs. integrations) is directionally meaningful: daily users feel the integration gap more than occasional travelers feel the offline gap.

---

## Success Metric Scorecard

| Metric | Result | Threshold | Call |
|---|---|---|---|
| Overlap rate | 3/3 | ≥ 2/3 | ✅ Personas viable for signal discovery |
| Spearman's ρ | 0.500 | ≥ 0.7 | ⚠️ Rank order partially aligned — one signal inversion |
| Confidence delta — connectivity | 1.48 | < 1.5 | ✅ Well-calibrated (just under threshold) |
| Confidence delta — integrations | 0.95 | < 1.5 | ✅ Well-calibrated |
| Confidence delta — AI | 1.76 | < 2.5 | ⚠️ Slight over-weight — personas feel this more than webcrawl |
| WEBCRAWL_ONLY | 0 | 0 | ✅ No persona blind spots |
| PERSONA_ONLY | 0 | 0 | ✅ No noise signals |

---

## What to Do Next

| Priority | Action | Why |
|---|---|---|
| 1 | Probe "silent failure" as its own domain | Emerged cross-domain in every persona — not in original question bank, likely its own signal |
| 2 | Investigate AI confidence delta (1.76) | Personas feel AI gaps more strongly than webcrawl; could be a latent high-priority signal underrepresented in reviews |
| 3 | Explore Spearman's ρ divergence | Personas rank integrations above offline; webcrawl is the reverse — worth a dedicated round probing why |
| 4 | Add a 5th persona: mobile-first casual user | All current personas are power users; the Play Store reviews (which drove the offline signal) suggest a lighter-use audience not represented here |

---

## Files in This Run

| File | Status |
|---|---|
| `raw_responses.json` | ✅ 12 valid responses, all scores parsed cleanly |
| `scored.json` | ✅ Valid aggregates for all 3 domains |
| `comparison.json` | ✅ 3/3 confirmed, ρ = 0.500, all deltas < 2.5 |
| `synthesis.md` | This file |
