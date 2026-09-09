// The embedded Pinball game (WebGL/WASM) breaks - freezes, or goes black -
// if its real iframe viewport is resized while it's running, reproducible by
// maximizing or restoring the Pinball window. It renders fine on a fresh
// load at any size, so instead of live-resizing, this reloads the iframe at
// its new size whenever the wrapper's layout box changes. Trade-off: the
// current game/ball state resets on that one toggle, which beats a frozen
// or black game.
//
// Separately: minimizing or closing the window only hides it with CSS
// (windows.js just sets the section's `hidden` attribute) - the iframe, and
// any sound it's playing, keeps running in the background. So its own audio
// (and rendering) is unloaded the moment the window is hidden, and reloaded
// fresh the next time it's reopened.
(function () {
  Array.prototype.forEach.call(document.querySelectorAll(".pinball-frame-wrap"), function (wrap) {
    var frame = wrap.querySelector(".pinball-frame");
    if (!frame) return;

    var baseSrc = frame.getAttribute("src");
    var lastW = null;
    var lastH = null;
    var debounce = null;
    var unloadedWhileHidden = false;

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
      new MutationObserver(function () {
        if (win.hidden && !unloadedWhileHidden) {
          unloadedWhileHidden = true;
          frame.src = "about:blank";
        } else if (!win.hidden && unloadedWhileHidden) {
          unloadedWhileHidden = false;
          lastW = null;
          lastH = null;
          frame.src = baseSrc + "?t=" + Date.now();
        }
      }).observe(win, { attributes: true, attributeFilter: ["hidden"] });
    }
  });
})();
