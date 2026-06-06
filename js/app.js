// ═══════════════════════════════════════════════════════
// APP — Main controller
// ═══════════════════════════════════════════════════════

import { CONFIG } from "./config.js";
import { World } from "./world.js";
import { Agent } from "./agent.js";
import { Renderer } from "./renderer.js";

class App {
  constructor() {
    this.world = new World();
    this.agent = new Agent();
    this.renderer = new Renderer(this.world);
    this.running = false;
    this.speed = 1500; // ms between ticks
    this.timer = null;
    this.processing = false;

    this._bindEvents();
    this.renderer.render();
    document.getElementById("api-status").textContent = "✅ Ready";
    document.getElementById("api-status").className = "status-ok";
  }

  _bindEvents() {
    document.getElementById("btn-step").addEventListener("click", () => this.step());
    document.getElementById("btn-auto").addEventListener("click", () => this.toggleAuto());
    document.getElementById("btn-pause").addEventListener("click", () => this.pause());
    document.getElementById("btn-reset").addEventListener("click", () => this.reset());
    document.getElementById("speed-slider").addEventListener("input", (e) => {
      this.speed = parseInt(e.target.value);
      document.getElementById("speed-label").textContent = (this.speed / 1000).toFixed(1) + "s";
      if (this.running) {
        clearInterval(this.timer);
        this.timer = setInterval(() => this.step(), this.speed);
      }
    });
  }

  async step() {
    if (this.processing) return;

    this.processing = true;
    document.getElementById("btn-step").disabled = true;
    document.getElementById("tick-display").textContent = `Tick ${this.world.tick + 1}`;

    const alive = this.world.creatures.filter((c) => c.alive);
    this.world.addEvent("system", `━━━ Tick ${this.world.tick + 1} ━━━`);

    for (const creature of alive) {
      if (!creature.alive) continue;

      const view = this.world.getCreatureView(creature);
      const summary = {
        tick: this.world.tick + 1,
        alive: alive.filter((c) => c.alive).length,
      };

      // Show thinking state
      this.renderer.setThinking(creature.id);

      try {
        const action = await this.agent.getAction(creature, view, summary);
        const result = this.world.executeAction(creature, action);
        this.world.addEvent(action.type, result.message);
      } catch (err) {
        this.world.addEvent("error", `${creature.emoji} ${creature.name} errored: ${err.message}`);
      }

      this.renderer.render();
      this.renderer.setThinking(null);

      // Small delay between creatures for visual feedback
      await new Promise((r) => setTimeout(r, 300));
    }

    this.world.endTick();
    this.renderer.render();
    this.processing = false;
    document.getElementById("btn-step").disabled = false;
  }

  toggleAuto() {
    if (this.running) {
      this.pause();
    } else {
      this.running = true;
      document.getElementById("btn-auto").textContent = "⏸️ Pause";
      document.getElementById("btn-auto").classList.add("active");
      this.timer = setInterval(() => {
        if (!this.processing) this.step();
      }, this.speed);
    }
  }

  pause() {
    this.running = false;
    clearInterval(this.timer);
    document.getElementById("btn-auto").textContent = "▶️ Auto";
    document.getElementById("btn-auto").classList.remove("active");
  }

  reset() {
    this.pause();
    this.world = new World();
    this.renderer.world = this.world;
    this.renderer.render();
    document.getElementById("tick-display").textContent = "Tick 0";
    this.world.addEvent("system", "🌿 World reset. A new day in the Glade.");
    this.renderer.render();
  }
}

// Boot
window.addEventListener("DOMContentLoaded", () => new App());
