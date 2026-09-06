// Renders a single project's blog page from window.PROJECTS, based on ?id=... in the URL.
// This is the ONLY blog template — every project shares it, so adding a project to
// js/data.js is enough to get a working subpage at blog.html?id=<that id>.
(function () {
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var project = (window.PROJECTS || []).find(function (p) { return p.id === id; });

  var root = document.getElementById("blog-root");

  if (!project) {
    document.title = "Project not found";
    root.innerHTML =
      "<h1>Project not found</h1>" +
      "<p>There is no project with id \"" + escapeHtml(id || "") + "\".</p>" +
      '<p><a href="index.html">&laquo; Back to all projects</a></p>';
    return;
  }

  document.title = project.title + " - Blog";

  var imagesHtml = "";
  if (project.images && project.images.length) {
    imagesHtml =
      '<div class="blog-hero-gallery">' +
      project.images
        .map(function (src) {
          return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(project.title) + ' screenshot">';
        })
        .join("") +
      "</div>";
  }

  var tagsHtml = "";
  if (project.tech && project.tech.length) {
    tagsHtml =
      '<div class="tag-row">' +
      project.tech.map(function (t) { return '<span class="tag">' + escapeHtml(t) + "</span>"; }).join("") +
      "</div>";
  }

  var bodyHtml = (project.blog || [])
    .map(function (paragraph) { return "<p>" + escapeHtml(paragraph) + "</p>"; })
    .join("");

  var linksHtml = "";
  if (project.links && project.links.length) {
    linksHtml =
      '<p class="extra-links">' +
      project.links
        .map(function (l) {
          return '<a class="btn98" href="' + escapeHtml(l.url) + '">' + escapeHtml(l.label) + "</a>";
        })
        .join(" ") +
      "</p>";
  }

  root.innerHTML =
    '<p class="breadcrumb"><a href="index.html">&laquo; Back to all projects</a></p>' +
    "<h1>" + escapeHtml(project.title) + "</h1>" +
    (project.tagline ? '<p class="tagline">' + escapeHtml(project.tagline) + "</p>" : "") +
    imagesHtml +
    tagsHtml +
    "<hr class=\"divider\">" +
    bodyHtml +
    linksHtml;
})();
