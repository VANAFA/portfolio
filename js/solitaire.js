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
  var cascadeGen = 0;

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
    if (window.SFX) window.SFX.place();
    checkWin();
    render();
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

  // The classic "cards bounce off the screen" win animation: every card in
  // the deck (not tied to how these specific foundations filled up) gets
  // launched in a staggered stream, falls under simple gravity, bounces off
  // the left/right edges, and is removed once it drops past the bottom.
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
    var gravity = 0.55;
    var cardIndex = 0;

    function launchCard() {
      if (gen !== cascadeGen) return;
      var card = deckCycle[cardIndex % deckCycle.length];
      cardIndex++;

      var el = document.createElement("img");
      el.className = "sol-cascade-card";
      el.src = cardImgSrc(card);
      el.alt = "";

      var x = 20 + Math.random() * Math.max(20, vw - 76);
      var y = -60;
      var vx = (Math.random() - 0.5) * 14;
      var vy = 2 + Math.random() * 2;
      el.style.transform = "translate(" + x + "px," + y + "px)";
      document.body.appendChild(el);

      function step() {
        if (gen !== cascadeGen) { el.remove(); return; }
        vy += gravity;
        x += vx;
        y += vy;
        if (x < 0) { x = 0; vx = -vx * 0.7; }
        if (x > vw - 56) { x = vw - 56; vx = -vx * 0.7; }
        el.style.transform = "translate(" + x + "px," + y + "px)";
        if (y > vh + 60) { el.remove(); return; }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);

      if (cardIndex < deckCycle.length) setTimeout(launchCard, 90);
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
    }
  }

  function onStockClick() {
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
    if (!waste.length) return;
    if (selection && selection.pile === "waste") { clearSelection(); return; }
    pickUpFromWaste();
  }

  function onWasteDblClick() {
    if (!waste.length) return;
    if (!quickMoveToFoundation(waste[waste.length - 1], true)) {
      shakeEl(wasteEl);
      if (window.SFX) window.SFX.invalid();
    }
  }

  function onFoundationClick(suit, el) {
    if (!selection) return;
    if (!tryMoveToFoundation(suit)) {
      shakeEl(el);
      if (window.SFX) window.SFX.invalid();
    }
  }

  function onTableauCardClick(col, index, colEl) {
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
    if (!selection) return;
    if (!tryMoveToTableau(col)) {
      shakeEl(colEl);
      if (window.SFX) window.SFX.invalid();
    }
  }

  function onTableauCardDblClick(col, index, el) {
    var pile = tableau[col];
    if (index !== pile.length - 1) return;
    var card = pile[index];
    if (!card.faceUp) return;
    if (!quickMoveToFoundation(card, false, col, index)) {
      shakeEl(el);
      if (window.SFX) window.SFX.invalid();
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
