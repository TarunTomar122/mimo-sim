// ═══════════════════════════════════════════════════════
// WORLD ENGINE — State management and simulation
// ═══════════════════════════════════════════════════════

import { CONFIG } from "./config.js";

export class World {
  constructor() {
    this.tick = 0;
    this.grid = this._initGrid();
    this.creatures = this._initCreatures();
    this.events = [];
    this.maxEvents = 200;
  }

  _initGrid() {
    const grid = [];
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        const cell = {};
        for (const [res, cfg] of Object.entries(CONFIG.RESOURCES)) {
          cell[res] = Math.random() < cfg.spawnRate
            ? Math.floor(Math.random() * cfg.maxPerCell) + 1
            : 0;
        }
        row.push(cell);
      }
      grid.push(row);
    }
    return grid;
  }

  _initCreatures() {
    return CONFIG.CREATURES.map((c) => ({
      ...c,
      inventory: { ...c.startInventory },
      stats: { hunger: 80, energy: 90, mood: 70 },
      pebbles: CONFIG.STARTING_PEBBLES,
      alive: true,
      lastAction: null,
      lastReasoning: "",
      gossip: [],
      x: c.startX,
      y: c.startY,
    }));
  }

  // Get what a creature can see
  getCreatureView(creature) {
    const visible = [];
    const range = 2; // can see 2 cells in each direction

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const nx = creature.x + dx;
        const ny = creature.y + dy;
        if (nx >= 0 && nx < CONFIG.GRID_SIZE && ny >= 0 && ny < CONFIG.GRID_SIZE) {
          const cell = this.grid[ny][nx];
          const resources = {};
          for (const [res, amount] of Object.entries(cell)) {
            if (amount > 0) resources[res] = amount;
          }
          // Find creatures at this cell
          const creaturesHere = this.creatures
            .filter((c) => c.alive && c.x === nx && c.y === ny && c.id !== creature.id)
            .map((c) => ({
              id: c.id,
              name: c.name,
              emoji: c.emoji,
              inventory: c.inventory,
              pebbles: c.pebbles,
              stats: { ...c.stats },
            }));

          if (Object.keys(resources).length > 0 || creaturesHere.length > 0 || (dx === 0 && dy === 0)) {
            visible.push({
              x: nx, y: ny, dx, dy,
              resources,
              creatures: creaturesHere,
              isHere: dx === 0 && dy === 0,
            });
          }
        }
      }
    }

    return {
      name: creature.name,
      emoji: creature.emoji,
      species: creature.species,
      personality: creature.personality,
      x: creature.x,
      y: creature.y,
      inventory: { ...creature.inventory },
      pebbles: creature.pebbles,
      stats: { ...creature.stats },
      visible,
      gossip: [...creature.gossip],
    };
  }

  // Execute an action for a creature
  executeAction(creature, action) {
    const result = { creature: creature.name, action: action.type, success: false, message: "" };

    switch (action.type) {
      case "move": {
        const dx = action.dx || 0;
        const dy = action.dy || 0;
        const nx = creature.x + dx;
        const ny = creature.y + dy;
        if (nx >= 0 && nx < CONFIG.GRID_SIZE && ny >= 0 && ny < CONFIG.GRID_SIZE) {
          creature.x = nx;
          creature.y = ny;
          creature.stats.energy = Math.max(0, creature.stats.energy - CONFIG.MOVE_ENERGY_COST);
          result.success = true;
          result.message = `${creature.emoji} ${creature.name} moved to (${nx},${ny})`;
        } else {
          result.message = `${creature.emoji} ${creature.name} tried to move out of bounds`;
        }
        break;
      }

      case "forage": {
        const cell = this.grid[creature.y][creature.x];
        const res = action.resource;
        if (res && cell[res] > 0) {
          const amount = Math.min(
            cell[res],
            CONFIG.FORAGE_YIELD.min + Math.floor(Math.random() * (CONFIG.FORAGE_YIELD.max - CONFIG.FORAGE_YIELD.min + 1))
          );
          cell[res] -= amount;
          creature.inventory[res] = (creature.inventory[res] || 0) + amount;
          creature.stats.hunger = Math.min(100, creature.stats.hunger + amount * 5);
          result.success = true;
          result.message = `${creature.emoji} ${creature.name} foraged ${amount} ${CONFIG.RESOURCES[res]?.emoji || ""} ${res}`;
        } else {
          result.message = `${creature.emoji} ${creature.name} found no ${res || "resources"} here`;
        }
        break;
      }

      case "trade": {
        const target = this.creatures.find(
          (c) => c.alive && c.id === action.targetId && Math.abs(c.x - creature.x) <= 1 && Math.abs(c.y - creature.y) <= 1
        );
        if (!target) {
          result.message = `${creature.emoji} ${creature.name} tried to trade but target not nearby`;
          break;
        }
        const giveRes = action.give;
        const getRes = action.get;
        const giveAmt = Math.max(1, action.giveAmount || 1);
        const getAmt = Math.max(1, action.getAmount || 1);

        if ((creature.inventory[giveRes] || 0) >= giveAmt && (target.inventory[getRes] || 0) >= getAmt) {
          creature.inventory[giveRes] -= giveAmt;
          target.inventory[getRes] -= getAmt;
          creature.inventory[getRes] = (creature.inventory[getRes] || 0) + getAmt;
          target.inventory[giveRes] = (target.inventory[giveRes] || 0) + giveAmt;
          creature.stats.mood = Math.min(100, creature.stats.mood + 10);
          target.stats.mood = Math.min(100, target.stats.mood + 5);
          result.success = true;
          result.message = `${creature.emoji} ${creature.name} traded ${giveAmt} ${giveRes} with ${target.emoji} ${target.name} for ${getAmt} ${getRes}`;
          this.addEvent("trade", result.message);
        } else {
          result.message = `${creature.emoji} ${creature.name} couldn't complete trade with ${target.name} — not enough resources`;
        }
        break;
      }

      case "gossip": {
        const target = this.creatures.find(
          (c) => c.alive && c.id === action.targetId && Math.abs(c.x - creature.x) <= 2 && Math.abs(c.y - creature.y) <= 2
        );
        if (target) {
          const info = action.message || "...";
          target.gossip.push({ from: creature.name, tick: this.tick, text: info });
          if (target.gossip.length > 5) target.gossip.shift();
          creature.stats.mood = Math.min(100, creature.stats.mood + 5);
          target.stats.mood = Math.min(100, target.stats.mood + 3);
          result.success = true;
          result.message = `${creature.emoji} ${creature.name} whispered to ${target.emoji} ${target.name}: "${info}"`;
          this.addEvent("gossip", result.message);
        } else {
          result.message = `${creature.emoji} ${creature.name} tried to gossip but no one was nearby`;
        }
        break;
      }

      case "rest": {
        creature.stats.energy = Math.min(100, creature.stats.energy + 20);
        creature.stats.hunger = Math.max(0, creature.stats.hunger - 5);
        result.success = true;
        result.message = `${creature.emoji} ${creature.name} rested and recovered energy`;
        break;
      }

      case "hoard": {
        // Just a mental state — creature decides to keep resources
        result.success = true;
        result.message = `${creature.emoji} ${creature.name} is guarding their stash`;
        break;
      }

      default:
        result.message = `${creature.emoji} ${creature.name} did nothing (unknown action)`;
    }

    creature.lastAction = action.type;
    creature.lastReasoning = action.reasoning || "";
    return result;
  }

  // End of tick: decay stats, spawn resources
  endTick() {
    this.tick++;

    for (const creature of this.creatures) {
      if (!creature.alive) continue;

      // Decay stats
      creature.stats.hunger = Math.max(0, creature.stats.hunger - CONFIG.STAT_DECAY.hunger);
      creature.stats.energy = Math.max(0, creature.stats.energy - CONFIG.STAT_DECAY.energy);
      creature.stats.mood = Math.max(0, creature.stats.mood - CONFIG.STAT_DECAY.mood);

      // Starvation
      if (creature.stats.hunger <= 0) {
        creature.alive = false;
        this.addEvent("danger", `💀 ${creature.name} collapsed from hunger!`);
      }
    }

    // Spawn resources
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        for (const [res, cfg] of Object.entries(CONFIG.RESOURCES)) {
          if (this.grid[y][x][res] < cfg.maxPerCell && Math.random() < cfg.spawnRate) {
            this.grid[y][x][res]++;
          }
        }
      }
    }
  }

  addEvent(type, message) {
    this.events.push({ tick: this.tick, type, message, time: Date.now() });
    if (this.events.length > this.maxEvents) this.events.shift();
  }

  // Summary for debugging
  toString() {
    return `Tick ${this.tick}: ${this.creatures.filter(c => c.alive).length}/${this.creatures.length} alive`;
  }
}
