export async function extractScores(client, responseText, domain) {
  const extractionPrompt = `Extract the structured scores from this Notion user
response. Return ONLY valid JSON, no markdown, no explanation.

Response to parse:
"""
${responseText}
"""

Return this exact structure:
{
  "pain_point_mentioned": true | false,
  "pain_point_label": "short label for the main complaint, max 6 words",
  "severity": <number 1-10 or null if not stated>,
  "frequency": <number 1-10 or null if not stated>,
  "switch_likelihood": <number 1-10 or null if not stated>,
  "competitor_mentioned": <string name of competitor or null>,
  "workaround_described": true | false,
  "workaround_text": "<one sentence summary of workaround or null>",
  "confidence_score": <derived score: (severity * 0.4) + (frequency * 0.3) + (switch_likelihood * 0.3), rounded to 2dp>
}`;

  const extractionResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: "You are a data extraction assistant. Return only valid JSON.",
    messages: [{ role: "user", content: extractionPrompt }]
  });

  try {
    const raw = extractionResponse.content[0].text;
    // Extract the outermost JSON object regardless of surrounding markdown
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("no JSON object found");
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { parse_error: true, raw: extractionResponse.content[0].text };
  }
}
