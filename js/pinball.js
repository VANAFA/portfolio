// The embedded Pinball game (WebGL/WASM) breaks - freezes, or goes black -
// if its real iframe viewport is resized while it's running, reproducible by
// maximizing or restoring the Pinball window. It renders fine on a fresh
// load at any size, so instead of live-resizing, this reloads the iframe at
// its new size whenever the wrapper's layout box changes. Trade-off: the
// current game/ball state resets on that one toggle, which beats a frozen
// or black game.
//
// Separately: minimizing/closing the window, or switching to another browser
// tab, only hides the page with CSS or backgrounds the tab - the iframe (and
// any sound it's playing) keeps running regardless, audible even after
// switching away and back. So its audio (and rendering) is unloaded whenever
// either happens, and reloaded fresh once the window is open again on a
// visible tab.
(function () {
  Array.prototype.forEach.call(document.querySelectorAll(".pinball-frame-wrap"), function (wrap) {
    var frame = wrap.querySelector(".pinball-frame");
    if (!frame) return;

    var baseSrc = frame.getAttribute("src");
    var lastW = null;
    var lastH = null;
    var debounce = null;
    var unloaded = false;

    function unload() {
      if (unloaded) return;
      unloaded = true;
      frame.src = "about:blank";
    }

    function restore() {
      if (!unloaded) return;
      unloaded = false;
      lastW = null;
      lastH = null;
      frame.src = baseSrc + "?t=" + Date.now();
    }

    function checkSize() {
      var rect = wrap.getBoundingClientRect();
      var w = Math.round(rect.width);
      var h = Math.round(rect.height);
      if (!w || !h) return;
      if (lastW !== null && (w !== lastW || h !== lastH)) {
        frame.src = baseSrc + "?t=" + Date.now();
      }
      lastW = w;
      lastH = h;
    }

    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        clearTimeout(debounce);
        debounce = setTimeout(checkSize, 150);
      }).observe(wrap);
    }

    var win = wrap.closest(".window[data-window]");
    if (win) {
      function sync() {
        if (win.hidden || document.hidden) {
          unload();
        } else {
          restore();
        }
      }
      new MutationObserver(sync).observe(win, { attributes: true, attributeFilter: ["hidden"] });
      document.addEventListener("visibilitychange", sync);
    }

    // Reset: same-origin postMessage into the iframe, which forwards it to
    // the same "r" -> F2 remap pinball/index.html already does for the real
    // keyboard shortcut - simplest way to trigger the engine's own restart
    // without duplicating that translation a second time out here.
    var resetBtn = wrap.parentElement.querySelector('[data-action="pinball-reset"]');
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (window.SFX) window.SFX.click();
        if (frame.contentWindow) frame.contentWindow.postMessage("pinball-reset", location.origin);
      });
    }
  });

  // Leaderboard scores report themselves: pinball/index.html is a custom
  // rebuild of alula/SpaceCadetPinball (see its Module.onRuntimeInitialized)
  // with two small additions to the upstream engine - exported GetScore/
  // GetGameMode functions - specifically so it can read its own real score
  // and call window.parent.submitLeaderboardScore("pinball", score) the
  // moment a game ends, the same way Minesweeper/Solitaire already do from
  // their own code. No form, no self-reporting, nothing to wire up here.
})();
