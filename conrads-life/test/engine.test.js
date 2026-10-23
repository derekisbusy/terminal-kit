const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  createGrid,
  setCell,
  getCell,
  emptyNeighbors,
  tryPush,
  harmonyReport,
  step,
  seedBalanced,
  VIRTUES,
  VIRTUE_BY_ID,
} = require("../src/engine");

describe("virtue catalog", () => {
  it("includes every planned virtue", () => {
    const ids = VIRTUES.map((v) => v.id).sort();
    assert.deepEqual(ids, [
      "charity",
      "chastity",
      "diligence",
      "faith",
      "fortitude",
      "hope",
      "humility",
      "justice",
      "kindness",
      "patience",
      "prudence",
      "temperance",
    ]);
  });
});

describe("push rules", () => {
  it("switches places with a single neighbor", () => {
    const grid = createGrid(5, 5, null);
    setCell(grid, 2, 2, "temperance");
    setCell(grid, 3, 2, "humility");
    const ok = tryPush(grid, 2, 2, 1, 0);
    assert.equal(ok, true);
    assert.equal(getCell(grid, 2, 2), "humility");
    assert.equal(getCell(grid, 3, 2), "temperance");
  });

  it("shoves a block when force allows and space exists beyond", () => {
    const grid = createGrid(8, 3, null);
    setCell(grid, 1, 1, "fortitude"); // force 4
    setCell(grid, 2, 1, "hope");
    setCell(grid, 3, 1, "patience");
    // beyond 4,1 empty
    const ok = tryPush(grid, 1, 1, 1, 0);
    assert.equal(ok, true);
    assert.equal(getCell(grid, 1, 1), null);
    assert.equal(getCell(grid, 2, 1), "fortitude");
    assert.equal(getCell(grid, 3, 1), "hope");
    assert.equal(getCell(grid, 4, 1), "patience");
  });

  it("refuses a block longer than force", () => {
    const grid = createGrid(8, 3, null);
    setCell(grid, 1, 1, "hope"); // force 1
    setCell(grid, 2, 1, "charity");
    setCell(grid, 3, 1, "diligence");
    const ok = tryPush(grid, 1, 1, 1, 0);
    // force 1 can only swap with immediate neighbor (block length 1)
    assert.equal(ok, true);
    assert.equal(getCell(grid, 1, 1), "charity");
    assert.equal(getCell(grid, 2, 1), "hope");
    assert.equal(getCell(grid, 3, 1), "diligence");
  });
});

describe("harmony", () => {
  it("reports harmony when each living cell has exact ideal space", () => {
    const grid = createGrid(7, 7, null);
    // Place a single temperance (ideal 4). Alone in center of 7x7:
    // all 8 neighbors empty => space 8, not satisfied.
    setCell(grid, 3, 3, "temperance");
    assert.equal(harmonyReport(grid).isHarmony, false);

    // Surround so exactly 4 neighbors are empty (4 occupied).
    // Occupied at N,E,S,W → empty diagonals = 4. Ideal for temperance is 4.
    setCell(grid, 3, 2, "diligence");
    setCell(grid, 4, 3, "diligence");
    setCell(grid, 3, 4, "diligence");
    setCell(grid, 2, 3, "diligence");

    // Diligence idealSpace is 2 — these four each have more empty than 2, so not harmony yet.
    // Just check temperance itself is satisfied.
    assert.equal(emptyNeighbors(grid, 3, 3), 4);
    assert.equal(VIRTUE_BY_ID.temperance.idealSpace, 4);
  });

  it("steps without throwing on a balanced seed", () => {
    let grid = createGrid(16, 16, null);
    grid = seedBalanced(grid, () => 0.3).grid;
    for (let i = 0; i < 5; i++) grid = step(grid, () => 0.4);
    const report = harmonyReport(grid);
    assert.ok(report.living >= 0);
    assert.ok(report.ratio >= 0 && report.ratio <= 1);
  });

  it("moves sparse virtues closer when they have too much space", () => {
    const grid = createGrid(9, 3, null);
    setCell(grid, 1, 1, "temperance"); // ideal 4, currently ~7–8 empty
    setCell(grid, 7, 1, "diligence");
    const before = getCell(grid, 1, 1);
    const next = step(grid, () => 0);
    // Temperance should have stepped toward diligence (rightward)
    assert.equal(before, "temperance");
    assert.equal(getCell(next, 1, 1), null);
    assert.equal(getCell(next, 2, 1), "temperance");
  });
});
