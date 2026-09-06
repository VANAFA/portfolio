// Renders a single project's blog page from window.PROJECTS, based on ?id=... in the URL.
// This is the ONLY blog template — every project shares it, so adding a project to
// js/data.js is enough to get a working subpage at blog.html?id=<that id>.
(function () {
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function t(key) {
    return window.t ? window.t(key) : key;
  }

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var project = (window.PROJECTS || []).find(function (p) { return p.id === id; });
  var root = document.getElementById("blog-root");

  function render() {
    if (!project) {
      document.title = t("blog.notFound");
      root.innerHTML =
        "<h1>" + escapeHtml(t("blog.notFound")) + "</h1>" +
        "<p>" + escapeHtml(t("blog.noSuchId")) + ' "' + escapeHtml(id || "") + '".</p>' +
        '<p><a href="index.html">' + escapeHtml(t("blog.back")) + "</a></p>";
      return;
    }

    var text = window.localizedProject ? window.localizedProject(project) : (project.en || {});
    document.title = (text.title || project.id) + " - " + t("page.blogTitle");

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
      '<p class="breadcrumb"><a href="index.html">' + escapeHtml(t("blog.back")) + "</a></p>" +
      "<h1>" + escapeHtml(text.title || project.id) + "</h1>" +
      (text.tagline ? '<p class="tagline">' + escapeHtml(text.tagline) + "</p>" : "") +
      imagesHtml +
      tagsHtml +
      '<hr class="divider">' +
      bodyHtml +
      linksHtml;
  }

  document.addEventListener("langchange", render);
  render();
})();
