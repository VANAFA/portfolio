// Lets desktop icons be dragged anywhere on the screen, like a real desktop.
// Positions are session-only - toggling the language rebuilds the icons
// from scratch (see desktopicons.js) and they land back at their default
// spot. Easter egg: drag "My Computer" onto the Recycle Bin and it "crashes"
// the site with a fake blue-screen that needs a real reload to clear.
(function () {
  var root = document.getElementById("desktop-icons");
  var trash = document.querySelector(".desktop-trash");
  if (!root) return;

  function rectsOverlap(a, b) {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function crashDesktop() {
    var overlay = document.getElementById("bsod-overlay");
    if (!overlay) return;
    overlay.hidden = false;
    if (window.SFX) window.SFX.hit();
    function reload() { location.reload(); }
    overlay.addEventListener("click", reload);
    document.addEventListener("keydown", reload);
  }

  function attachDrag(el) {
    var dragging = false;
    var moved = false;
    var startX, startY, startLeft, startTop;

    // The icon's <img> has draggable="false", but this covers any other
    // descendant - native drag-and-drop hijacks the gesture away from our
    // own pointermove tracking below (which then only sees a couple of
    // events before the browser's own drag takes over).
    el.addEventListener("dragstart", function (e) { e.preventDefault(); });

    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      var rect = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      dragging = true;
      moved = false;
      // Listening on document rather than relying on pointer capture to keep
      // redirecting events to a 76px-wide icon once the cursor is long past
      // it - a fast or far drag would otherwise stop updating mid-gesture.
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    });

    function onMove(e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true;
      el.style.position = "fixed";
      el.style.margin = "0";
      el.style.zIndex = "2";
      el.style.left = Math.max(0, Math.min(startLeft + dx, window.innerWidth - el.offsetWidth)) + "px";
      el.style.top = Math.max(0, Math.min(startTop + dy, window.innerHeight - el.offsetHeight)) + "px";
    }

    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      if (!dragging) return;
      dragging = false;
      if (!moved) return;
      if (trash && el.dataset.iconKey === "desktop.mycomputer") {
        if (rectsOverlap(el.getBoundingClientRect(), trash.getBoundingClientRect())) {
          crashDesktop();
        }
      }
    }

    // A drag (moved past the threshold above) shouldn't also open the app -
    // desktopicons.js's own click handler is a normal bubble-phase listener,
    // so catching this in the capture phase lets it win regardless of which
    // one was attached first.
    el.addEventListener("click", function (e) {
      if (moved) {
        e.preventDefault();
        e.stopImmediatePropagation();
        moved = false;
      }
    }, true);
  }

  function attachAll() {
    Array.prototype.forEach.call(root.querySelectorAll(".desktop-icon"), attachDrag);
  }

  attachAll();
  document.addEventListener("langchange", attachAll);
})();
