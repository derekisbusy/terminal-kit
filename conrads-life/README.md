# Conrad's Game of Life

An Electron game of temperance: every living cell is a **virtue**, each with a
**force** and an ideal amount of empty space. Overcrowded virtues push —
switching places with a neighbor, or shoving a whole block when their force
allows. The board reaches **harmony** when every living virtue has exactly the
right amount of space.

## Virtues

Cardinal, theological, and heavenly virtues — twelve in all:

Prudence, Justice, Fortitude, Temperance, Faith, Hope, Charity, Diligence,
Patience, Kindness, Humility, Chastity.

Each has:

- **Force** — maximum block length it can shove (1 = swap only)
- **Ideal space** — exact count of empty Moore neighbors that satisfies it

## Rules

1. Living cells are virtues painted on the grid.
2. If a virtue has *fewer* empty neighbors than its ideal, it pushes toward
   crowding: swap with the adjacent cell, or push a contiguous block away when
   force ≥ block length and the far side is empty.
3. If a virtue has *more* empty neighbors than its ideal, it steps toward the
   nearest other living cell (seeking company until temperance).
4. Empty cells with exactly three living neighbors may birth at most one virtue
   per generation (inherited from a neighbor) while board density stays under 8%.
5. A cell with zero empty neighbors is crushed and dies.
6. **Win:** every living cell’s empty-neighbor count equals its ideal space.

## Run

```bash
cd conrads-life
npm install
npm start
```

## Test

```bash
npm test
```
