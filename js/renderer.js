// ═══════════════════════════════════════════════
// RENDERER — UI
// ═══════════════════════════════════════════════

import { CONFIG } from "./config.js";

export class Renderer {
  constructor(world) {
    this.world = world;
    this.thinkingId = null;
  }

  setThinking(creatureId) {
    this.thinkingId = creatureId;
    this.render();
  }

  render() {
    this._renderGrid();
    this._renderCreatures();
    this._renderEvents();
  }

  _renderGrid() {
    const gridEl = document.getElementById("world-grid");
    if (!gridEl) return;

    let html = "";
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        const cell = this.world.grid[y][x];
        const resources = Object.entries(cell)
          .filter(([, amt]) => amt > 0)
          .map(([res, amt]) => '<span class="resource">' + (CONFIG.RESOURCES[res]?.emoji || "?") + (amt > 1 ? amt : "") + '</span>')
          .join("");

        const creaturesHere = this.world.creatures
          .filter((c) => c.alive && c.x === x && c.y === y)
          .map((c) => {
            const cls = c.id === this.thinkingId ? "creature-marker thinking" : "creature-marker";
            return '<span class="' + cls + '" title="' + c.name + '">' + c.emoji + '</span>';
          })
          .join("");

        const isEdge = x === 0 || y === 0 || x === CONFIG.GRID_SIZE - 1 || y === CONFIG.GRID_SIZE - 1;
        const cellClass = isEdge ? "cell beach" : "cell jungle";

        html += '<div class="' + cellClass + '">' + resources + creaturesHere + '<span class="cell-coord">' + x + ',' + y + '</span></div>';
      }
    }
    gridEl.innerHTML = html;
  }

  _renderCreatures() {
    const panelEl = document.getElementById("creatures-panel");
    if (!panelEl) return;

    let html = "";
    for (const c of this.world.creatures) {
      const cls = c.alive ? "" : " dead";
      const thk = c.id === this.thinkingId ? " thinking" : "";

      const inv = Object.entries(c.inventory)
        .filter(([, amt]) => amt > 0)
        .map(([res, amt]) => (CONFIG.RESOURCES[res]?.emoji || "?") + amt)
        .join(" ") || "empty";

      const hungerCls = c.stats.hunger < 25 ? " danger" : c.stats.hunger < 45 ? " warn" : "";
      const thirstCls = c.stats.thirst < 25 ? " danger" : c.stats.thirst < 45 ? " warn" : "";
      const energyCls = c.stats.energy < 25 ? " danger" : c.stats.energy < 45 ? " warn" : "";

      html += '<div class="creature-card' + cls + thk + '">' +
        '<div class="creature-header">' +
          '<span class="creature-emoji">' + c.emoji + '</span>' +
          '<span class="creature-name">' + c.name + '</span>' +
          '<span class="creature-species">' + c.species + '</span>' +
          (c.lastAction ? '<span class="action-badge">' + c.lastAction + '</span>' : '') +
        '</div>' +
        '<div class="creature-stats">' +
          '<div class="stat-bar' + hungerCls + '"><span class="stat-label">🍖</span><div class="bar"><div class="bar-fill" style="width:' + c.stats.hunger + '%"></div></div><span class="stat-val">' + c.stats.hunger + '</span></div>' +
          '<div class="stat-bar' + thirstCls + '"><span class="stat-label">💧</span><div class="bar"><div class="bar-fill thirst" style="width:' + c.stats.thirst + '%"></div></div><span class="stat-val">' + c.stats.thirst + '</span></div>' +
          '<div class="stat-bar' + energyCls + '"><span class="stat-label">⚡</span><div class="bar"><div class="bar-fill energy" style="width:' + c.stats.energy + '%"></div></div><span class="stat-val">' + c.stats.energy + '</span></div>' +
          '<div class="stat-bar"><span class="stat-label">😊</span><div class="bar"><div class="bar-fill mood" style="width:' + c.stats.mood + '%"></div></div><span class="stat-val">' + c.stats.mood + '</span></div>' +
        '</div>' +
        '<div class="creature-inv"><span class="inv-label">🎒</span> ' + inv + '</div>' +
        (c.lastReasoning ? '<div class="creature-thought">💭 "' + c.lastReasoning + '"</div>' : '') +
        (c.memory.length > 0 ? '<div class="creature-memory"><span class="mem-label">🧠 Last:</span> ' + c.memory[c.memory.length - 1].text + '</div>' : '') +
        (c.gossip.length > 0 ? '<div class="creature-gossip">🗣️ ' + c.gossip[c.gossip.length - 1].from + ': "' + c.gossip[c.gossip.length - 1].text + '"</div>' : '') +
        '<div class="creature-pos">📍 (' + c.x + ',' + c.y + ')</div>' +
      '</div>';
    }
    panelEl.innerHTML = html;
  }

  _renderEvents() {
    const logEl = document.getElementById("event-log");
    if (!logEl) return;

    const events = this.world.events.slice(-60).reverse();
    let html = "";
    for (const e of events) {
      html += '<div class="event ' + e.type + '"><span class="event-tick">T' + e.tick + '</span><span class="event-msg">' + e.message + '</span></div>';
    }
    logEl.innerHTML = html;
  }
}
