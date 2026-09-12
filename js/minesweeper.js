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
  // Separate from state: mines only go down on the first *reveal*, never on
  // a first flag - a flag can happen before any safe cell is known, so
  // there's nothing yet to keep mines away from.
  var minesPlaced;
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

  function tick() {
    seconds++;
    if (seconds > 999) seconds = 999;
    updateCounters();
  }

  function startTimer() {
    clearInterval(timerHandle);
    seconds = 0;
    timerHandle = setInterval(tick, 1000);
  }

  function stopTimer() {
    clearInterval(timerHandle);
    timerHandle = null;
  }

  // Tab/window switched away: stop ticking (and stop waking the page up every
  // second) rather than silently charging the player for time spent
  // elsewhere. Coming back resumes the same running total instead of
  // restarting it - only startTimer() (a new game) resets seconds to 0.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    } else if (state === "playing" && !timerHandle) {
      timerHandle = setInterval(tick, 1000);
    }
  });

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

  function renderCell(cell, animateFlag) {
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
      flag.className = "ms-flag" + (animateFlag ? " spawn" : "");
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
    if (window.SFX) window.SFX.win();
    cells.forEach(function (cell) {
      if (cell.mine && !cell.flagged) {
        cell.flagged = true;
        renderCell(cell);
      }
    });
    // seconds can still be 0 on a very fast win (the timer's first tick
    // hasn't fired yet) - firestore.rules requires value > 0.
    if (window.submitLeaderboardScore) window.submitLeaderboardScore("minesweeper-" + level, Math.max(1, seconds));
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
      state = "playing";
      startTimer();
    }
    // Mines are placed on the first *reveal* specifically, not just the first
    // move - a game that started with a flag would otherwise reach here with
    // state already "playing" and never place mines at all, leaving every
    // cell mine-free (the whole board floods open on the next click).
    if (!minesPlaced) {
      placeMines(r, c);
      minesPlaced = true;
    }

    if (cell.mine) {
      cell.revealed = true;
      if (window.SFX) window.SFX.hit();
      lose(cell);
      return;
    }
    if (window.SFX) window.SFX.click();
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
    if (window.SFX) window.SFX[cell.flagged ? "flag" : "pick"]();
    renderCell(cell, cell.flagged);
    updateCounters();
  }

  function newGame(newLevel) {
    if (newLevel) level = newLevel;
    var cfg = LEVELS[level];
    rows = cfg.rows; cols = cfg.cols; mineTotal = cfg.mines;
    state = "ready";
    minesPlaced = false;
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

    var msWinEl = boardEl.closest(".window");
    if (msWinEl) msWinEl.dataset.msLevel = level;

    boardEl.style.setProperty("--ms-cols", cols);
    boardEl.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    boardEl.innerHTML = "";
    cells = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var el = document.createElement("button");
        el.type = "button";
        el.className = "ms-cell";
        (function (rr, cc, el) {
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
              holdTimer = null;
              // A native long-press contextmenu can beat this timeout on some
              // mobile browsers (see the contextmenu handler below) - if it
              // already flagged the cell, don't flag it again right back off.
              if (longPressFired) return;
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
            // On some mobile browsers this can fire either before or after our
            // own HOLD_MS timeout above during the same continued hold - either
            // way only the first of the two should actually toggle the flag.
            // (Previously this reset longPressFired back to false on the "came
            // after" branch, which let a *second* native contextmenu during the
            // same hold - which some browsers do fire while a touch keeps
            // pressing - toggle the flag right back off; now it stays latched
            // until the next fresh press.)
            if (longPressFired) return;
            longPressFired = true;
            clearHold();
            el.classList.remove("pressing");
            handleFlag(rr, cc);
          });
        })(r, c, el);
        boardEl.appendChild(el);
        cells.push({ mine: false, revealed: false, flagged: false, adjacent: 0, el: el });
      }
    }
    fitBoard();
  }

  // Normally the board just fills the window's width and cells follow via
  // aspect-ratio - fine until the window is maximized, where a wide-but-
  // short board (e.g. Expert's 30x16) fills the available width and ends up
  // taller than the window itself, needing a scroll to reach the bottom
  // rows. When maximized, size cells from whichever of width/height is more
  // restrictive instead, so the whole board always fits on screen.
  function fitBoard() {
    var winEl = boardEl.closest(".window");
    if (!winEl || !winEl.classList.contains("maximized")) {
      boardEl.style.width = "";
      return;
    }
    var bodyEl = boardEl.parentElement;
    var siblingsHeight = 0;
    Array.prototype.forEach.call(bodyEl.children, function (child) {
      if (child === boardEl) return;
      var cs = getComputedStyle(child);
      siblingsHeight += child.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
    });
    // .ms-board's own padding sits outside the cells' aspect-ratio-driven
    // height, so it has to come off the height budget the same way the
    // siblings' margins do above - otherwise the board ends up that much
    // taller than what was actually budgeted for it and still overflows.
    var boardPadding = parseFloat(getComputedStyle(boardEl).paddingTop) + parseFloat(getComputedStyle(boardEl).paddingBottom);
    var cellFromWidth = bodyEl.clientWidth / cols;
    var cellFromHeight = (bodyEl.clientHeight - siblingsHeight - boardPadding) / rows;
    var cellSize = Math.floor(Math.min(cellFromWidth, cellFromHeight));

    // The estimate above should already be close, but getting it exact
    // depends on box-model details (borders, subpixel layout rounding)
    // that aren't worth hand-deriving precisely - measure the real result
    // and nudge down a pixel at a time on the rare occasion it's still a
    // hair too tall, rather than trusting the arithmetic blindly.
    for (var guard = 0; guard < 15 && cellSize > 4; guard++) {
      boardEl.style.width = cellSize * cols + "px";
      if (bodyEl.scrollHeight <= bodyEl.clientHeight) break;
      cellSize--;
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

  var winEl = boardEl.closest(".window");
  if (winEl && window.ResizeObserver) {
    new ResizeObserver(fitBoard).observe(winEl);
  }

  newGame("beginner");
})();
