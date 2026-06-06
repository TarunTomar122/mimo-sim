// ═══════════════════════════════════════════════════════
// CONFIG — Swap this file to change the entire world
// ═══════════════════════════════════════════════════════

export const CONFIG = {
  // API
  API_ENDPOINT: "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions",
  API_MODEL: "mimo-v2.5-pro",
  API_KEY: "tp-saezfgn2ggk2mmvk4pi2a5sgjqix6ugey611zo6nxvj8ubuz",

  // World
  WORLD_NAME: "Whispering Glade",
  WORLD_DESC: "A small forest clearing where creatures trade resources to survive.",
  GRID_SIZE: 6,

  // Resources
  RESOURCES: {
    berries: { emoji: "🫐", maxPerCell: 5, spawnRate: 0.3 },
    wood:    { emoji: "🪵", maxPerCell: 3, spawnRate: 0.2 },
    water:   { emoji: "💧", maxPerCell: 4, spawnRate: 0.25 },
    herbs:   { emoji: "🌿", maxPerCell: 2, spawnRate: 0.15 },
    gems:    { emoji: "💎", maxPerCell: 1, spawnRate: 0.05 },
  },

  // Starting pebbles (currency)
  STARTING_PEBBLES: 10,

  // Stat decay per tick
  STAT_DECAY: { hunger: 8, energy: 5, mood: 3 },

  // Movement cost
  MOVE_ENERGY_COST: 3,

  // Foraging yield
  FORAGE_YIELD: { min: 1, max: 3 },

  // Creatures
  CREATURES: [
    {
      id: "fern",
      name: "Fern",
      emoji: "🦊",
      species: "fox",
      personality: "Clever trader. Always looking for a deal. Charismatic but calculating.",
      startInventory: { berries: 2 },
      startX: 1, startY: 1,
    },
    {
      id: "moss",
      name: "Moss",
      emoji: "🐻",
      species: "bear",
      personality: "Hoarder. Defensive and territorial. Strong but slow. Distrusts others.",
      startInventory: { wood: 3 },
      startX: 4, startY: 1,
    },
    {
      id: "dewdrop",
      name: "Dewdrop",
      emoji: "🐰",
      species: "rabbit",
      personality: "Social butterfly. Shares gossip freely. Easily scared but always knows what's happening.",
      startInventory: { berries: 3, herbs: 1 },
      startX: 2, startY: 4,
    },
    {
      id: "thornwick",
      name: "Thornwick",
      emoji: "🦉",
      species: "owl",
      personality: "Wise strategist. Plays the long game. Observant and patient. Speaks in riddles.",
      startInventory: { gems: 1, herbs: 2 },
      startX: 5, startY: 3,
    },
    {
      id: "rubble",
      name: "Rubble",
      emoji: "🦝",
      species: "raccoon",
      personality: "Opportunistic scavenger. Takes what others leave. Sneaky but charming.",
      startInventory: { water: 2 },
      startX: 3, startY: 5,
    },
  ],
};
