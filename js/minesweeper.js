// Classic Minesweeper: three difficulties, flood-fill reveal, flagging via
// right-click or a press-and-hold (works the same on touch), mine counter
// and timer.
(function () {
  var boardEl = document.getElementById("ms-board");
  if (!boardEl) return;

  var mineCountEl = document.getElementById("ms-mine-count");
  var timerEl = document.getElementById("ms-timer");
  var faceBtn = document.getElementById("ms-face");
  var statusEl = document.getElementById("ms-status");
  var levelsEl = document.getElementById("ms-levels");

  var LEVELS = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 }
  };

  var level = "beginner";
  var rows, cols, mineTotal;
  var cells;          // flat array of { mine, revealed, flagged, adjacent, el }
  var state;          // "ready" | "playing" | "won" | "lost"
  var flagsPlaced;
  var revealedSafeCount;
  var timerHandle;
  var seconds;

  var HOLD_MS = 450;
  var MOVE_TOLERANCE = 10;

  function idx(r, c) { return r * cols + c; }

  function forEachNeighbor(r, c, fn) {
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) fn(nr, nc);
      }
    }
  }

  function pad3(n) {
    var neg = n < 0;
    n = Math.min(999, Math.abs(n));
    var s = String(n);
    while (s.length < 3) s = "0" + s;
    return (neg ? "-" : "") + s.slice(-3 + (neg ? 1 : 0));
  }

  function updateCounters() {
    mineCountEl.textContent = pad3(mineTotal - flagsPlaced);
    timerEl.textContent = pad3(seconds);
  }

  function startTimer() {
    clearInterval(timerHandle);
    seconds = 0;
    timerHandle = setInterval(function () {
      seconds++;
      if (seconds > 999) seconds = 999;
      updateCounters();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerHandle);
  }

  function setStatus(key) {
    statusEl.textContent = key ? (window.t ? window.t(key) : key) : "";
  }

  // Places mines everywhere except the clicked cell and its neighbours, so the
  // first click is always safe and opens a reasonable area.
  function placeMines(safeR, safeC) {
    var forbidden = {};
    forbidden[idx(safeR, safeC)] = true;
    forEachNeighbor(safeR, safeC, function (r, c) { forbidden[idx(r, c)] = true; });

    var placed = 0;
    while (placed < mineTotal) {
      var i = Math.floor(Math.random() * cells.length);
      if (forbidden[i] || cells[i].mine) continue;
      cells[i].mine = true;
      placed++;
    }
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var cell = cells[idx(r, c)];
        var count = 0;
        forEachNeighbor(r, c, function (nr, nc) { if (cells[idx(nr, nc)].mine) count++; });
        cell.adjacent = count;
      }
    }
  }

  function cellText(cell) {
    if (!cell.mine && cell.adjacent > 0) return String(cell.adjacent);
    return "";
  }

  function renderCell(cell) {
    var el = cell.el;
    el.className = "ms-cell";
    el.innerHTML = "";
    el.removeAttribute("data-n");

    if (cell.revealed) {
      el.classList.add("revealed");
      if (cell.mine) {
        el.classList.add("mine");
        if (cell.exploded) el.classList.add("exploded");
        var img = document.createElement("img");
        img.src = "images/icons/minesweeper-16.png";
        img.alt = "";
        el.appendChild(img);
      } else if (cell.adjacent > 0) {
        el.setAttribute("data-n", cell.adjacent);
        el.textContent = cellText(cell);
      }
    } else if (cell.flagged) {
      el.classList.add("flagged");
      var flag = document.createElement("span");
      flag.className = "ms-flag";
      el.appendChild(flag);
      if (state === "lost" && !cell.mine) el.classList.add("wrong-flag");
    }
  }

  function revealFlood(startR, startC) {
    var stack = [[startR, startC]];
    var seen = {};
    while (stack.length) {
      var pos = stack.pop();
      var r = pos[0], c = pos[1];
      var i = idx(r, c);
      if (seen[i]) continue;
      seen[i] = true;
      var cell = cells[i];
      if (cell.revealed || cell.flagged) continue;
      cell.revealed = true;
      revealedSafeCount++;
      renderCell(cell);
      if (cell.adjacent === 0) {
        forEachNeighbor(r, c, function (nr, nc) {
          var ncell = cells[idx(nr, nc)];
          if (!ncell.revealed && !ncell.flagged) stack.push([nr, nc]);
        });
      }
    }
  }

  function revealAllMines(exploded) {
    cells.forEach(function (cell) {
      if (cell.mine) {
        cell.revealed = true;
        if (cell === exploded) cell.exploded = true;
      }
    });
    cells.forEach(renderCell);
  }

  function win() {
    state = "won";
    stopTimer();
    setStatus("ms.win");
    cells.forEach(function (cell) {
      if (cell.mine && !cell.flagged) {
        cell.flagged = true;
        renderCell(cell);
      }
    });
  }

  function lose(exploded) {
    state = "lost";
    stopTimer();
    setStatus("ms.lose");
    revealAllMines(exploded);
  }

  function handleReveal(r, c) {
    if (state === "won" || state === "lost") return;
    var cell = cells[idx(r, c)];
    if (cell.revealed || cell.flagged) return;

    if (state === "ready") {
      placeMines(r, c);
      state = "playing";
      startTimer();
    }

    if (cell.mine) {
      cell.revealed = true;
      lose(cell);
      return;
    }
    revealFlood(r, c);
    if (revealedSafeCount === rows * cols - mineTotal) win();
  }

  function handleFlag(r, c) {
    if (state === "won" || state === "lost") return;
    var cell = cells[idx(r, c)];
    if (cell.revealed) return;
    if (state === "ready") {
      state = "playing";
      startTimer();
    }
    cell.flagged = !cell.flagged;
    flagsPlaced += cell.flagged ? 1 : -1;
    renderCell(cell);
    updateCounters();
  }

  function newGame(newLevel) {
    if (newLevel) level = newLevel;
    var cfg = LEVELS[level];
    rows = cfg.rows; cols = cfg.cols; mineTotal = cfg.mines;
    state = "ready";
    flagsPlaced = 0;
    revealedSafeCount = 0;
    stopTimer();
    seconds = 0;
    setStatus(null);
    updateCounters();

    if (levelsEl) {
      levelsEl.querySelectorAll("[data-level]").forEach(function (btn) {
        btn.classList.toggle("selected", btn.dataset.level === level);
      });
    }

    boardEl.style.setProperty("--ms-cols", cols);
    boardEl.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    boardEl.innerHTML = "";
    cells = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var el = document.createElement("button");
        el.type = "button";
        el.className = "ms-cell";
        (function (rr, cc) {
          var holdTimer = null;
          var longPressFired = false;
          var startX = 0, startY = 0;

          function clearHold() {
            clearTimeout(holdTimer);
            holdTimer = null;
          }

          el.addEventListener("pointerdown", function (e) {
            if (e.pointerType === "mouse" && e.button !== 0) return; // right-click: contextmenu handles it
            startX = e.clientX; startY = e.clientY;
            longPressFired = false;
            el.classList.add("pressing");
            holdTimer = setTimeout(function () {
              longPressFired = true;
              el.classList.remove("pressing");
              handleFlag(rr, cc);
            }, HOLD_MS);
          });
          el.addEventListener("pointermove", function (e) {
            if (!holdTimer) return;
            if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_TOLERANCE) {
              clearHold();
              el.classList.remove("pressing");
            }
          });
          el.addEventListener("pointerup", function () {
            el.classList.remove("pressing");
            if (holdTimer) {
              clearHold();
              if (!longPressFired) handleReveal(rr, cc);
            }
          });
          el.addEventListener("pointerleave", function () { clearHold(); el.classList.remove("pressing"); });
          el.addEventListener("pointercancel", function () { clearHold(); el.classList.remove("pressing"); });
          el.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            handleFlag(rr, cc);
          });
        })(r, c);
        boardEl.appendChild(el);
        cells.push({ mine: false, revealed: false, flagged: false, adjacent: 0, el: el });
      }
    }
  }

  if (levelsEl) {
    levelsEl.querySelectorAll("[data-level]").forEach(function (btn) {
      btn.addEventListener("click", function () { newGame(btn.dataset.level); });
    });
  }
  if (faceBtn) faceBtn.addEventListener("click", function () { newGame(); });

  document.addEventListener("langchange", function () {
    if (state === "won") setStatus("ms.win");
    else if (state === "lost") setStatus("ms.lose");
  });

  newGame("beginner");
})();
