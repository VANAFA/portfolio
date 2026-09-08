// Renders the project icon grid from window.PROJECTS and drives the pop-up window.
// All user-facing text comes from the project's `en` / `es` block, so the grid and
// the open pop-up both re-render when the language changes.
(function () {
  var grid = document.getElementById("project-grid");
  var overlay = document.getElementById("modal-overlay");
  var modalTitle = document.getElementById("modal-title");
  var modalBody = document.getElementById("modal-body");
  var lastFocused = null;
  var openProject = null;

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function L(project) {
    return window.localizedProject ? window.localizedProject(project) : (project.en || {});
  }

  function renderGrid() {
    var projects = window.PROJECTS || [];
    grid.innerHTML = "";
    projects.forEach(function (project) {
      var text = L(project);
      var btn = document.createElement("button");
      btn.className = "project-icon";
      btn.type = "button";
      btn.innerHTML =
        '<span class="icon-glyph"><img src="' + escapeHtml(project.glyph || "images/icons/directory_closed-32.png") + '" alt=""></span>' +
        '<span class="icon-label">' + escapeHtml(text.title || project.id) + "</span>";
      btn.addEventListener("click", function () {
        openModal(project);
      });
      grid.appendChild(btn);
    });
  }

  function fillModal(project) {
    var text = L(project);
    modalTitle.textContent = (text.title || project.id) + (text.tagline ? " - " + text.tagline : "");

    var imagesHtml = "";
    if (project.images && project.images.length) {
      imagesHtml =
        '<div class="modal-gallery">' +
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
        project.tech.map(function (t) { return '<span class="tag">' + escapeHtml(t) + "</span>"; }).join("") +
        "</div>";
    }

    modalBody.innerHTML = imagesHtml + "<p>" + escapeHtml(text.summary || "") + "</p>" + tagsHtml;
    document.getElementById("modal-blog-link").href = "blog.html?id=" + encodeURIComponent(project.id);
  }

  function openModal(project) {
    lastFocused = document.activeElement;
    openProject = project;
    fillModal(project);
    overlay.hidden = false;
    document.getElementById("modal-close-btn").focus();
  }

  function closeModal() {
    overlay.hidden = true;
    openProject = null;
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeModal();
  });
  document.getElementById("modal-close-btn").addEventListener("click", closeModal);
  document.getElementById("modal-titlebar-close").addEventListener("click", closeModal);
  document.getElementById("modal-blog-link").addEventListener("click", function (e) {
    // Plain left-click: open the blog post as a window on this same page, like
    // Minesweeper/Solitaire. Ctrl/Cmd/middle-click etc. still follow the href
    // (blog.html?id=...) so the link can be opened in a new tab or shared.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!openProject || !window.showProjectBlog) return;
    var project = openProject;
    closeModal();
    window.showProjectBlog(project);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !overlay.hidden) closeModal();
  });

  document.addEventListener("langchange", function () {
    renderGrid();
    if (openProject) fillModal(openProject);
  });

  renderGrid();
})();
