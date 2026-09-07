/*
 * Applies the saved desktop background (see js/backgrounds.js) and exposes
 * window.setBackground(id) so the "My Computer" window can change it.
 *
 * Loaded on every page so the choice carries over site-wide, the same way the
 * language toggle does - only index.html has the "My Computer" window to
 * change it from.
 */
(function () {
  var STORAGE_KEY = "site-bg";

  function find(id) {
    var list = window.BACKGROUNDS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return list[0] || null;
  }

  function currentId() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "default";
    } catch (e) {
      return "default";
    }
  }

  function apply(id) {
    var bg = find(id);
    if (bg && bg.full) {
      document.body.style.backgroundImage = 'url("' + bg.full + '")';
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.classList.add("has-bg-photo");
    } else {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundAttachment = "";
      document.body.classList.remove("has-bg-photo");
    }
  }

  window.setBackground = function (id) {
    var bg = find(id);
    id = bg ? bg.id : "default";
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      /* not fatal - the choice just won't persist */
    }
    apply(id);
    document.dispatchEvent(new CustomEvent("bgchange", { detail: { id: id } }));
  };

  window.getBackground = currentId;

  apply(currentId());
})();
