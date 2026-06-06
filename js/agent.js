// ═══════════════════════════════════════════════════════
// AGENT — Mimo API integration for creature decisions
// ═══════════════════════════════════════════════════════

import { CONFIG } from "./config.js";

export class Agent {
  constructor() {
    this.apiKey = localStorage.getItem("mimo_api_key") || "";
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem("mimo_api_key", key);
  }

  hasKey() {
    return !!this.apiKey;
  }

  // Build prompt for a creature
  buildPrompt(worldView, worldSummary) {
    const v = worldView;
    const inv = Object.entries(v.inventory)
      .filter(([, amt]) => amt > 0)
      .map(([res, amt]) => `${res}: ${amt}`)
      .join(", ") || "nothing";

    const visibleResources = v.visible
      .filter((c) => Object.keys(c.resources).length > 0)
      .map((c) => `(${c.x},${c.y}) ${Object.entries(c.resources).map(([r, a]) => a + " " + r).join(", ")}`)
      .join("; ") || "none nearby";

    const nearbyCreatures = v.visible
      .filter((c) => c.creatures.length > 0)
      .flatMap((c) => c.creatures.map((cr) => `${cr.emoji} ${cr.name} at (${c.x},${c.y}) [${Object.entries(cr.inventory).filter(([,a]) => a > 0).map(([r,a]) => r + ":" + a).join(", ")}]`))
      .join("; ") || "no one nearby";

    const gossip = v.gossip.length > 0
      ? v.gossip.map((g) => `${g.from} (tick ${g.tick}): "${g.text}"`).join("\n")
      : "none";

    const world = `Tick: worldSummary.tick | ${worldSummary.alive} creatures alive`;

    return `You are ${v.emoji} ${v.name}, a ${v.species}. ${v.personality}

WORLD: ${CONFIG.WORLD_NAME}. ${CONFIG.WORLD_DESC}
${world}

YOUR STATE:
- Position: (${v.x}, ${v.y})
- Stats: hunger ${v.stats.hunger}/100, energy ${v.stats.energy}/100, mood ${v.stats.mood}/100
- Inventory: ${inv}
- Pebbles: ${v.pebbles}

VISIBLE:
- Resources: ${visibleResources}
- Creatures: ${nearbyCreatures}

GOSSIP:
${gossip}

Choose ONE action. Be true to your personality. Respond with ONLY valid JSON:
{"type":"move","dx":0,"dy":-1,"reasoning":"why"}
{"type":"forage","resource":"berries","reasoning":"why"}
{"type":"trade","targetId":"fern","give":"berries","giveAmount":1,"get":"wood","getAmount":1,"reasoning":"why"}
{"type":"gossip","targetId":"moss","message":"what you say","reasoning":"why"}
{"type":"rest","reasoning":"why"}
{"type":"hoard","reasoning":"why"}

Rules: dx/dy must be -1, 0, or 1. Resource names: ${Object.keys(CONFIG.RESOURCES).join(", ")}. Creature IDs: ${CONFIG.CREATURES.map(c => c.id).join(", ")}. If hunger < 20, prioritize forage. If energy < 20, rest. Trade only if you see the target nearby. Respond with ONLY the JSON object, nothing else.`;
  }

  // Call Mimo API
  async callAPI(prompt) {
    if (!this.apiKey) throw new Error("No API key set");

    const response = await fetch(CONFIG.API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: CONFIG.API_MODEL,
        messages: [
          { role: "system", content: "You are a creature in a simulation. Respond with ONLY valid JSON for your action. No markdown, no explanation, just the JSON object." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
        enable_thinking: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return this._parseAction(content);
  }

  _parseAction(content) {
    // Strip markdown code fences
    let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    // Try direct parse
    try {
      return JSON.parse(cleaned);
    } catch {}

    // Try extracting JSON from the response
    const match = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }

    // Fallback: rest
    return { type: "rest", reasoning: "confused, resting" };
  }

  // Get action for a creature
  async getAction(creature, worldView, worldSummary) {
    const prompt = this.buildPrompt(worldView, worldSummary);
    try {
      const action = await this.callAPI(prompt);
      return action;
    } catch (err) {
      console.error(`Agent error for ${creature.name}:`, err);
      return { type: "rest", reasoning: `error: ${err.message}` };
    }
  }
}
