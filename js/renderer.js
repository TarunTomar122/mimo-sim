// ═══════════════════════════════════════════════════════
// RENDERER — UI rendering
// ═══════════════════════════════════════════════════════

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
          .map(([res, amt]) => `<span class="resource">${CONFIG.RESOURCES[res]?.emoji || "?"}${amt > 1 ? amt : ""}</span>`)
          .join("");

        const creaturesHere = this.world.creatures
          .filter((c) => c.alive && c.x === x && c.y === y)
          .map((c) => {
            const thinking = c.id === this.thinkingId ? " thinking" : "";
            return `<span class="creature-marker${thinking}" title="${c.name}">${c.emoji}</span>`;
          })
          .join("");

        html += `<div class="cell" data-x="${x}" data-y="${y}">
          ${resources}
          ${creaturesHere}
          <span class="cell-coord">${x},${y}</span>
        </div>`;
      }
    }
    gridEl.innerHTML = html;
  }

  _renderCreatures() {
    const panelEl = document.getElementById("creatures-panel");
    if (!panelEl) return;

    let html = "";
    for (const c of this.world.creatures) {
      const status = c.alive ? "" : " dead";
      const thinking = c.id === this.thinkingId ? " thinking" : "";

      const inv = Object.entries(c.inventory)
        .filter(([, amt]) => amt > 0)
        .map(([res, amt]) => `${CONFIG.RESOURCES[res]?.emoji || "?"}${amt}`)
        .join(" ") || "empty";

      const hungerClass = c.stats.hunger < 30 ? " danger" : c.stats.hunger < 50 ? " warn" : "";
      const energyClass = c.stats.energy < 30 ? " danger" : c.stats.energy < 50 ? " warn" : "";

      html += `<div class="creature-card${status}${thinking}">
        <div class="creature-header">
          <span class="creature-emoji">${c.emoji}</span>
          <span class="creature-name">${c.name}</span>
          <span class="creature-species">${c.species}</span>
          ${c.lastAction ? `<span class="action-badge">${c.lastAction}</span>` : ""}
        </div>
        <div class="creature-stats">
          <div class="stat-bar${hungerClass}">
            <span class="stat-label">🍖</span>
            <div class="bar"><div class="bar-fill" style="width:${c.stats.hunger}%"></div></div>
            <span class="stat-val">${c.stats.hunger}</span>
          </div>
          <div class="stat-bar${energyClass}">
            <span class="stat-label">⚡</span>
            <div class="bar"><div class="bar-fill" style="width:${c.stats.energy}%"></div></div>
            <span class="stat-val">${c.stats.energy}</span>
          </div>
          <div class="stat-bar">
            <span class="stat-label">😊</span>
            <div class="bar"><div class="bar-fill mood" style="width:${c.stats.mood}%"></div></div>
            <span class="stat-val">${c.stats.mood}</span>
          </div>
        </div>
        <div class="creature-inv">
          <span class="inv-label">🎒</span> ${inv}
          <span class="pebbles">🪨${c.pebbles}</span>
        </div>
        ${c.lastReasoning ? `<div class="creature-thought">💭 "${c.lastReasoning}"</div>` : ""}
        ${c.gossip.length > 0 ? `<div class="creature-gossip">🗣️ ${c.gossip[c.gossip.length - 1].from}: "${c.gossip[c.gossip.length - 1].text}"</div>` : ""}
        <div class="creature-pos">📍 (${c.x},${c.y})</div>
      </div>`;
    }
    panelEl.innerHTML = html;
  }

  _renderEvents() {
    const logEl = document.getElementById("event-log");
    if (!logEl) return;

    const events = this.world.events.slice(-50).reverse();
    let html = "";
    for (const e of events) {
      const typeClass = e.type;
      html += `<div class="event ${typeClass}">
        <span class="event-tick">T${e.tick}</span>
        <span class="event-msg">${e.message}</span>
      </div>`;
    }
    logEl.innerHTML = html;
  }
}
