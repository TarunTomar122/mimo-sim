# 🌿 Whispering Glade

An LLM-powered simulation where tiny creatures think, trade, gossip, and survive.

Each creature is an independent AI agent powered by [Mimo](https://mimo.com). They observe their world, make decisions, and interact — creating emergent behavior from simple rules.

## How it works

1. **5 creatures** live in a forest clearing with limited resources
2. Each turn, every creature gets a **world snapshot** and decides what to do
3. Actions are executed sequentially — each creature sees what the previous one did
4. Emergence happens naturally: trading, hoarding, panic, alliances

## Run it

Just open `index.html` in a browser. Or visit the GitHub Pages link.

You'll need a **Mimo API key** — get one at [mimo.com](https://mimo.com).

## Controls

- **▶️ Auto** — runs continuously at adjustable speed
- **⏭️ Step** — advance one tick (all creatures get one turn)
- **⏸️ Pause** — stop auto-play
- **Speed slider** — 0.5s to 5s between ticks

## Customize

Edit `js/config.js` to swap creatures, resources, world rules, or the AI model.

## Tech

- Vanilla JS, no build step, no dependencies
- GitHub Pages compatible
- Phone-friendly responsive layout
- Mimo API (mimo-v2.5-flash or any compatible model)
