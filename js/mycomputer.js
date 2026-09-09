// Renders the background picker inside the "My Computer" window from
// window.BACKGROUNDS (js/backgrounds.js).
(function () {
  var grid = document.getElementById("bg-grid");
  if (!grid) return;

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    var lang = window.getLang ? window.getLang() : "en";
    var current = window.getBackground ? window.getBackground() : "default";
    var list = window.BACKGROUNDS || [];

    grid.innerHTML = "";
    list.forEach(function (bg) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bg-choice" + (bg.id === current ? " selected" : "");
      var preview = bg.thumb
        ? '<img src="' + escapeHtml(bg.thumb) + '" alt="">'
        : '<span class="bg-swatch"></span>';
      btn.innerHTML = preview + '<span class="bg-label">' + escapeHtml(bg[lang] || bg.en || bg.id) + "</span>";
      btn.addEventListener("click", function () {
        if (window.SFX) window.SFX.click();
        if (window.setBackground) window.setBackground(bg.id);
      });
      grid.appendChild(btn);
    });
  }

  document.addEventListener("langchange", render);
  document.addEventListener("bgchange", render);
  render();
})();
