// Renders the row of desktop icons on the left edge of the page. Only
// "My Computer" is functional (opens the background picker); the rest are
// plain decoration, the way most icons on a real Windows 98 desktop are.
(function () {
  var root = document.getElementById("desktop-icons");
  if (!root) return;

  var ICONS = [
    { key: "desktop.mycomputer", icon: "images/icons/my_computer-48.png", open: "mycomputer" },
    { key: "desktop.mydocs", icon: "images/icons/mydocs-48.png" },
    { key: "desktop.network", icon: "images/icons/network_two_pcs-48.png" }
  ];

  function label(key) {
    return window.t ? window.t(key) : key;
  }

  function render() {
    root.innerHTML = "";
    ICONS.forEach(function (item) {
      var el = document.createElement(item.open ? "button" : "div");
      el.className = "desktop-icon" + (item.open ? " functional" : "");
      if (item.open) {
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
