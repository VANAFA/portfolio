// Shows which commit is actually live, in the bottom-right of the taskbar.
// Updated by hand right after every push - if the badge you see doesn't match
// the commit you were told about, it's a caching problem, not a missed commit.
window.SITE_VERSION = {
  hash: "e06539d",
  updated: "2026-09-07 19:42 UTC",
  url: "https://github.com/VANAFA/portfolio/commit/e06539d"
};

(function () {
  var el = document.getElementById("version-badge");
  if (!el) return;
  var v = window.SITE_VERSION;
  el.textContent = "v: " + v.hash;
  el.title = "Deployed " + v.updated + " - click to view on GitHub";
  el.href = v.url;
})();
