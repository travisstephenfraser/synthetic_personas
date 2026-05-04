import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { PERSONAS } from "./personas.js";
import { QUESTION_SETS } from "./prompts.js";
import { extractScores } from "./scorer.js";
import { compare } from "./comparator.js";
import fs from "fs";

const client = new Anthropic();
const rawResponses = [];

for (const persona of PERSONAS) {
  for (const questionSet of QUESTION_SETS) {
    console.log(`Running: ${persona.id} × ${questionSet.domain}`);

    const userPrompt = `Please answer each of the following questions about
your experience with Notion. Be specific and authentic.

${questionSet.questions.map((q, i) => `Q${i + 1}: ${q}`).join("\n\n")}

After your answers, rate the following on a scale of 1–10:
- How severely does this area of Notion impact your productivity? (1=minor, 10=blocking)
- How often do you encounter issues in this area? (1=rarely, 10=daily)
- How likely are you to switch tools because of this? (1=not likely, 10=actively looking)

Format your severity ratings at the end as:
SEVERITY: X/10
FREQUENCY: X/10
SWITCH_LIKELIHOOD: X/10`;

    const generationResponse = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: persona.system_prompt,
      messages: [{ role: "user", content: userPrompt }]
    });

    const responseText = generationResponse.content[0].text;
    const scores = await extractScores(client, responseText, questionSet.domain);

    rawResponses.push({
      persona_id: persona.id,
      domain: questionSet.domain,
      response_text: responseText,
      scores
    });

    await new Promise(r => setTimeout(r, 500));
  }
}

fs.mkdirSync("output", { recursive: true });
fs.writeFileSync("output/raw_responses.json", JSON.stringify(rawResponses, null, 2));

const scored = aggregateScores(rawResponses);
fs.writeFileSync("output/scored.json", JSON.stringify(scored, null, 2));

const comparison = compare(scored);
fs.writeFileSync("output/comparison.json", JSON.stringify(comparison, null, 2));

console.log("Done. See output/ directory.");

function aggregateScores(rawResponses) {
  const byDomain = {};

  for (const item of rawResponses) {
    if (!byDomain[item.domain]) {
      byDomain[item.domain] = { responses: [], personas_mentioning: [] };
    }
    byDomain[item.domain].responses.push(item);
    if (item.scores.pain_point_mentioned) {
      byDomain[item.domain].personas_mentioning.push(item.persona_id);
    }
  }

  return Object.entries(byDomain).map(([domain, data]) => {
    const validScores = data.responses
      .map(r => r.scores)
      .filter(s => !s.parse_error && s.severity !== null);

    const avg = arr => {
      const nums = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
      return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null;
    };

    return {
      domain,
      mention_count: data.personas_mentioning.length,
      personas_mentioning: data.personas_mentioning,
      avg_severity: avg(validScores.map(s => s.severity)),
      avg_frequency: avg(validScores.map(s => s.frequency)),
      avg_switch_likelihood: avg(validScores.map(s => s.switch_likelihood)),
      avg_confidence: avg(validScores.map(s => s.confidence_score)),
      competitors_mentioned: [...new Set(
        validScores.map(s => s.competitor_mentioned).filter(Boolean)
      )],
      workarounds_found: validScores.filter(s => s.workaround_described).length
    };
  });
}
