// Makes each top-level ".window[data-window]" section minimizable, maximizable and
// closable, and gives every one of them a taskbar button so a minimized/closed
// window can be reopened. Scoped to the current page only (this is a static
// multi-page site, not a single-page app).
(function () {
  var windowEls = Array.prototype.slice.call(document.querySelectorAll(".window[data-window]"));
  var taskbarWindows = document.getElementById("taskbar-windows");
  if (!taskbarWindows || !windowEls.length) return;

  var buttons = {};

  function titleFor(win) {
    // Prefer a translatable key, then a literal label, then the window's title text.
    if (win.dataset.taskbarKey && window.t) return window.t(win.dataset.taskbarKey);
    if (win.dataset.taskbarLabel) return win.dataset.taskbarLabel;
    var el = win.querySelector(".title-bar-text");
    return el ? el.textContent.trim() : win.dataset.window;
  }

  function relabelButtons() {
    windowEls.forEach(function (win) {
      var btn = buttons[win.dataset.window];
      if (!btn) return;
      var span = btn.querySelector(".taskbar-label");
      if (span) span.textContent = titleFor(win);
    });
  }

  function iconFor(win) {
    var img = win.querySelector(".title-bar-text img");
    return img ? img.getAttribute("src") : null;
  }

  function updateButton(win) {
    var btn = buttons[win.dataset.window];
    if (!btn) return;
    var visible = !win.hidden;
    btn.classList.toggle("active", visible);
    btn.setAttribute("aria-pressed", visible ? "true" : "false");
  }

  var MOBILE_QUERY = "(max-width: 600px)";

  function showWindow(win) {
    win.hidden = false;
    // A handful of windows (Pinball) are fixed-aspect game boards that just
    // look cramped in their normal small window on a phone screen - those
    // opt in via data-mobile-maximize to start maximized there instead,
    // same as clicking the title bar's own maximize button would do.
    if (win.hasAttribute("data-mobile-maximize") && !win.classList.contains("maximized") &&
        window.matchMedia && window.matchMedia(MOBILE_QUERY).matches) {
      win.classList.add("maximized");
    }
    bringToFront(win);
    updateButton(win);
    if (typeof win.scrollIntoView === "function") {
      win.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function hideWindow(win) {
    win.hidden = true;
    win.classList.remove("maximized");
    updateButton(win);
  }

  function toggleMaximize(win) {
    win.classList.toggle("maximized");
    if (win.classList.contains("maximized")) {
      // A dragged window has inline left/top pinning it in place - that would
      // fight with .window.maximized's own inset, so clear it. Restoring
      // drops back to the default pinned-corner position, not wherever it
      // was dragged to; simple, and dragging again after is still one grab.
      win.style.left = "";
      win.style.top = "";
      win.style.right = "";
      win.style.bottom = "";
    }
  }

  document.addEventListener("langchange", function () { relabelButtons(); });

  // Clicking any window (not just its title bar) brings it in front of
  // whichever other windows are currently overlapping it, same as a real OS.
  // An inline z-index always wins over .window/.window.maximized's own
  // z-index rule on the same element (equal-or-higher specificity), so this
  // works regardless of maximized state. Z_BASE sits just above
  // .window.maximized's static 150 so a freshly-raised window - maximized or
  // not - is never left behind a non-raised maximized one; the counter is
  // renormalized well before it could ever reach the taskbar's 200.
  var Z_BASE = 160;
  var Z_CEILING = 195;
  var zCounter = Z_BASE;

  function bringToFront(win) {
    if (parseInt(win.style.zIndex, 10) === zCounter) return; // already on top
    zCounter++;
    if (zCounter > Z_CEILING) {
      var ranked = windowEls.slice().sort(function (a, b) {
        return (parseInt(a.style.zIndex, 10) || 0) - (parseInt(b.style.zIndex, 10) || 0);
      });
      ranked.forEach(function (w, i) { w.style.zIndex = Z_BASE + i; });
      zCounter = Z_BASE + ranked.length;
    }
    win.style.zIndex = zCounter;
  }

  windowEls.forEach(function (win) {
    var id = win.dataset.window;
    win.addEventListener("pointerdown", function () { bringToFront(win); });

    // A window like "blog" isn't a standalone app - it only ever shows
    // something after a project's "To know more" opens it, so a permanent
    // taskbar button for it is just a dead entry that shows nothing when
    // clicked cold. Its own title-bar controls (close/minimize/maximize)
    // still work below either way.
    //
    // A window tagged data-feature (e.g. the "guest" copy of the travel
    // window on index.html/blog.html) skips its taskbar button on prod too -
    // js/features.js already hides that feature's desktop icon/link there,
    // so a taskbar button would be a loophole back to the same window.
    var hiddenFeature = win.dataset.feature && window.isFeatureHidden && window.isFeatureHidden(win.dataset.feature);
    if (!win.hasAttribute("data-no-taskbar") && !hiddenFeature) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn98 taskbar-btn";
      var icon = iconFor(win);
      btn.innerHTML =
        (icon ? '<img class="icon-inline" src="' + icon + '" alt="">' : "") +
        '<span class="taskbar-label">' + titleFor(win) + "</span>";
      btn.addEventListener("click", function () {
        if (window.SFX) window.SFX.click();
        if (win.hidden) {
          showWindow(win);
        } else {
          hideWindow(win);
        }
      });
      taskbarWindows.appendChild(btn);
      buttons[id] = btn;
      // Reflect the window's actual starting state (most start visible; a
      // window like "My Computer" starts hidden until opened from its
      // desktop icon).
      updateButton(win);
    }

    var controls = win.querySelectorAll(".title-bar-controls button[data-action]");
    controls.forEach(function (ctrlBtn) {
      ctrlBtn.addEventListener("click", function () {
        if (window.SFX) window.SFX.click();
        var action = ctrlBtn.dataset.action;
        if (action === "close" || action === "minimize") {
          hideWindow(win);
        } else if (action === "maximize") {
          toggleMaximize(win);
        }
      });
    });
  });

  // Lets other scripts (e.g. a desktop icon) open a window that starts hidden,
  // through the same path a taskbar click would use.
  window.openAppWindow = function (id) {
    var win = document.querySelector('.window[data-window="' + id + '"]');
    if (win && win.hidden) showWindow(win);
  };
})();
