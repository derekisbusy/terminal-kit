(function (root, factory) {
  const virtues =
    (typeof require === "function" && typeof module === "object" && module.exports
      ? require("./virtues")
      : null) || root.ConradVirtues;
  const api = factory(virtues);
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.ConradEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (virtuesApi) {
  const { VIRTUES, VIRTUE_BY_ID, randomVirtueId } = virtuesApi;

  const DIRS = Object.freeze([
    { dx: 0, dy: -1, name: "N" },
    { dx: 1, dy: -1, name: "NE" },
    { dx: 1, dy: 0, name: "E" },
    { dx: 1, dy: 1, name: "SE" },
    { dx: 0, dy: 1, name: "S" },
    { dx: -1, dy: 1, name: "SW" },
    { dx: -1, dy: 0, name: "W" },
    { dx: -1, dy: -1, name: "NW" },
  ]);

  const CARDINAL = Object.freeze([
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ]);

  function createGrid(width, height, fill = null) {
    const cells = new Array(width * height);
    for (let i = 0; i < cells.length; i++) cells[i] = fill;
    return { width, height, cells };
  }

  function indexOf(grid, x, y) {
    return y * grid.width + x;
  }

  function inBounds(grid, x, y) {
    return x >= 0 && y >= 0 && x < grid.width && y < grid.height;
  }

  function getCell(grid, x, y) {
    if (!inBounds(grid, x, y)) return null;
    return grid.cells[indexOf(grid, x, y)];
  }

  function setCell(grid, x, y, value) {
    if (!inBounds(grid, x, y)) return;
    grid.cells[indexOf(grid, x, y)] = value;
  }

  function cloneGrid(grid) {
    return {
      width: grid.width,
      height: grid.height,
      cells: grid.cells.slice(),
    };
  }

  function emptyNeighbors(grid, x, y) {
    let empty = 0;
    for (const { dx, dy } of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inBounds(grid, nx, ny)) {
        empty += 1;
        continue;
      }
      if (getCell(grid, nx, ny) == null) empty += 1;
    }
    return empty;
  }

  function livingCount(grid) {
    let n = 0;
    for (const c of grid.cells) if (c != null) n += 1;
    return n;
  }

  function virtueStats(grid) {
    const counts = Object.fromEntries(VIRTUES.map((v) => [v.id, 0]));
    for (const c of grid.cells) {
      if (c != null) counts[c] += 1;
    }
    return counts;
  }

  function isSatisfied(grid, x, y) {
    const id = getCell(grid, x, y);
    if (id == null) return true;
    const virtue = VIRTUE_BY_ID[id];
    return emptyNeighbors(grid, x, y) === virtue.idealSpace;
  }

  function harmonyReport(grid) {
    let living = 0;
    let satisfied = 0;
    const unsatisfied = [];
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const id = getCell(grid, x, y);
        if (id == null) continue;
        living += 1;
        if (isSatisfied(grid, x, y)) {
          satisfied += 1;
        } else {
          unsatisfied.push({ x, y, id, space: emptyNeighbors(grid, x, y) });
        }
      }
    }
    return {
      living,
      satisfied,
      unsatisfied,
      ratio: living === 0 ? 0 : satisfied / living,
      isHarmony: living > 0 && satisfied === living,
    };
  }

  function directionPressure(grid, x, y, dx, dy) {
    let pressure = 0;
    for (let step = 1; step <= 2; step++) {
      const nx = x + dx * step;
      const ny = y + dy * step;
      if (!inBounds(grid, nx, ny)) continue;
      if (getCell(grid, nx, ny) != null) pressure += 3 - step;
    }
    return pressure;
  }

  function pickPushDirection(grid, x, y) {
    let best = null;
    let bestScore = -1;
    for (const dir of CARDINAL) {
      const score = directionPressure(grid, x, y, dir.dx, dir.dy);
      if (score > bestScore) {
        bestScore = score;
        best = dir;
      }
    }
    if (bestScore === 0) {
      for (const dir of CARDINAL) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        if (inBounds(grid, nx, ny) && getCell(grid, nx, ny) != null) {
          return dir;
        }
      }
    }
    return best;
  }

  function traceBlock(grid, startX, startY, dx, dy, maxLen) {
    const block = [];
    let x = startX;
    let y = startY;
    while (
      block.length < maxLen &&
      inBounds(grid, x, y) &&
      getCell(grid, x, y) != null
    ) {
      block.push({ x, y });
      x += dx;
      y += dy;
    }
    return block;
  }

  function tryPush(grid, ax, ay, dx, dy) {
    const actorId = getCell(grid, ax, ay);
    if (actorId == null) return false;
    const force = VIRTUE_BY_ID[actorId].force;

    const nx = ax + dx;
    const ny = ay + dy;
    if (!inBounds(grid, nx, ny)) return false;

    const target = getCell(grid, nx, ny);
    if (target == null) return false;

    const block = traceBlock(grid, nx, ny, dx, dy, force);
    if (block.length === 0 || block.length > force) return false;

    const far = block[block.length - 1];
    const beyondX = far.x + dx;
    const beyondY = far.y + dy;

    if (block.length === 1) {
      setCell(grid, ax, ay, target);
      setCell(grid, nx, ny, actorId);
      return true;
    }

    if (!inBounds(grid, beyondX, beyondY)) return false;
    if (getCell(grid, beyondX, beyondY) != null) return false;

    for (let i = block.length - 1; i >= 0; i--) {
      const cell = block[i];
      const fromId = getCell(grid, cell.x, cell.y);
      setCell(grid, cell.x + dx, cell.y + dy, fromId);
      setCell(grid, cell.x, cell.y, null);
    }
    setCell(grid, ax, ay, null);
    setCell(grid, nx, ny, actorId);
    return true;
  }

  function applyBirthAndDeath(grid, rng = Math.random) {
    const next = cloneGrid(grid);
    const births = [];
    const deaths = [];
    const living = livingCount(grid);
    const capacity = grid.width * grid.height;
    // Birth only while the board is sparse — overcrowding blocks temperance.
    const allowBirth = living / capacity < 0.16;

    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const id = getCell(grid, x, y);
        const space = emptyNeighbors(grid, x, y);
        const occupied = 8 - space;

        if (id == null) {
          if (allowBirth && occupied === 3) {
            const neighborVirtues = [];
            for (const { dx, dy } of DIRS) {
              const n = getCell(grid, x + dx, y + dy);
              if (n != null) neighborVirtues.push(n);
            }
            const pick =
              neighborVirtues[Math.floor(rng() * neighborVirtues.length)] ||
              randomVirtueId(rng);
            births.push({ x, y, id: pick });
          }
          continue;
        }

        if (space === 0) deaths.push({ x, y });
      }
    }

    for (const { x, y } of deaths) setCell(next, x, y, null);
    for (const { x, y, id } of births) {
      if (getCell(next, x, y) == null) setCell(next, x, y, id);
    }
    return next;
  }

  function step(grid, rng = Math.random) {
    const working = cloneGrid(grid);
    const movers = [];

    for (let y = 0; y < working.height; y++) {
      for (let x = 0; x < working.width; x++) {
        const id = getCell(working, x, y);
        if (id == null) continue;
        const ideal = VIRTUE_BY_ID[id].idealSpace;
        const space = emptyNeighbors(working, x, y);
        if (space < ideal) {
          movers.push({
            x,
            y,
            deficit: ideal - space,
            force: VIRTUE_BY_ID[id].force,
          });
        }
      }
    }

    movers.sort((a, b) => b.deficit - a.deficit || b.force - a.force);

    const moved = new Set();
    for (const m of movers) {
      const key = `${m.x},${m.y}`;
      if (getCell(working, m.x, m.y) == null) continue;
      if (moved.has(key)) continue;

      const dir = pickPushDirection(working, m.x, m.y);
      if (!dir) continue;
      const did = tryPush(working, m.x, m.y, dir.dx, dir.dy);
      if (did) {
        moved.add(key);
        moved.add(`${m.x + dir.dx},${m.y + dir.dy}`);
      }
    }

    return applyBirthAndDeath(working, rng);
  }

  function seedRandom(grid, density = 0.28, rng = Math.random) {
    const next = createGrid(grid.width, grid.height, null);
    for (let i = 0; i < next.cells.length; i++) {
      if (rng() < density) next.cells[i] = randomVirtueId(rng);
    }
    return next;
  }

  function seedBalanced(grid, rng = Math.random) {
    const next = createGrid(grid.width, grid.height, null);
    // One of each virtue on a loose lattice so they can push toward temperance.
    const cols = Math.ceil(Math.sqrt(VIRTUES.length));
    const cellW = grid.width / (cols + 1);
    const rows = Math.ceil(VIRTUES.length / cols);
    const cellH = grid.height / (rows + 1);
    let placed = 0;
    VIRTUES.forEach((v, i) => {
      const col = (i % cols) + 1;
      const row = Math.floor(i / cols) + 1;
      const jitterX = Math.floor((rng() - 0.5) * Math.max(1, cellW * 0.35));
      const jitterY = Math.floor((rng() - 0.5) * Math.max(1, cellH * 0.35));
      const x = Math.min(
        grid.width - 1,
        Math.max(0, Math.floor(col * cellW) + jitterX)
      );
      const y = Math.min(
        grid.height - 1,
        Math.max(0, Math.floor(row * cellH) + jitterY)
      );
      if (getCell(next, x, y) == null) {
        setCell(next, x, y, v.id);
        placed += 1;
      } else {
        // Rare collision — walk for an empty cell.
        for (let t = 0; t < 30; t++) {
          const nx = Math.floor(rng() * grid.width);
          const ny = Math.floor(rng() * grid.height);
          if (getCell(next, nx, ny) == null) {
            setCell(next, nx, ny, v.id);
            placed += 1;
            break;
          }
        }
      }
    });
    return { grid: next, placed };
  }

  function paintCell(grid, x, y, virtueId) {
    const next = cloneGrid(grid);
    if (!inBounds(next, x, y)) return next;
    setCell(next, x, y, virtueId);
    return next;
  }

  function eraseCell(grid, x, y) {
    const next = cloneGrid(grid);
    if (!inBounds(next, x, y)) return next;
    setCell(next, x, y, null);
    return next;
  }

  return {
    DIRS,
    createGrid,
    cloneGrid,
    getCell,
    setCell,
    inBounds,
    emptyNeighbors,
    livingCount,
    virtueStats,
    isSatisfied,
    harmonyReport,
    tryPush,
    step,
    seedRandom,
    seedBalanced,
    paintCell,
    eraseCell,
    VIRTUES,
    VIRTUE_BY_ID,
  };
});
