// Lets the pinned-corner windows (Music, My Computer, Minesweeper, Solitaire,
// Chat, Leaderboard, Hit me!) be dragged around by their title bar, like real OS
// windows. Only active where those windows are actually position:fixed (see the
// min-width:1200px rules in css/win98.css) - in the narrow-screen layout
// they're normal-flow blocks stacked in a column, where dragging wouldn't
// make sense. Positions are session-only: reloading resets to the default
// pinned spot.
(function () {
  var DRAGGABLE_IDS = ["music", "mycomputer", "minesweeper", "solitaire", "chat", "leaderboard", "face"];
  var DESKTOP_QUERY = "(min-width: 1200px)";

  DRAGGABLE_IDS.forEach(function (id) {
    var win = document.querySelector('.window[data-window="' + id + '"]');
    if (!win) return;
    var titleBar = win.querySelector(".title-bar");
    if (!titleBar) return;

    var dragging = false;
    var startX, startY, startLeft, startTop;

    // The title bar has an icon <img> too - without this, grabbing it starts
    // a native image drag that hijacks the gesture from pointermove below.
    titleBar.addEventListener("dragstart", function (e) { e.preventDefault(); });

    function onPointerDown(e) {
      if (!window.matchMedia(DESKTOP_QUERY).matches) return;
      if (win.classList.contains("maximized")) return;
      if (e.target.closest(".title-bar-controls")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      var rect = win.getBoundingClientRect();
      win.style.left = rect.left + "px";
      win.style.top = rect.top + "px";
      win.style.right = "auto";
      win.style.bottom = "auto";

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      win.classList.add("dragging");
      // document-level, not pointer capture on the title bar: a fast drag
      // that outruns the (possibly narrow) title bar would otherwise stop
      // being tracked mid-gesture.
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", endDrag);
      document.addEventListener("pointercancel", endDrag);
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      var newLeft = startLeft + (e.clientX - startX);
      var newTop = startTop + (e.clientY - startY);
      // Keep at least enough of the title bar on-screen to grab again.
      newLeft = Math.min(Math.max(newLeft, 80 - win.offsetWidth), window.innerWidth - 80);
      newTop = Math.min(Math.max(newTop, 0), window.innerHeight - 40);
      win.style.left = newLeft + "px";
      win.style.top = newTop + "px";
    }

    function endDrag() {
      dragging = false;
      win.classList.remove("dragging");
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
    }

    titleBar.addEventListener("pointerdown", onPointerDown);
  });
})();
