// Renders a project's blog post into the "blog" window (#blog-root), the same
// window on every page (index.html, blog.html, travel.html). window.showProjectBlog(project)
// is how a click on "To know more" opens it in place, the same way a desktop icon
// opens Minesweeper — no navigation to a subpage.
// blog.html also supports a direct ?id=... link for sharing/bookmarking a single post.
(function () {
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function t(key) {
    return window.t ? window.t(key) : key;
  }

  var root = document.getElementById("blog-root");
  var shown = false; // nothing requested yet -> leave the window's placeholder markup alone
  var requestedId = null;
  var project = null;

  function render() {
    if (!root || !shown) return;
    if (!project) {
      document.title = t("blog.notFound");
      root.innerHTML =
        "<h1>" + escapeHtml(t("blog.notFound")) + "</h1>" +
        "<p>" + escapeHtml(t("blog.noSuchId")) + ' "' + escapeHtml(requestedId || "") + '".</p>';
      return;
    }

    var text = window.localizedProject ? window.localizedProject(project) : (project.en || {});
    document.title = (text.title || project.id) + " - " + t("page.blogTitle");

    var liveLinkHtml = "";
    if (project.liveUrl) {
      var displayUrl = project.liveUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
      liveLinkHtml =
        '<a class="live-link" href="' + escapeHtml(project.liveUrl) + '" target="_blank" rel="noopener">' +
        '<img class="icon-inline" src="images/icons/computer_explorer-1.png" alt="">' +
        "<span>" + escapeHtml(t("blog.tryLive")) + ": " + escapeHtml(displayUrl) + " →</span>" +
        "</a>";
    }

    var imagesHtml = "";
    if (project.images && project.images.length) {
      imagesHtml =
        '<div class="blog-hero-gallery">' +
        project.images
          .map(function (src) {
            return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(text.title || "") + '">';
          })
          .join("") +
        "</div>";
    }

    var tagsHtml = "";
    if (project.tech && project.tech.length) {
      tagsHtml =
        '<div class="tag-row">' +
        project.tech.map(function (tag) { return '<span class="tag">' + escapeHtml(tag) + "</span>"; }).join("") +
        "</div>";
    }

    var bodyHtml = (text.blog || [])
      .map(function (paragraph) { return "<p>" + escapeHtml(paragraph) + "</p>"; })
      .join("");

    var linksHtml = "";
    if (project.repo) {
      linksHtml =
        '<p class="extra-links"><a class="btn98" href="' + escapeHtml(project.repo) +
        '" target="_blank" rel="noopener">' + escapeHtml(t("blog.source")) + "</a></p>";
    }

    root.innerHTML =
      "<h1>" + escapeHtml(text.title || project.id) + "</h1>" +
      (text.tagline ? '<p class="tagline">' + escapeHtml(text.tagline) + "</p>" : "") +
      liveLinkHtml +
      imagesHtml +
      tagsHtml +
      '<hr class="divider">' +
      bodyHtml +
      linksHtml;
  }

  // Opens the "blog" window on the current page and renders `project` into it,
  // the same path a desktop icon uses for Minesweeper/Solitaire/Pinball.
  window.showProjectBlog = function (proj, idForDisplay) {
    shown = true;
    project = proj || null;
    requestedId = proj ? proj.id : (idForDisplay || null);
    render();
    if (window.openAppWindow) window.openAppWindow("blog");
  };

  document.addEventListener("langchange", render);

  // Direct link support, e.g. blog.html?id=some-project shared/bookmarked on its own.
  var params = new URLSearchParams(window.location.search);
  var idParam = params.get("id");
  if (idParam) {
    window.showProjectBlog((window.PROJECTS || []).find(function (p) { return p.id === idParam; }), idParam);
  }
})();
