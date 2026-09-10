// Klondike solitaire, draw-one. Click a card (or the exposed run below it) to
// select, then click a pile to move it there; double-click sends a card to a
// foundation if that's a legal move. No drag-and-drop, so it works the same
// with mouse or touch.
(function () {
  var tableauEl = document.getElementById("sol-tableau");
  if (!tableauEl) return;

  var stockEl = document.getElementById("sol-stock");
  var wasteEl = document.getElementById("sol-waste");
  var foundationEls = document.querySelectorAll(".sol-foundation");
  var statusEl = document.getElementById("sol-status");
  var newGameBtn = document.getElementById("sol-newgame");

  var SUITS = ["S", "H", "D", "C"];
  var SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
  var SUIT_FILE = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" };
  var RED = { H: true, D: true };
  var RANK_LABEL = { 1: "A", 11: "J", 12: "Q", 13: "K" };

  var stock, waste, foundations, tableau;
  var selection = null; // { pile: "tableau"|"waste", col: number|null, index: number }
  var wonAlready = false;
  var moveCount = 0;
  var cascadeGen = 0;
  var autoCompleting = false; // true once every tableau card is face up and the rest plays itself

  var foundationElBySuit = {};
  foundationEls.forEach(function (el) { foundationElBySuit[el.dataset.suit] = el; });

  function shakeEl(el) {
    if (!el) return;
    el.classList.remove("sol-shake");
    void el.offsetWidth; // restart the animation if it's already mid-shake
    el.classList.add("sol-shake");
  }

  function rankLabel(r) { return RANK_LABEL[r] || String(r); }

  // Kenney's card pack (CC0, images/cards/CREDIT.txt) numbers 2-10 as
  // zero-padded strings ("02".."10") and spells suits out in full.
  function cardImgSrc(card) {
    var rank = RANK_LABEL[card.rank] || (card.rank < 10 ? "0" + card.rank : String(card.rank));
    return "images/cards/card_" + SUIT_FILE[card.suit] + "_" + rank + ".png";
  }

  // Without this, each of the 53 faces only gets requested the first time
  // render() happens to draw it - one request-per-card, spread out as the
  // game is played, which reads as "cards take a moment to appear". Fetching
  // them all up front means they're already in the browser cache by then.
  function preloadCardImages() {
    var srcs = ["images/cards/card_back.png"];
    SUITS.forEach(function (s) {
      for (var r = 1; r <= 13; r++) srcs.push(cardImgSrc({ suit: s, rank: r }));
    });
    srcs.forEach(function (src) { new Image().src = src; });
  }

  function freshDeck() {
    var deck = [];
    SUITS.forEach(function (s) {
      for (var r = 1; r <= 13; r++) deck.push({ suit: s, rank: r, faceUp: false });
    });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    return deck;
  }

  function deal() {
    cascadeGen++; // invalidate any win cascade still flying from a previous game
    clearCascade();
    wonAlready = false;
    autoCompleting = false;
    moveCount = 0;

    var deck = freshDeck();
    stock = [];
    waste = [];
    foundations = { S: [], H: [], D: [], C: [] };
    tableau = [[], [], [], [], [], [], []];

    for (var col = 0; col < 7; col++) {
      for (var n = 0; n <= col; n++) {
        var card = deck.pop();
        card.faceUp = n === col;
        tableau[col].push(card);
      }
    }
    stock = deck;
    stock.forEach(function (c) { c.faceUp = false; });
    selection = null;
    setStatus(null);
    if (window.SFX) window.SFX.shuffle();
    render();
  }

  function setStatus(key) {
    statusEl.textContent = key ? (window.t ? window.t(key) : key) : "";
  }

  function cardEl(card, faceDown) {
    var el = document.createElement("img");
    el.className = "sol-card" + (faceDown ? " face-down" : " face-up");
    el.src = faceDown ? "images/cards/card_back.png" : cardImgSrc(card);
    el.draggable = false;
    el.alt = faceDown ? "" : rankLabel(card.rank) + " of " + SUIT_FILE[card.suit];
    return el;
  }

  function isSequential(upper, lower) {
    // `lower` sits directly on top of `upper` in a tableau run
    return RED[upper.suit] !== RED[lower.suit] && upper.rank === lower.rank + 1;
  }

  function canDropOnTableau(col, card) {
    var pile = tableau[col];
    if (!pile.length) return card.rank === 13;
    var top = pile[pile.length - 1];
    return top.faceUp && isSequential(top, card);
  }

  function canDropOnFoundation(suit, card) {
    if (card.suit !== suit) return false;
    var pile = foundations[suit];
    var top = pile.length ? pile[pile.length - 1] : null;
    return top ? card.rank === top.rank + 1 : card.rank === 1;
  }

  function clearSelection() { selection = null; render(); }

  function pickUpFromTableau(col, index) {
    var pile = tableau[col];
    var card = pile[index];
    if (!card.faceUp) return;
    // every card from index to the end must already be face up (true for any
    // legally-built run) to be draggable as a group
    selection = { pile: "tableau", col: col, index: index };
    if (window.SFX) window.SFX.pick();
    render();
  }

  function pickUpFromWaste() {
    if (!waste.length) return;
    selection = { pile: "waste" };
    if (window.SFX) window.SFX.pick();
    render();
  }

  function selectedRun() {
    if (!selection) return null;
    if (selection.pile === "waste") return [waste[waste.length - 1]];
    return tableau[selection.col].slice(selection.index);
  }

  function removeSelectedRun() {
    if (selection.pile === "waste") {
      return [waste.pop()];
    }
    return tableau[selection.col].splice(selection.index);
  }

  function afterMove() {
    // flip the newly exposed tableau card, if any
    tableau.forEach(function (pile) {
      if (pile.length && !pile[pile.length - 1].faceUp) pile[pile.length - 1].faceUp = true;
    });
    selection = null;
    moveCount++;
    if (window.SFX) window.SFX.place();
    checkWin();
    render();
    tryAutoComplete();
  }

  // Once every tableau card is face up there's no hidden information left -
  // every card still in the tableau sits in one continuous, already-legally-
  // built descending run (that's the only way it could have gotten there),
  // so the lowest-ranked card not yet on its foundation is always sitting
  // exposed at the top of wherever it is (a pile, or the waste) once earlier
  // ranks clear out of the way. Repeatedly playing whatever's exposed and
  // eligible - drawing through the stock as needed for more candidates - is
  // therefore guaranteed to finish the game, so it's safe to just play it out
  // automatically instead of making the player click through the obvious rest.
  function allTableauFaceUp() {
    return tableau.every(function (pile) {
      return pile.every(function (card) { return card.faceUp; });
    });
  }

  function tryAutoComplete() {
    if (autoCompleting || wonAlready) return;
    if (!allTableauFaceUp()) return;
    autoCompleting = true;
    selection = null;
    render();
    setTimeout(autoCompleteStep, 250);
  }

  function autoCompleteStep() {
    if (wonAlready) { autoCompleting = false; return; }

    var moved = false;
    for (var col = 0; col < 7 && !moved; col++) {
      var pile = tableau[col];
      if (!pile.length) continue;
      var card = pile[pile.length - 1];
      if (canDropOnFoundation(card.suit, card)) {
        pile.pop();
        foundations[card.suit].push(card);
        burstAtFoundation(card.suit);
        moveCount++;
        if (window.SFX) window.SFX.place();
        moved = true;
      }
    }
    if (!moved && waste.length) {
      var wasteCard = waste[waste.length - 1];
      if (canDropOnFoundation(wasteCard.suit, wasteCard)) {
        waste.pop();
        foundations[wasteCard.suit].push(wasteCard);
        burstAtFoundation(wasteCard.suit);
        moveCount++;
        if (window.SFX) window.SFX.place();
        moved = true;
      }
    }
    // Nothing playable right now - draw (or recycle waste back to stock) to
    // surface the next candidate. This still counts as making progress: the
    // "moved" flag here just means "keep the loop going", not "found a move".
    if (!moved) {
      if (stock.length) {
        var drawn = stock.pop();
        drawn.faceUp = true;
        waste.push(drawn);
        moved = true;
      } else if (waste.length) {
        while (waste.length) {
          var recycled = waste.pop();
          recycled.faceUp = false;
          stock.push(recycled);
        }
        moved = true;
      }
    }

    render();
    checkWin();

    if (wonAlready) {
      autoCompleting = false;
    } else if (moved) {
      setTimeout(autoCompleteStep, 90);
    } else {
      // Shouldn't be reachable once the tableau is fully face up (see the
      // comment above allTableauFaceUp) - bail out rather than risk hanging
      // if some edge case ever gets here anyway.
      autoCompleting = false;
    }
  }

  function tryMoveToTableau(col) {
    var run = selectedRun();
    if (!run || !canDropOnTableau(col, run[0])) return false;
    removeSelectedRun();
    tableau[col] = tableau[col].concat(run);
    afterMove();
    return true;
  }

  function burstAtFoundation(suit) {
    var el = foundationElBySuit[suit];
    if (!el || !window.burstParticles) return;
    var r = el.getBoundingClientRect();
    var colors = RED[suit] ? ["#e00", "#ff6666", "#ffd700"] : ["#222", "#666", "#ffd700"];
    window.burstParticles(r.left + r.width / 2, r.top + r.height / 2, colors);
  }

  function tryMoveToFoundation(suit) {
    var run = selectedRun();
    if (!run || run.length !== 1 || !canDropOnFoundation(suit, run[0])) return false;
    removeSelectedRun();
    foundations[suit].push(run[0]);
    burstAtFoundation(suit);
    afterMove();
    return true;
  }

  function quickMoveToFoundation(card, fromWaste, col, index) {
    var suit = card.suit;
    if (!canDropOnFoundation(suit, card)) return false;
    if (fromWaste) waste.pop(); else tableau[col].splice(index, 1);
    foundations[suit].push(card);
    burstAtFoundation(suit);
    afterMove();
    return true;
  }

  function clearCascade() {
    document.querySelectorAll(".sol-cascade-card").forEach(function (el) { el.remove(); });
  }

  // The actual classic "cards spring out of the foundations and bounce down
  // the screen" win animation (the previous version here just rained cards
  // down from off the top of the page, which isn't the same thing at all).
  // Each card launches from wherever its own foundation pile currently sits
  // on screen, pops up and out to one side, then falls under gravity,
  // bouncing off the left/right edges *and* the floor - losing a bit of
  // energy each floor bounce - until it settles or bounces off the bottom
  // of the screen for good.
  function startWinCascade() {
    cascadeGen++;
    var gen = cascadeGen;
    clearCascade();

    var deckCycle = [];
    SUITS.forEach(function (s) {
      for (var r = 1; r <= 13; r++) deckCycle.push({ suit: s, rank: r });
    });

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var gravity = 0.7;
    var cardIndex = 0;
    var suitIndex = 0;

    function launchCard() {
      if (gen !== cascadeGen) return;
      var card = deckCycle[cardIndex % deckCycle.length];
      cardIndex++;

      // Cycle which foundation each card springs out of, so the four piles
      // empty out in a round-robin stream rather than one at a time.
      var suit = SUITS[suitIndex % SUITS.length];
      suitIndex++;
      var foundEl = foundationElBySuit[suit];
      var rect = foundEl ? foundEl.getBoundingClientRect() : { left: vw / 2 - 28, top: 0, width: 56 };
      var size = rect.width || 56;

      var el = document.createElement("img");
      el.className = "sol-cascade-card";
      el.src = cardImgSrc(card);
      el.alt = "";
      el.style.width = size + "px";
      el.style.height = size + "px";

      var x = rect.left;
      var y = rect.top;
      var vx = (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 5);
      var vy = -(9 + Math.random() * 7); // pops up out of the pile first, like the original
      el.style.transform = "translate(" + x + "px," + y + "px)";
      document.body.appendChild(el);

      var bounces = 0;
      var maxBounces = 3 + Math.floor(Math.random() * 3);

      function step() {
        if (gen !== cascadeGen) { el.remove(); return; }
        vy += gravity;
        x += vx;
        y += vy;
        if (x < 0) { x = 0; vx = -vx; }
        if (x > vw - size) { x = vw - size; vx = -vx; }
        var floor = vh - size;
        if (y >= floor) {
          y = floor;
          vy = -vy * 0.6; // loses energy each bounce, same as a real dropped card
          bounces++;
          if (bounces >= maxBounces || Math.abs(vy) < 3) { el.remove(); return; }
        }
        el.style.transform = "translate(" + x + "px," + y + "px)";
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);

      if (cardIndex < deckCycle.length) setTimeout(launchCard, 70);
    }
    launchCard();
  }

  function checkWin() {
    var total = 0;
    SUITS.forEach(function (s) { total += foundations[s].length; });
    if (total !== 52) return;
    setStatus("sol.win");
    if (!wonAlready) {
      wonAlready = true;
      if (window.SFX) window.SFX.win();
      startWinCascade();
      if (window.submitLeaderboardScore) window.submitLeaderboardScore("solitaire", Math.max(1, moveCount));
    }
  }

  function onStockClick() {
    if (autoCompleting) return;
    if (stock.length) {
      var card = stock.pop();
      card.faceUp = true;
      waste.push(card);
    } else if (waste.length) {
      while (waste.length) {
        var c = waste.pop();
        c.faceUp = false;
        stock.push(c);
      }
    }
    selection = null;
    render();
  }

  function onWasteClick() {
    if (autoCompleting || !waste.length) return;
    if (selection && selection.pile === "waste") { clearSelection(); return; }
    pickUpFromWaste();
  }

  function onWasteDblClick() {
    if (autoCompleting || !waste.length) return;
    if (!quickMoveToFoundation(waste[waste.length - 1], true)) {
      shakeEl(wasteEl);
      if (window.SFX) window.SFX.invalid();
    }
  }

  function onFoundationClick(suit, el) {
    if (autoCompleting || !selection) return;
    if (!tryMoveToFoundation(suit)) {
      shakeEl(el);
      if (window.SFX) window.SFX.invalid();
    }
  }

  function onTableauCardClick(col, index, colEl) {
    if (autoCompleting) return;
    var pile = tableau[col];
    var card = pile[index];
    var isTopCard = index === pile.length - 1;

    if (!card.faceUp) {
      if (isTopCard) { card.faceUp = true; render(); }
      return;
    }
    if (selection && selection.pile === "tableau" && selection.col === col && selection.index === index) {
      clearSelection();
      return;
    }
    if (selection) {
      if (tryMoveToTableau(col)) return;
      // A different column's own stack (this same card's column, above the
      // selection) rejecting the drop should shake before falling through
      // to re-select the clicked card instead.
      shakeEl(colEl);
      if (window.SFX) window.SFX.invalid();
    }
    pickUpFromTableau(col, index);
  }

  function onTableauColumnClick(col, colEl) {
    // clicked the empty space below a (possibly empty) column
    if (autoCompleting || !selection) return;
    if (!tryMoveToTableau(col)) {
      shakeEl(colEl);
      if (window.SFX) window.SFX.invalid();
    }
  }

  function onTableauCardDblClick(col, index, el) {
    if (autoCompleting) return;
    var pile = tableau[col];
    if (index !== pile.length - 1) return;
    var card = pile[index];
    if (!card.faceUp) return;
    if (!quickMoveToFoundation(card, false, col, index)) {
      shakeEl(el);
      if (window.SFX) window.SFX.invalid();
    }
  }

  // ---- drag-and-drop (layered on top of the click-to-select/click-to-place
  // flow above, not replacing it - a plain click with no real movement falls
  // straight through to the existing click handlers unchanged). A drag just
  // decides *what to drop where*; the actual legality/removal/placement is
  // still done by the same tryMoveToTableau/tryMoveToFoundation the click
  // flow already uses, so there's exactly one set of rules for a legal move
  // no matter how it was made. ----
  var DRAG_THRESHOLD = 5;
  var drag = null;

  function cardRunElements(pile, col, index) {
    if (pile === "waste") {
      var w = wasteEl.querySelector(".sol-card");
      return w ? [w] : [];
    }
    var colEl = tableauEl.children[col];
    if (!colEl) return [];
    return Array.prototype.slice.call(colEl.querySelectorAll(".sol-card")).slice(index);
  }

  function beginDragTracking(e, pile, col, index) {
    if (autoCompleting) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var els = cardRunElements(pile, col, index);
    if (!els.length) return;
    var firstRect = els[0].getBoundingClientRect();
    drag = {
      pile: pile, col: col, index: index, pointerId: e.pointerId,
      els: els,
      startX: e.clientX, startY: e.clientY,
      grabDX: e.clientX - firstRect.left,
      grabDY: e.clientY - firstRect.top,
      offsets: els.map(function (el) {
        var r = el.getBoundingClientRect();
        return { dx: r.left - firstRect.left, dy: r.top - firstRect.top, w: r.width, h: r.height, src: el.src };
      }),
      active: false,
      ghosts: [],
      hoverTarget: null
    };
    document.addEventListener("pointermove", onDragPointerMove);
    document.addEventListener("pointerup", onDragPointerUp);
    document.addEventListener("pointercancel", onDragPointerUp);
  }

  function activateDrag() {
    drag.active = true;
    if (window.SFX) window.SFX.pick();
    drag.els.forEach(function (el) { el.classList.add("sol-drag-hidden"); });
    drag.ghosts = drag.offsets.map(function (o) {
      var g = document.createElement("img");
      g.className = "sol-drag-ghost";
      g.src = o.src;
      g.style.width = o.w + "px";
      g.style.height = o.h + "px";
      document.body.appendChild(g);
      return g;
    });
    positionGhosts(drag.startX, drag.startY);
  }

  function positionGhosts(clientX, clientY) {
    var baseX = clientX - drag.grabDX;
    var baseY = clientY - drag.grabDY;
    drag.ghosts.forEach(function (g, i) {
      var o = drag.offsets[i];
      g.style.transform = "translate(" + (baseX + o.dx) + "px," + (baseY + o.dy) + "px)";
    });
  }

  // Ghosts sit on top of everything (including the pile they're over), so
  // they have to duck out of the way for elementFromPoint to see the real
  // pile underneath instead of just finding its own ghost again.
  function findDropTarget(clientX, clientY) {
    drag.ghosts.forEach(function (g) { g.style.display = "none"; });
    var el = document.elementFromPoint(clientX, clientY);
    drag.ghosts.forEach(function (g) { g.style.display = ""; });
    if (!el) return null;
    var foundationEl = el.closest(".sol-foundation");
    if (foundationEl) return { type: "foundation", suit: foundationEl.dataset.suit, el: foundationEl };
    var colEl = el.closest(".sol-tableau-col");
    if (colEl) {
      var idx = Array.prototype.indexOf.call(tableauEl.children, colEl);
      if (idx !== -1) return { type: "tableau", col: idx, el: colEl };
    }
    return null;
  }

  function setHoverTarget(target) {
    var sameEl = drag.hoverTarget && target && drag.hoverTarget.el === target.el;
    if (drag.hoverTarget && !sameEl) drag.hoverTarget.el.classList.remove("sol-drag-over");
    if (target && !sameEl) target.el.classList.add("sol-drag-over");
    drag.hoverTarget = target;
  }

  function onDragPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < DRAG_THRESHOLD) return;
      activateDrag();
    }
    e.preventDefault();
    positionGhosts(e.clientX, e.clientY);
    setHoverTarget(findDropTarget(e.clientX, e.clientY));
  }

  function onDragPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    document.removeEventListener("pointermove", onDragPointerMove);
    document.removeEventListener("pointerup", onDragPointerUp);
    document.removeEventListener("pointercancel", onDragPointerUp);

    var wasActive = drag.active;
    var target = wasActive ? findDropTarget(e.clientX, e.clientY) : null;
    if (drag.hoverTarget) drag.hoverTarget.el.classList.remove("sol-drag-over");
    drag.ghosts.forEach(function (g) { g.remove(); });
    drag.els.forEach(function (el) { el.classList.remove("sol-drag-hidden"); });
    var pile = drag.pile, col = drag.col, index = drag.index;
    drag = null;
    if (!wasActive) return; // no real movement - let the plain click handlers deal with it

    selection = pile === "waste" ? { pile: "waste" } : { pile: "tableau", col: col, index: index };
    var moved = false;
    if (target && target.type === "foundation") moved = tryMoveToFoundation(target.suit);
    else if (target && target.type === "tableau") moved = tryMoveToTableau(target.col);
    if (!moved) {
      selection = null;
      if (target && window.SFX) window.SFX.invalid();
      render();
    }
  }

  function isSelected(pile, col, index) {
    if (!selection) return false;
    if (pile === "waste") return selection.pile === "waste";
    return selection.pile === "tableau" && selection.col === col && index >= selection.index;
  }

  function render() {
    // stock
    stockEl.innerHTML = "";
    if (stock.length) {
      stockEl.appendChild(cardEl(null, true));
    } else {
      var empty = document.createElement("div");
      empty.className = "sol-empty-pile";
      stockEl.appendChild(empty);
    }

    // waste
    wasteEl.innerHTML = "";
    if (waste.length) {
      var top = waste[waste.length - 1];
      var wEl = cardEl(top, false);
      if (isSelected("waste")) wEl.classList.add("selected");
      wEl.addEventListener("pointerdown", function (e) { beginDragTracking(e, "waste"); });
      wasteEl.appendChild(wEl);
    }

    // foundations
    foundationEls.forEach(function (el) {
      var suit = el.dataset.suit;
      el.innerHTML = "";
      var pile = foundations[suit];
      if (pile.length) {
        el.appendChild(cardEl(pile[pile.length - 1], false));
      } else {
        var slot = document.createElement("div");
        slot.className = "sol-empty-pile sol-foundation-slot";
        slot.textContent = SUIT_SYMBOL[suit];
        el.appendChild(slot);
      }
    });

    // tableau
    tableauEl.innerHTML = "";
    tableau.forEach(function (pile, col) {
      var colEl = document.createElement("div");
      colEl.className = "sol-pile sol-tableau-col";
      colEl.addEventListener("click", function () {
        // Card clicks call stopPropagation, so anything reaching here - the
        // empty-slot placeholder included - is a click on the column itself.
        onTableauColumnClick(col, colEl);
      });
      if (!pile.length) {
        var slot = document.createElement("div");
        slot.className = "sol-empty-pile";
        colEl.appendChild(slot);
      }
      pile.forEach(function (card, index) {
        var el = cardEl(card, !card.faceUp);
        if (isSelected("tableau", col, index)) el.classList.add("selected");
        if (card.faceUp) {
          el.addEventListener("pointerdown", function (e) { beginDragTracking(e, "tableau", col, index); });
        }
        el.addEventListener("click", function (e) {
          e.stopPropagation();
          onTableauCardClick(col, index, colEl);
        });
        el.addEventListener("dblclick", function (e) {
          e.stopPropagation();
          onTableauCardDblClick(col, index, el);
        });
        colEl.appendChild(el);
      });
      tableauEl.appendChild(colEl);
    });

    fitTable();
  }

  // Cards normally scale off the window's width alone (css/win98.css's
  // --sol-card container-query clamp) - fine until maximized, where a tall
  // tableau column (more cards pile up as a game goes on) can end up taller
  // than the window itself, forcing a scrollbar. When maximized, size cards
  // from whichever of width/height is more restrictive instead, the same
  // approach js/minesweeper.js uses for its board.
  //
  // .sol-top-row can't be measured as fixed "chrome" the way .sol-toolbar
  // can: its piles use min-height:var(--sol-card), so its own height scales
  // 1:1 with the very card size being solved for here. Measuring it *before*
  // applying a new size just captures whatever size was already applied last
  // time - on the very first maximize (jumping from the small default 56px
  // up to whatever this computes) that stale measurement massively
  // under-counts how tall the top row is about to become, so the old
  // version of this function ended up oversizing cards and needing a
  // scrollbar anyway. Solving for it directly avoids the chase.
  function fitTable() {
    var winEl = tableauEl.closest(".window");
    if (!winEl) return;
    var bodyEl = tableauEl.closest(".window-body");
    if (!winEl.classList.contains("maximized")) {
      bodyEl.style.removeProperty("--sol-card");
      return;
    }

    var maxPile = 1;
    tableau.forEach(function (pile) { if (pile.length > maxPile) maxPile = pile.length; });

    var toolbarEl = winEl.querySelector(".sol-toolbar");
    var topRowEl = winEl.querySelector(".sol-top-row");
    var fixedChromeHeight = 0; // .sol-toolbar: text/button only, doesn't scale with card size
    if (toolbarEl) {
      var tcs = getComputedStyle(toolbarEl);
      fixedChromeHeight += toolbarEl.offsetHeight + parseFloat(tcs.marginTop) + parseFloat(tcs.marginBottom);
    }
    var topRowMargin = 0; // the row's own height is accounted for in the formula below, not measured
    if (topRowEl) {
      var rcs = getComputedStyle(topRowEl);
      topRowMargin = parseFloat(rcs.marginTop) + parseFloat(rcs.marginBottom);
    }

    var bodyStyles = getComputedStyle(bodyEl);
    var paddingV = parseFloat(bodyStyles.paddingTop) + parseFloat(bodyStyles.paddingBottom);
    var tableauPadding = parseFloat(getComputedStyle(tableauEl).paddingBottom) || 0;

    // .sol-top-row is ~1 card tall; the tableau is (1 + (maxPile-1)*0.32)
    // cards tall (each card after the first in a column only adds 0.32x its
    // height on screen - see .sol-tableau-col .sol-card's -0.68x margin).
    var availableHeight = bodyEl.clientHeight - fixedChromeHeight - topRowMargin - paddingV - tableauPadding;
    var cardFromHeight = availableHeight / (2 + (maxPile - 1) * 0.32);

    // .sol-toolbar/.sol-top-row/.sol-tableau are all width:100% capped at
    // max-width:900px when maximized (css/win98.css) - reading the tableau's
    // own current width picks that up directly (its width doesn't depend on
    // --sol-card, only its children's do) instead of duplicating the 900px
    // figure here and risking the two drifting apart.
    var cardFromWidth = (tableauEl.clientWidth - 6 * 8) / 7; // 7 columns, 6x 8px gaps

    var size = Math.floor(Math.max(40, Math.min(cardFromHeight, cardFromWidth, 160)));

    // The estimate above should already be close, but getting it exact
    // depends on box-model details not worth hand-deriving precisely -
    // measure the real result and nudge down a pixel at a time on the rare
    // occasion it's still a hair too tall/wide (same approach as
    // js/minesweeper.js's fitBoard). Checks both axes since .sol-tableau has
    // its own independent overflow-x, separate from .window-body's overflow-y.
    for (var guard = 0; guard < 15 && size > 40; guard++) {
      bodyEl.style.setProperty("--sol-card", size + "px");
      if (bodyEl.scrollHeight <= bodyEl.clientHeight && tableauEl.scrollWidth <= tableauEl.clientWidth) break;
      size--;
    }
  }

  var solWinEl = tableauEl.closest(".window");
  if (solWinEl && window.ResizeObserver) {
    new ResizeObserver(fitTable).observe(solWinEl);
  }

  stockEl.addEventListener("click", onStockClick);
  wasteEl.addEventListener("click", onWasteClick);
  wasteEl.addEventListener("dblclick", onWasteDblClick);
  foundationEls.forEach(function (el) {
    el.addEventListener("click", function () { onFoundationClick(el.dataset.suit, el); });
  });
  if (newGameBtn) newGameBtn.addEventListener("click", deal);

  document.addEventListener("langchange", function () {
    if (statusEl.textContent) checkWin();
  });

  preloadCardImages();
  deal();
})();
