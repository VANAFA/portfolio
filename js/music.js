// Drives the "Music" window: shows a random track from window.TIDAL_SONGS
// (js/tidalsongs.js) - album art, title and artist - plus a button to pick
// another. A random one is shown on load, and clicking the card opens a
// YouTube search for that song. Mirrors the data-driven,
// re-render-on-langchange pattern used by js/mycomputer.js.
(function () {
  var root = document.getElementById("music-root");
  if (!root) return;

  var current = null; // the track currently shown, so we can relabel on langchange

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function songs() {
    return window.TIDAL_SONGS || [];
  }

  // Pick a random track, avoiding an immediate repeat when there's more than one.
  function pick() {
    var list = songs();
    if (!list.length) return null;
    if (list.length === 1) return list[0];
    var next;
    do {
      next = list[Math.floor(Math.random() * list.length)];
    } while (next === current);
    return next;
  }

  // Tidal doesn't expose a YouTube id, so link to a YouTube search for the
  // track - the top hit is the song. Opens in a new tab.
  function youtubeUrl(track) {
    var q = ((track.artist ? track.artist + " " : "") + (track.title || "")).trim();
    return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  }

  function render() {
    var list = songs();

    // Empty-array case: no button to press, just a friendly note.
    if (!list.length) {
      current = null;
      root.innerHTML =
        '<p class="music-empty">' + escapeHtml(t("music.empty")) + "</p>";
      return;
    }

    var card = "";
    if (current) {
      card =
        '<a class="music-card" href="' +
        escapeHtml(youtubeUrl(current)) +
        '" target="_blank" rel="noopener" title="' +
        escapeHtml(t("music.youtube")) +
        '">' +
        '<div class="music-art field98 sunken">' +
        '<img src="' +
        escapeHtml(current.art) +
        '" alt="' +
        escapeHtml(current.title + " — " + current.artist) +
        '" loading="lazy">' +
        "</div>" +
        '<div class="music-meta">' +
        '<div class="music-title">' +
        escapeHtml(current.title) +
        "</div>" +
        '<div class="music-artist">' +
        escapeHtml(current.artist) +
        "</div>" +
        "</div>" +
        "</a>";
    } else {
      card = '<p class="music-hint">' + escapeHtml(t("music.hint")) + "</p>";
    }

    root.innerHTML =
      '<button class="btn98 music-recommend" type="button">' +
      escapeHtml(t("music.recommend")) +
      "</button>" +
      card;

    var btn = root.querySelector(".music-recommend");
    if (btn) {
      btn.addEventListener("click", function () {
        if (window.SFX) window.SFX.click();
        current = pick();
        render();
      });
    }
  }

  function t(key) {
    return window.t ? window.t(key) : key;
  }

  // Show a random pick right away on load, rather than the "hit the button" hint.
  current = pick();
  document.addEventListener("langchange", render);
  render();
})();
