// ═══════════════════════════════════════════════
// ISLAND CONFIG
// ═══════════════════════════════════════════════

export const CONFIG = {
  API_ENDPOINT: "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions",
  API_MODEL: "mimo-v2.5-pro",
  API_KEY: "tp-saezfgn2ggk2mmvk4pi2a5sgjqix6ugey611zo6nxvj8ubuz",

  WORLD_NAME: "Castaway Cay",
  WORLD_DESC: "A small tropical island. Three strangers, limited resources, no rescue coming.",
  GRID_SIZE: 5,
  MEMORY_SIZE: 12, // how many past actions each creature remembers

  RESOURCES: {
    food:  { emoji: "🍖", maxPerCell: 3, spawnRate: 0.25 },
    water: { emoji: "💧", maxPerCell: 3, spawnRate: 0.2 },
    wood:  { emoji: "🪵", maxPerCell: 2, spawnRate: 0.15 },
    fruit: { emoji: "🍌", maxPerCell: 2, spawnRate: 0.3 },
  },

  STARTING_PEBBLES: 0, // no currency on a desert island

  STAT_DECAY: { hunger: 10, thirst: 12, energy: 4, mood: 2 },
  MOVE_ENERGY_COST: 4,
  FORAGE_YIELD: { min: 1, max: 2 },

  CREATURES: [
    {
      id: "luna",
      name: "Luna",
      emoji: "🦊",
      species: "fox",
      personality: "The Planner. Cautious, strategic, wants to ration supplies and build shelter. Secretly selfish — hoards resources claiming it is for the group. Gets frustrated when others act recklessly. Speaks with authority. Dislikes Reef.",
      startInventory: { wood: 2 },
      startX: 1, startY: 1,
    },
    {
      id: "reef",
      name: "Reef",
      emoji: "🐻",
      species: "bear",
      personality: "The Muscle. Bold, impulsive, takes what he wants. Believes strength solves everything. Thinks Luna overthinks and wastes time. Generous to allies but ruthless to those who cross him. Acts first, regrets never.",
      startInventory: { food: 2 },
      startX: 3, startY: 1,
    },
    {
      id: "ivy",
      name: "Ivy",
      emoji: "🐰",
      species: "rabbit",
      personality: "The Diplomat. Social, curious, talks to everyone. Tries to keep peace between Luna and Reef. Easily scared, runs from conflict. Knows everyone secrets because she gossips freely. The chaos agent who means well.",
      startInventory: { fruit: 2, water: 1 },
      startX: 2, startY: 3,
    },
  ],
};
