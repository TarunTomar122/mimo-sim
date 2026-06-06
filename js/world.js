// ═══════════════════════════════════════════════
// WORLD ENGINE — with memory
// ═══════════════════════════════════════════════

import { CONFIG } from "./config.js";

export class World {
  constructor() {
    this.tick = 0;
    this.grid = this._initGrid();
    this.creatures = this._initCreatures();
    this.events = [];
    this.maxEvents = 300;
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
      stats: { hunger: 70, thirst: 70, energy: 85, mood: 60 },
      pebbles: CONFIG.STARTING_PEBBLES,
      alive: true,
      lastAction: null,
      lastReasoning: "",
      gossip: [],
      memory: [],
      x: c.startX,
      y: c.startY,
    }));
  }

  addToMemory(creature, text) {
    creature.memory.push({ tick: this.tick, text });
    if (creature.memory.length > CONFIG.MEMORY_SIZE) {
      creature.memory.shift();
    }
  }

  getCreatureView(creature) {
    const visible = [];
    const range = 2;

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
          const creaturesHere = this.creatures
            .filter((c) => c.alive && c.x === nx && c.y === ny && c.id !== creature.id)
            .map((c) => ({
              id: c.id, name: c.name, emoji: c.emoji,
              inventory: c.inventory,
              stats: { hunger: c.stats.hunger, thirst: c.stats.thirst },
            }));

          if (Object.keys(resources).length > 0 || creaturesHere.length > 0 || (dx === 0 && dy === 0)) {
            visible.push({ x: nx, y: ny, dx, dy, resources, creatures: creaturesHere, isHere: dx === 0 && dy === 0 });
          }
        }
      }
    }

    return {
      name: creature.name, emoji: creature.emoji, species: creature.species,
      personality: creature.personality,
      x: creature.x, y: creature.y,
      inventory: { ...creature.inventory },
      stats: { ...creature.stats },
      visible,
      gossip: [...creature.gossip],
      memory: [...creature.memory],
    };
  }

  executeAction(creature, action) {
    const result = { creature: creature.name, action: action.type, success: false, message: "" };
    const me = creature.emoji + " " + creature.name;

    switch (action.type) {
      case "move": {
        const nx = creature.x + (action.dx || 0);
        const ny = creature.y + (action.dy || 0);
        if (nx >= 0 && nx < CONFIG.GRID_SIZE && ny >= 0 && ny < CONFIG.GRID_SIZE) {
          creature.x = nx;
          creature.y = ny;
          creature.stats.energy = Math.max(0, creature.stats.energy - CONFIG.MOVE_ENERGY_COST);
          result.success = true;
          result.message = me + " moved to (" + nx + "," + ny + ")";
          this.addToMemory(creature, "I moved to (" + nx + "," + ny + ")");
        } else {
          result.message = me + " tried to move out of bounds";
        }
        break;
      }

      case "forage": {
        const cell = this.grid[creature.y][creature.x];
        const res = action.resource;
        if (res && cell[res] > 0) {
          const amt = Math.min(cell[res], CONFIG.FORAGE_YIELD.min + Math.floor(Math.random() * (CONFIG.FORAGE_YIELD.max - CONFIG.FORAGE_YIELD.min + 1)));
          cell[res] -= amt;
          creature.inventory[res] = (creature.inventory[res] || 0) + amt;
          if (res === "food" || res === "fruit") creature.stats.hunger = Math.min(100, creature.stats.hunger + amt * 8);
          if (res === "water") creature.stats.thirst = Math.min(100, creature.stats.thirst + amt * 10);
          result.success = true;
          const em = CONFIG.RESOURCES[res]?.emoji || "";
          result.message = me + " foraged " + amt + " " + em + " " + res;
          this.addToMemory(creature, "I foraged " + amt + " " + res);
        } else {
          result.message = me + " found no " + (res || "resources") + " here";
        }
        break;
      }

      case "eat": {
        if ((creature.inventory.food || 0) > 0) {
          creature.inventory.food--;
          creature.stats.hunger = Math.min(100, creature.stats.hunger + 15);
          result.success = true;
          result.message = me + " ate food (+15 hunger)";
          this.addToMemory(creature, "I ate food");
        } else if ((creature.inventory.fruit || 0) > 0) {
          creature.inventory.fruit--;
          creature.stats.hunger = Math.min(100, creature.stats.hunger + 10);
          result.success = true;
          result.message = me + " ate fruit (+10 hunger)";
          this.addToMemory(creature, "I ate fruit");
        } else {
          result.message = me + " has nothing to eat!";
        }
        break;
      }

      case "drink": {
        if ((creature.inventory.water || 0) > 0) {
          creature.inventory.water--;
          creature.stats.thirst = Math.min(100, creature.stats.thirst + 20);
          result.success = true;
          result.message = me + " drank water (+20 thirst)";
          this.addToMemory(creature, "I drank water");
        } else {
          result.message = me + " has no water!";
        }
        break;
      }

      case "give": {
        const target = this.creatures.find(
          (c) => c.alive && c.id === action.targetId && Math.abs(c.x - creature.x) <= 1 && Math.abs(c.y - creature.y) <= 1
        );
        if (!target) { result.message = me + " tried to give but no one nearby"; break; }
        const giveRes = action.resource;
        const giveAmt = Math.max(1, action.amount || 1);
        if ((creature.inventory[giveRes] || 0) >= giveAmt) {
          creature.inventory[giveRes] -= giveAmt;
          target.inventory[giveRes] = (target.inventory[giveRes] || 0) + giveAmt;
          creature.stats.mood = Math.min(100, creature.stats.mood + 5);
          target.stats.mood = Math.min(100, target.stats.mood + 8);
          result.success = true;
          const em = CONFIG.RESOURCES[giveRes]?.emoji || "";
          result.message = me + " gave " + giveAmt + " " + em + " to " + target.emoji + " " + target.name;
          this.addToMemory(creature, "I gave " + giveAmt + " " + giveRes + " to " + target.name);
          this.addToMemory(target, creature.name + " gave me " + giveAmt + " " + giveRes);
        } else {
          result.message = me + " doesn't have enough " + giveRes;
        }
        break;
      }

      case "take": {
        const target = this.creatures.find(
          (c) => c.alive && c.id === action.targetId && Math.abs(c.x - creature.x) <= 1 && Math.abs(c.y - creature.y) <= 1
        );
        if (!target) { result.message = me + " tried to take but no one nearby"; break; }
        const takeRes = action.resource;
        const takeAmt = Math.max(1, action.amount || 1);
        if ((target.inventory[takeRes] || 0) >= takeAmt) {
          target.inventory[takeRes] -= takeAmt;
          creature.inventory[takeRes] = (creature.inventory[takeRes] || 0) + takeAmt;
          target.stats.mood = Math.max(0, target.stats.mood - 20);
          creature.stats.mood = Math.min(100, creature.stats.mood + 5);
          result.success = true;
          const em = CONFIG.RESOURCES[takeRes]?.emoji || "";
          result.message = me + " took " + takeAmt + " " + em + " from " + target.emoji + " " + target.name + "!";
          this.addToMemory(creature, "I took " + takeAmt + " " + takeRes + " from " + target.name);
          this.addToMemory(target, creature.name + " STOLE my " + takeRes + "!");
        } else {
          result.message = me + " tried to take " + takeRes + " but " + target.name + " has none";
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
          creature.stats.mood = Math.min(100, creature.stats.mood + 3);
          result.success = true;
          result.message = me + ' whispered to ' + target.emoji + ' ' + target.name + ': "' + info + '"';
          this.addToMemory(creature, 'I told ' + target.name + ': "' + info + '"');
          this.addToMemory(target, creature.name + ' whispered: "' + info + '"');
        } else {
          result.message = me + " tried to gossip but no one nearby";
        }
        break;
      }

      case "rest": {
        creature.stats.energy = Math.min(100, creature.stats.energy + 20);
        creature.stats.hunger = Math.max(0, creature.stats.hunger - 3);
        result.success = true;
        result.message = me + " rested (+20 energy)";
        this.addToMemory(creature, "I rested");
        break;
      }

      case "hoard": {
        result.success = true;
        result.message = me + " is guarding their stash";
        this.addToMemory(creature, "I guarded my stash");
        break;
      }

      default:
        result.message = me + " did nothing";
    }

    creature.lastAction = action.type;
    creature.lastReasoning = action.reasoning || "";
    return result;
  }

  endTick() {
    this.tick++;
    for (const creature of this.creatures) {
      if (!creature.alive) continue;
      creature.stats.hunger = Math.max(0, creature.stats.hunger - CONFIG.STAT_DECAY.hunger);
      creature.stats.thirst = Math.max(0, creature.stats.thirst - CONFIG.STAT_DECAY.thirst);
      creature.stats.energy = Math.max(0, creature.stats.energy - CONFIG.STAT_DECAY.energy);
      creature.stats.mood = Math.max(0, creature.stats.mood - CONFIG.STAT_DECAY.mood);

      if (creature.stats.hunger <= 0 && creature.stats.thirst <= 0) {
        creature.alive = false;
        this.addEvent("danger", creature.emoji + " " + creature.name + " collapsed from hunger and thirst!");
      }
    }

    // Regrow resources
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
}
