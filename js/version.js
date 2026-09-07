// Shows which commit is actually live, in the bottom-right of the taskbar.
// Updated by hand right after every push - if the badge you see doesn't match
// the commit you were told about, it's a caching problem, not a missed commit.
window.SITE_VERSION = {
  hash: "90cd1f0",
  updated: "2026-09-07 22:21 UTC",
  url: "https://github.com/VANAFA/portfolio/commit/90cd1f0"
};

(function () {
  var el = document.getElementById("version-badge");
  if (!el) return;
  var v = window.SITE_VERSION;
  el.textContent = "v: " + v.hash;
  el.title = "Deployed " + v.updated + " - click to view on GitHub";
  el.href = v.url;
})();
