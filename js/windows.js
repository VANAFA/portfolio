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

  function showWindow(win) {
    win.hidden = false;
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
  }

  document.addEventListener("langchange", function () { relabelButtons(); });

  windowEls.forEach(function (win) {
    var id = win.dataset.window;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn98 taskbar-btn";
    var icon = iconFor(win);
    btn.innerHTML =
      (icon ? '<img class="icon-inline" src="' + icon + '" alt="">' : "") +
      '<span class="taskbar-label">' + titleFor(win) + "</span>";
    btn.addEventListener("click", function () {
      if (win.hidden) {
        showWindow(win);
      } else {
        hideWindow(win);
      }
    });
    taskbarWindows.appendChild(btn);
    buttons[id] = btn;
    // Reflect the window's actual starting state (most start visible; a window
    // like "My Computer" starts hidden until opened from its desktop icon).
    updateButton(win);

    var controls = win.querySelectorAll(".title-bar-controls button[data-action]");
    controls.forEach(function (ctrlBtn) {
      ctrlBtn.addEventListener("click", function () {
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
