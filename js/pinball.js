// The embedded Pinball game (WebGL/WASM) breaks - freezes, or goes black -
// if its real iframe viewport is resized while it's running, reproducible by
// maximizing or restoring the Pinball window. It renders fine on a fresh
// load at any size, so instead of live-resizing, this reloads the iframe at
// its new size whenever the wrapper's layout box changes. Trade-off: the
// current game/ball state resets on that one toggle, which beats a frozen
// or black game.
(function () {
  Array.prototype.forEach.call(document.querySelectorAll(".pinball-frame-wrap"), function (wrap) {
    var frame = wrap.querySelector(".pinball-frame");
    if (!frame) return;

    var baseSrc = frame.getAttribute("src");
    var lastW = null;
    var lastH = null;
    var debounce = null;

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
  });
})();
