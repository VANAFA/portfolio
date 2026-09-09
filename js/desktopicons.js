// Renders the row of desktop icons on the left edge of the page. Only
// "My Computer" is functional (opens the background picker); the rest are
// plain decoration, the way most icons on a real Windows 98 desktop are.
(function () {
  var root = document.getElementById("desktop-icons");
  if (!root) return;

  var ICONS = [
    { key: "desktop.mycomputer", icon: "images/icons/my_computer-48.png", open: "mycomputer" },
    { key: "win.projects", icon: "images/icons/mydocs-48.png", open: "projects" },
    { key: "win.minesweeper", icon: "images/icons/minesweeper-48.png", open: "minesweeper" },
    { key: "win.solitaire", icon: "images/icons/solitaire-48.png", open: "solitaire" },
    { key: "win.pinball", icon: "images/icons/pinball-48.png", open: "pinball" },
    { key: "win.leaderboard", icon: "images/icons/leaderboard-48.png", open: "leaderboard" },
    { key: "win.chat", icon: "images/icons/msn-48.png", open: "chat" },
    { key: "desktop.travel", icon: "images/icons/globe_map-0.png", open: "travel", feature: "travel" }
  ];

  function label(key) {
    return window.t ? window.t(key) : key;
  }

  function render() {
    root.innerHTML = "";
    ICONS.forEach(function (item) {
      if (item.feature && window.isFeatureHidden && window.isFeatureHidden(item.feature)) return;
      var isFunctional = !!(item.open || item.href);
      var el = document.createElement(item.href ? "a" : isFunctional ? "button" : "div");
      el.className = "desktop-icon" + (isFunctional ? " functional" : "");
      el.dataset.iconKey = item.key; // js/dragicons.js uses this to spot "My Computer" for the bin easter egg
      if (item.href) {
        el.href = item.href;
      } else if (isFunctional) {
        el.type = "button";
      } else {
        el.setAttribute("aria-hidden", "true");
      }
      el.innerHTML =
        '<img src="' + item.icon + '" alt="" draggable="false">' +
        '<span class="desktop-icon-label">' + label(item.key) + "</span>";
      if (isFunctional) {
        el.addEventListener("click", function () {
          if (window.SFX) window.SFX.click();
          if (item.open && window.openAppWindow) window.openAppWindow(item.open);
        });
      }
      root.appendChild(el);
    });
  }

  document.addEventListener("langchange", render);
  render();
})();
