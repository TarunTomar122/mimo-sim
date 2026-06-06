// ═══════════════════════════════════════════════
// AGENT — Mimo API with memory
// ═══════════════════════════════════════════════

import { CONFIG } from "./config.js";

export class Agent {
  constructor() {
    this.apiKey = localStorage.getItem("mimo_api_key") || CONFIG.API_KEY || "";
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem("mimo_api_key", key);
  }

  hasKey() { return !!this.apiKey; }

  buildPrompt(worldView, worldSummary) {
    const v = worldView;

    const inv = Object.entries(v.inventory)
      .filter(([, amt]) => amt > 0)
      .map(([res, amt]) => res + ": " + amt)
      .join(", ") || "nothing";

    const visibleResources = v.visible
      .filter((c) => Object.keys(c.resources).length > 0)
      .map((c) => "(" + c.x + "," + c.y + ") " + Object.entries(c.resources).map(([r, a]) => a + " " + r).join(", "))
      .join("; ") || "none nearby";

    const nearbyCreatures = v.visible
      .filter((c) => c.creatures.length > 0)
      .flatMap((c) => c.creatures.map((cr) => {
        const crInv = Object.entries(cr.inventory).filter(([,a]) => a > 0).map(([r,a]) => r + ":" + a).join(", ") || "empty";
        return cr.emoji + " " + cr.name + " at (" + c.x + "," + c.y + ") [hunger:" + cr.stats.hunger + " inv:" + crInv + "]";
      }))
      .join("; ") || "no one nearby";

    const gossip = v.gossip.length > 0
      ? v.gossip.map((g) => g.from + " (T" + g.tick + '): "' + g.text + '"').join("\n")
      : "none";

    const memory = v.memory.length > 0
      ? v.memory.map((m) => "T" + m.tick + ": " + m.text).join("\n")
      : "no memories yet";

    const resList = Object.keys(CONFIG.RESOURCES).join(", ");
    const creatureIds = CONFIG.CREATURES.map(c => c.id).join(", ");

    return "You are " + v.emoji + " " + v.name + ", a " + v.species + ". " + v.personality + "\n\n" +
      "WORLD: " + CONFIG.WORLD_NAME + ". " + CONFIG.WORLD_DESC + "\n" +
      "Tick " + worldSummary.tick + " | " + worldSummary.alive + " of 3 alive\n\n" +
      "YOUR STATE:\n" +
      "- Position: (" + v.x + "," + v.y + ")\n" +
      "- Hunger: " + v.stats.hunger + "/100" + (v.stats.hunger < 30 ? " (DANGER)" : v.stats.hunger < 50 ? " (low)" : "") + "\n" +
      "- Thirst: " + v.stats.thirst + "/100" + (v.stats.thirst < 30 ? " (DANGER)" : v.stats.thirst < 50 ? " (low)" : "") + "\n" +
      "- Energy: " + v.stats.energy + "/100 | Mood: " + v.stats.mood + "/100\n" +
      "- Inventory: " + inv + "\n\n" +
      "VISIBLE:\n" +
      "- Resources: " + visibleResources + "\n" +
      "- Creatures: " + nearbyCreatures + "\n\n" +
      "YOUR MEMORY (recent):\n" + memory + "\n\n" +
      "GOSSIP:\n" + gossip + "\n\n" +
      "Choose ONE action. Be true to your personality. Use your memory to make decisions.\n" +
      'Actions:\n' +
      '{"type":"move","dx":0,"dy":-1,"reasoning":"why"}\n' +
      '{"type":"forage","resource":"food","reasoning":"why"}\n' +
      '{"type":"eat","reasoning":"why"}\n' +
      '{"type":"drink","reasoning":"why"}\n' +
      '{"type":"give","targetId":"luna","resource":"food","amount":1,"reasoning":"why"}\n' +
      '{"type":"take","targetId":"reef","resource":"water","amount":1,"reasoning":"why"}\n' +
      '{"type":"gossip","targetId":"ivy","message":"what you say","reasoning":"why"}\n' +
      '{"type":"rest","reasoning":"why"}\n' +
      '{"type":"hoard","reasoning":"why"}\n\n' +
      "Rules: dx/dy must be -1, 0, or 1. Resources: " + resList + ". IDs: " + creatureIds + ". If hunger < 25, eat or forage. If thirst < 25, drink. Respond with ONLY the JSON object.";
  }

  async callAPI(prompt) {
    if (!this.apiKey) throw new Error("No API key set");

    const response = await fetch(CONFIG.API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + this.apiKey,
      },
      body: JSON.stringify({
        model: CONFIG.API_MODEL,
        messages: [
          { role: "system", content: "You are a character on a desert island. Respond with ONLY valid JSON for your action. No markdown, no explanation, just the JSON object." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        enable_thinking: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error("API error " + response.status + ": " + err);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return this._parseAction(content);
  }

  _parseAction(content) {
    let cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    try { return JSON.parse(cleaned); } catch {}
    const match = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch {} }
    return { type: "rest", reasoning: "confused, resting" };
  }

  async getAction(creature, worldView, worldSummary) {
    const prompt = this.buildPrompt(worldView, worldSummary);
    try {
      return await this.callAPI(prompt);
    } catch (err) {
      console.error("Agent error for " + creature.name + ":", err);
      return { type: "rest", reasoning: "error: " + err.message };
    }
  }
}
