// Renders the row of desktop icons on the left edge of the page. Only
// "My Computer" is functional (opens the background picker); the rest are
// plain decoration, the way most icons on a real Windows 98 desktop are.
(function () {
  var root = document.getElementById("desktop-icons");
  if (!root) return;

  var ICONS = [
    { key: "desktop.mycomputer", icon: "images/icons/my_computer-48.png", open: "mycomputer" },
    { key: "desktop.mydocs", icon: "images/icons/mydocs-48.png" },
    { key: "desktop.network", icon: "images/icons/network_two_pcs-48.png" },
    { key: "win.minesweeper", icon: "images/icons/minesweeper-48.png", open: "minesweeper" },
    { key: "win.solitaire", icon: "images/icons/solitaire-48.png", open: "solitaire" },
    { key: "win.pinball", icon: "images/icons/pinball-48.png", open: "pinball" },
    { key: "desktop.travel", icon: "images/icons/globe_map-0.png", href: "travel.html" }
  ];

  function label(key) {
    return window.t ? window.t(key) : key;
  }

  function render() {
    root.innerHTML = "";
    ICONS.forEach(function (item) {
      var isFunctional = !!(item.open || item.href);
      var el = document.createElement(item.href ? "a" : isFunctional ? "button" : "div");
      el.className = "desktop-icon" + (isFunctional ? " functional" : "");
      if (item.href) {
        el.href = item.href;
      } else if (isFunctional) {
        el.type = "button";
      } else {
        el.setAttribute("aria-hidden", "true");
      }
      el.innerHTML =
        '<img src="' + item.icon + '" alt="">' +
        '<span class="desktop-icon-label">' + label(item.key) + "</span>";
      if (item.open) {
        el.addEventListener("click", function () {
          if (window.openAppWindow) window.openAppWindow(item.open);
        });
      }
      root.appendChild(el);
    });
  }

  document.addEventListener("langchange", render);
  render();
})();
