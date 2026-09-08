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
    render();
  }

  function pickUpFromWaste() {
    if (!waste.length) return;
    selection = { pile: "waste" };
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

  function tryMoveToFoundation(suit) {
    var run = selectedRun();
    if (!run || run.length !== 1 || !canDropOnFoundation(suit, run[0])) return false;
    removeSelectedRun();
    foundations[suit].push(run[0]);
    afterMove();
    return true;
  }

  function quickMoveToFoundation(card, fromWaste, col, index) {
    var suit = card.suit;
    if (!canDropOnFoundation(suit, card)) return false;
    if (fromWaste) waste.pop(); else tableau[col].splice(index, 1);
    foundations[suit].push(card);
    afterMove();
    return true;
  }

  function checkWin() {
    var total = 0;
    SUITS.forEach(function (s) { total += foundations[s].length; });
    if (total === 52) setStatus("sol.win");
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
    quickMoveToFoundation(waste[waste.length - 1], true);
  }

  function onFoundationClick(suit) {
    if (selection) { tryMoveToFoundation(suit); return; }
  }

  function onTableauCardClick(col, index) {
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
      // clicking a different card just re-selects it instead
    }
    pickUpFromTableau(col, index);
  }

  function onTableauColumnClick(col) {
    // clicked the empty space below a (possibly empty) column
    if (selection) tryMoveToTableau(col);
  }

  function onTableauCardDblClick(col, index) {
    var pile = tableau[col];
    if (index !== pile.length - 1) return;
    var card = pile[index];
    if (!card.faceUp) return;
    quickMoveToFoundation(card, false, col, index);
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
        onTableauColumnClick(col);
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
          onTableauCardClick(col, index);
        });
        el.addEventListener("dblclick", function (e) {
          e.stopPropagation();
          onTableauCardDblClick(col, index);
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
    el.addEventListener("click", function () { onFoundationClick(el.dataset.suit); });
  });
  if (newGameBtn) newGameBtn.addEventListener("click", deal);

  document.addEventListener("langchange", function () {
    if (statusEl.textContent) checkWin();
  });

  preloadCardImages();
  deal();
})();
