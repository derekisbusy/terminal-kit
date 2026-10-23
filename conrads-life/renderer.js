(() => {
  const {
    VIRTUES,
    VIRTUE_BY_ID,
    createGrid,
    getCell,
    emptyNeighbors,
    isSatisfied,
    harmonyReport,
    virtueStats,
    step,
    seedRandom,
    seedBalanced,
    paintCell,
    eraseCell,
  } = window.ConradEngine;

  const COLS = 36;
  const ROWS = 36;

  const canvas = document.getElementById("grid");
  const ctx = canvas.getContext("2d");
  const harmonyFill = document.getElementById("harmony-fill");
  const harmonyText = document.getElementById("harmony-text");
  const statusLine = document.getElementById("status-line");
  const virtueList = document.getElementById("virtue-list");
  const censusEl = document.getElementById("census");
  const winOverlay = document.getElementById("win-overlay");
  const btnPlay = document.getElementById("btn-play");
  const speedInput = document.getElementById("speed");

  let grid = createGrid(COLS, ROWS, null);
  let selectedVirtue = "temperance";
  let playing = false;
  let generation = 0;
  let animId = null;
  let lastTick = 0;
  let celebrated = false;
  let pulse = 0;

  function cellSize() {
    return canvas.width / COLS;
  }

  function buildVirtueList() {
    virtueList.innerHTML = "";
    for (const v of VIRTUES) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.id = v.id;
      btn.title = `${v.blurb} Force ${v.force}. Ideal space ${v.idealSpace}.`;
      btn.innerHTML = `<span class="swatch" style="background:${v.color}"></span><span>${v.name}</span><span class="virtue-meta">f${v.force} · s${v.idealSpace}</span>`;
      if (v.id === selectedVirtue) btn.classList.add("selected");
      btn.addEventListener("click", () => {
        selectedVirtue = v.id;
        for (const b of virtueList.querySelectorAll("button")) {
          b.classList.toggle("selected", b.dataset.id === selectedVirtue);
        }
      });
      li.appendChild(btn);
      virtueList.appendChild(li);
    }
  }

  function draw() {
    const size = cellSize();
    pulse = (pulse + 0.04) % (Math.PI * 2);

    ctx.fillStyle = "#0a0f0d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid
    ctx.strokeStyle = "rgba(36, 48, 42, 0.55)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
      const p = i * size + 0.5;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(canvas.width, p);
      ctx.stroke();
    }

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const id = getCell(grid, x, y);
        if (id == null) continue;
        const v = VIRTUE_BY_ID[id];
        const satisfied = isSatisfied(grid, x, y);
        const pad = satisfied ? 1.5 : 2.5;
        const ox = x * size;
        const oy = y * size;

        if (!satisfied) {
          const glow = 0.12 + 0.08 * Math.sin(pulse + x * 0.4 + y * 0.3);
          ctx.fillStyle = hexAlpha(v.color, glow);
          ctx.fillRect(ox, oy, size, size);
        }

        ctx.fillStyle = v.color;
        ctx.globalAlpha = satisfied ? 1 : 0.82;
        ctx.fillRect(ox + pad, oy + pad, size - pad * 2, size - pad * 2);
        ctx.globalAlpha = 1;

        if (satisfied) {
          ctx.strokeStyle = "rgba(232, 239, 233, 0.35)";
          ctx.strokeRect(ox + pad + 0.5, oy + pad + 0.5, size - pad * 2 - 1, size - pad * 2 - 1);
        }
      }
    }
  }

  function hexAlpha(hex, alpha) {
    const h = hex.replace("#", "");
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function refreshHud() {
    const report = harmonyReport(grid);
    const pct = Math.round(report.ratio * 100);
    harmonyFill.style.width = `${pct}%`;
    harmonyFill.classList.toggle("complete", report.isHarmony);
    harmonyText.textContent = `${pct}%`;

    if (report.living === 0) {
      statusLine.textContent = "Empty board — place virtues or scatter a seed.";
    } else if (report.isHarmony) {
      statusLine.textContent = `Generation ${generation}: every virtue has the right amount of space.`;
    } else {
      statusLine.textContent = `Generation ${generation} · ${report.satisfied}/${report.living} content · ${report.unsatisfied.length} still seeking space`;
    }

    const stats = virtueStats(grid);
    censusEl.innerHTML = VIRTUES.map(
      (v) =>
        `<li><span class="name">${v.name}</span><span class="n">${stats[v.id]}</span></li>`
    ).join("");

    if (report.isHarmony && !celebrated) {
      celebrated = true;
      winOverlay.classList.remove("hidden");
      if (playing) togglePlay(false);
    }
  }

  function tick() {
    grid = step(grid);
    generation += 1;
    refreshHud();
    draw();
  }

  function loop(ts) {
    if (!playing) return;
    const interval = 1000 / Math.max(1, Number(speedInput.value));
    if (ts - lastTick >= interval) {
      lastTick = ts;
      tick();
    }
    draw();
    animId = requestAnimationFrame(loop);
  }

  function togglePlay(force) {
    playing = typeof force === "boolean" ? force : !playing;
    btnPlay.textContent = playing ? "Pause" : "Play";
    if (playing) {
      lastTick = performance.now();
      animId = requestAnimationFrame(loop);
    } else if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
      draw();
    }
  }

  function canvasCoords(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((event.clientX - rect.left) * scaleX) / cellSize());
    const y = Math.floor(((event.clientY - rect.top) * scaleY) / cellSize());
    return { x, y };
  }

  canvas.addEventListener("mousedown", (event) => {
    const { x, y } = canvasCoords(event);
    if (event.button === 2 || event.shiftKey) {
      grid = eraseCell(grid, x, y);
    } else {
      grid = paintCell(grid, x, y, selectedVirtue);
    }
    celebrated = false;
    refreshHud();
    draw();
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  document.getElementById("btn-step").addEventListener("click", () => {
    if (playing) togglePlay(false);
    tick();
  });

  btnPlay.addEventListener("click", () => togglePlay());

  document.getElementById("btn-clear").addEventListener("click", () => {
    if (playing) togglePlay(false);
    grid = createGrid(COLS, ROWS, null);
    generation = 0;
    celebrated = false;
    winOverlay.classList.add("hidden");
    refreshHud();
    draw();
  });

  document.getElementById("btn-seed").addEventListener("click", () => {
    grid = seedRandom(grid, 0.12);
    generation = 0;
    celebrated = false;
    winOverlay.classList.add("hidden");
    refreshHud();
    draw();
  });

  document.getElementById("btn-balanced").addEventListener("click", () => {
    grid = seedBalanced(grid).grid;
    generation = 0;
    celebrated = false;
    winOverlay.classList.add("hidden");
    refreshHud();
    draw();
  });

  document.getElementById("btn-continue").addEventListener("click", () => {
    winOverlay.classList.add("hidden");
  });

  buildVirtueList();
  grid = seedBalanced(grid).grid;
  refreshHud();
  draw();

  // Idle shimmer when paused so motion still reads on first viewport
  function idle() {
    if (!playing) draw();
    requestAnimationFrame(idle);
  }
  requestAnimationFrame(idle);
})();
