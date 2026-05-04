import { GROUND_TRUTH } from "./ground_truth.js";

export function compare(scored) {
  const results = [];

  for (const signal of scored) {
    const truth = GROUND_TRUTH.find(g => g.domain === signal.domain);
    if (!truth) continue;

    const overlap = signal.mention_count >= 2;
    const persona_severity = parseFloat(signal.avg_severity);
    const webcrawl_severity = truth.webcrawl_severity;

    const persona_only = signal.mention_count >= 2 && !truth.in_webcrawl;
    const webcrawl_only = truth.in_webcrawl && signal.mention_count < 2;

    const personaConf = parseFloat(signal.avg_confidence);
    const confidence_delta = truth.webcrawl_confidence !== null && !isNaN(personaConf)
      ? Math.abs(personaConf - truth.webcrawl_confidence).toFixed(2)
      : null;

    results.push({
      domain: signal.domain,
      overlap,
      gap_type: persona_only ? "PERSONA_ONLY"
               : webcrawl_only ? "WEBCRAWL_ONLY"
               : overlap ? "CONFIRMED"
               : "UNDETECTED",
      confidence_delta,
      persona_mention_count: signal.mention_count,
      webcrawl_source_count: truth.source_count,
      personas_mentioning: signal.personas_mentioning,
      competitors_mentioned: signal.competitors_mentioned,
      // kept for rank computation below
      _persona_severity: isNaN(persona_severity) ? 0 : persona_severity,
      _webcrawl_severity: webcrawl_severity
    });
  }

  // Assign severity ranks for Spearman's rho
  const byPersonaSeverity = [...results].sort((a, b) => b._persona_severity - a._persona_severity);
  const byWebcrawlSeverity = [...results].sort((a, b) => b._webcrawl_severity - a._webcrawl_severity);

  results.forEach(r => {
    r.persona_severity_rank = byPersonaSeverity.indexOf(r) + 1;
    r.webcrawl_severity_rank = byWebcrawlSeverity.indexOf(r) + 1;
    delete r._persona_severity;
    delete r._webcrawl_severity;
  });

  const n = results.length;
  const d2sum = results.reduce((sum, r) =>
    sum + Math.pow(r.persona_severity_rank - r.webcrawl_severity_rank, 2), 0);
  const spearman_rho = n > 1
    ? 1 - (6 * d2sum) / (n * (n * n - 1))
    : null;

  return {
    spearman_rho: spearman_rho !== null ? spearman_rho.toFixed(3) : null,
    overlap_rate: `${results.filter(r => r.overlap).length}/${results.length}`,
    summary: {
      confirmed: results.filter(r => r.gap_type === "CONFIRMED").length,
      persona_only: results.filter(r => r.gap_type === "PERSONA_ONLY").length,
      webcrawl_only: results.filter(r => r.gap_type === "WEBCRAWL_ONLY").length,
      undetected: results.filter(r => r.gap_type === "UNDETECTED").length
    },
    signals: results
  };
}
