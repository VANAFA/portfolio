// Leaderboard window (top 10 per game) + the "save your score?" dialog that
// js/minesweeper.js and js/solitaire.js call into on a win. No account
// needed to submit - same trust level as typing initials into an arcade
// cabinet (see firestore.rules for the actual validation).
import { db } from "./firebase-init.js";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

(function () {
  var root = document.getElementById("leaderboard-root");
  if (!root) return;

  function t(key) {
    return window.t ? window.t(key) : key;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  var GAMES = ["minesweeper-beginner", "minesweeper-intermediate", "minesweeper-expert", "pinball", "solitaire"];
  var GAME_LABEL_KEYS = {
    "minesweeper-beginner": "leaderboard.msBeginner",
    "minesweeper-intermediate": "leaderboard.msIntermediate",
    "minesweeper-expert": "leaderboard.msExpert",
    "solitaire": "leaderboard.solitaire",
    "pinball": "leaderboard.pinball"
  };
  // The column header carries the game's own icon, so the label next to it
  // no longer has to spell "Minesweeper" out three times over.
  var GAME_ICON = {
    "minesweeper-beginner": "images/icons/minesweeper-16.png",
    "minesweeper-intermediate": "images/icons/minesweeper-16.png",
    "minesweeper-expert": "images/icons/minesweeper-16.png",
    "solitaire": "images/icons/solitaire-16.png",
    "pinball": "images/icons/pinball-16.png"
  };
  // Minesweeper (seconds) and Solitaire (moves): lower is better. Pinball
  // (points): higher is better - the one game here where that flips.
  var SORT_DIR = {
    "minesweeper-beginner": "asc",
    "minesweeper-intermediate": "asc",
    "minesweeper-expert": "asc",
    "solitaire": "asc",
    "pinball": "desc"
  };
  var unsubs = {};

  var columnsEl = document.getElementById("leaderboard-columns");

  function formatValue(game, value) {
    if (game === "solitaire") return value + " " + t("leaderboard.moves");
    if (game === "pinball") return Number(value).toLocaleString() + " " + t("leaderboard.points");
    return value + " " + t("leaderboard.seconds");
  }

  function renderColumns() {
    columnsEl.innerHTML = GAMES.map(function (g) {
      return (
        '<div class="leaderboard-col">' +
        '<div class="leaderboard-col-head"><img src="' + GAME_ICON[g] + '" alt=""><span>' + escapeHtml(t(GAME_LABEL_KEYS[g])) + "</span></div>" +
        '<ol class="leaderboard-list" id="leaderboard-list-' + g + '"></ol>' +
        "</div>"
      );
    }).join("");
  }

  function unsubscribeAll() {
    Object.keys(unsubs).forEach(function (g) { unsubs[g](); });
    unsubs = {};
  }

  // All five games' top-10 lists are shown at once now (see renderColumns),
  // so this opens one live query per game instead of the single one a
  // tab-at-a-time UI needed.
  function subscribeAll() {
    unsubscribeAll();
    GAMES.forEach(function (g) {
      var q = query(
        collection(db, "leaderboard_scores"),
        where("game", "==", g),
        orderBy("value", SORT_DIR[g]),
        limit(10)
      );
      unsubs[g] = onSnapshot(q, function (snap) {
        var listEl = document.getElementById("leaderboard-list-" + g);
        if (!listEl) return; // a langchange re-render can land after a slow response
        var rows = [];
        snap.forEach(function (doc) { rows.push(doc.data()); });
        if (!rows.length) {
          listEl.innerHTML = '<li class="leaderboard-empty">' + escapeHtml(t("leaderboard.empty")) + "</li>";
          return;
        }
        listEl.innerHTML = rows.map(function (r, i) {
          return (
            '<li class="leaderboard-row"><span class="leaderboard-rank">' + (i + 1) + ".</span> " +
            '<span class="leaderboard-name">' + escapeHtml(r.name) + "</span>" +
            '<span class="leaderboard-value">' + escapeHtml(formatValue(g, r.value)) + "</span></li>"
          );
        }).join("");
      }, function (err) {
        var listEl = document.getElementById("leaderboard-list-" + g);
        if (listEl) listEl.innerHTML = '<li class="leaderboard-empty">' + escapeHtml(err.message) + "</li>";
      });
    });
  }

  document.addEventListener("langchange", function () {
    renderColumns();
    subscribeAll();
  });
  // A backgrounded tab has no one reading the list, so drop the live
  // connections while hidden instead of leaving them open for nothing (same
  // approach as js/chat.js and js/pinball.js).
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      unsubscribeAll();
    } else {
      subscribeAll();
    }
  });
  renderColumns();
  subscribeAll();

  // ---- "save your score?" dialog, called from minesweeper.js / solitaire.js ----
  var overlay = document.getElementById("score-overlay");
  var form = document.getElementById("score-form");
  var nameInput = document.getElementById("score-name");
  var summaryEl = document.getElementById("score-summary");
  var pending = null;

  window.submitLeaderboardScore = function (game, value) {
    pending = { game: game, value: value };
    summaryEl.textContent = t("score.summaryPrefix") + " " + formatValue(game, value);
    nameInput.value = localStorage.getItem("leaderboard-name") || "";
    overlay.hidden = false;
    nameInput.focus();
  };

  function closeScoreDialog() {
    overlay.hidden = true;
    pending = null;
  }

  document.getElementById("score-close").addEventListener("click", closeScoreDialog);
  document.getElementById("score-skip").addEventListener("click", closeScoreDialog);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeScoreDialog();
  });

  // One document per name+game (not an auto-generated ID) - resubmitting
  // under the same name overwrites this same slot instead of piling up a
  // new entry, which is what makes an old record disappear once beaten.
  // firestore.rules only allows that overwrite when the new value is
  // strictly better, so this is safe to just attempt unconditionally: a
  // worse score is silently rejected by the rules, leaving the existing
  // (better) record standing exactly as it should.
  function scoreDocId(game, name) {
    return game + "_" + name.trim().toLowerCase().replace(/\//g, "-");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!pending) return;
    var name = nameInput.value.trim().slice(0, 20);
    if (!name) return;
    localStorage.setItem("leaderboard-name", name);
    setDoc(doc(db, "leaderboard_scores", scoreDocId(pending.game, name)), {
      game: pending.game,
      name: name,
      value: pending.value,
      createdAt: serverTimestamp()
    }).catch(function (err) {
      // Also the expected outcome for a score that isn't actually an
      // improvement - not worth surfacing as an error to the player.
      console.error("score submit failed (or wasn't a personal best):", err);
    });
    closeScoreDialog();
  });
})();
