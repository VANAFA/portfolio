/*
 * Language switching (English / Argentinian Spanish).
 *
 * Static text lives in the STRINGS table below and is applied to any element
 * carrying data-i18n="key". Project text lives in js/data.js under `en` / `es`.
 *
 * Other scripts read the current language with window.getLang() and re-render
 * when the "langchange" event fires on document.
 */
(function () {
  var STORAGE_KEY = "site-lang";

  var STRINGS = {
    en: {
      "page.title": "Valentino Nallib Fadel",
      "page.blogTitle": "Project Blog",
      "page.travelTitle": "Travel Blog",
      "win.about": "valentino.cv — About Me",
      "win.face": "Hit me!",
      "tb.face": "Hit me!",
      "win.mycomputer": "My Computer",
      "tb.mycomputer": "My Computer",
      "desktop.mycomputer": "My Computer",
      "desktop.mydocs": "My Documents",
      "desktop.network": "Network Neighborhood",
      "desktop.travel": "Travel Blog",
      "mycomputer.hint": "Pick a desktop background. All images where taken by me. Yes, I like photography.",
      "win.minesweeper": "Minesweeper",
      "tb.minesweeper": "Minesweeper",
      "ms.beginner": "Beginner",
      "ms.intermediate": "Intermediate",
      "ms.expert": "Expert",
      "ms.newGame": "New game",
      "ms.win": "You win!",
      "ms.lose": "Boom! Game over.",
      "win.solitaire": "Solitaire",
      "tb.solitaire": "Solitaire",
      "sol.newGame": "New Game",
      "sol.win": "You win!",
      "win.pinball": "Pinball",
      "tb.pinball": "Pinball",
      "pin.credit": "3D Pinball: Space Cadet - not built by me; mirrored here since the original disables Play when framed.",
      "pin.creditPort": "web port",
      "pin.creditDecompile": "decompilation",
      "face.hint": "Go on, click.",
      "quest.button": "Quest",
      "quest.line": "Bring me the chipa.",
      "quest.done": "Thanks. Exactly what I needed.",
      "quest.doneBurp": "Buuurp! Pardon me.",
      "trash.label": "Recycle Bin",
      "win.projects": "My Projects",
      "win.contact": "Contact",
      "win.blog": "Project Blog",
      "win.travel": "Travel Blog",
      "tb.about": "About Me",
      "tb.projects": "My Projects",
      "tb.contact": "Contact",
      "tb.blog": "Project Blog",
      "tb.travel": "Travel Blog",
      "travel.question": "Security question: what brand of watch do I wear?",
      "travel.hint": "This is real client-side encryption, not a trick — only someone who knows the answer can decrypt it. Ask a friend.",
      "travel.placeholder": "Your answer",
      "travel.unlock": "Unlock",
      "travel.checking": "Checking…",
      "travel.wrong": "That's not it.",
      "travel.back": "« Back to the desktop",
      "travel.linkText": "Encrypted Travel Blog →",
      "about.tagline": "AI Engineering student · Buenos Aires, Argentina",
      "about.p1":
        "Fourth-year Artificial Intelligence Engineering student at Universidad de San Andrés, with hands-on project experience in computer vision, deep learning, and natural language models (pre-training and fine-tuning). I like roles that mix research with practical, applied AI development — and side projects that let me build the whole stack myself.",
      "about.p2":
        "Comfortable across Python, PyTorch, TensorFlow, OpenCV, C/C++, and Linux/Docker environments. Outside of engineering, I've spent years in Scouts leadership and community service work.",
      "about.email": "Email me",
      "projects.help": "Click a project to see the details. Each one links out to its own blog post.",
      "contact.email": "Email",
      "contact.phone": "Phone",
      "contact.location": "Location",
      "contact.locationValue": "Buenos Aires, Argentina",
      "modal.more": "To know more →",
      "modal.close": "Close",
      "blog.notFound": "Project not found",
      "blog.noSuchId": "There is no project with id",
      "blog.source": "Source on GitHub",
      "blog.tryLive": "Try it live",
      "start": "Start",
      "lang.button": "Español",
      "lang.title": "Cambiar a español"
    },
    es: {
      "page.title": "Valentino Nallib Fadel",
      "page.blogTitle": "Blog del Proyecto",
      "page.travelTitle": "Blog de Viajes",
      "win.about": "valentino.cv — Sobre mí",
      "win.face": "¡Pegame!",
      "tb.face": "¡Pegame!",
      "win.mycomputer": "Mi PC",
      "tb.mycomputer": "Mi PC",
      "desktop.mycomputer": "Mi PC",
      "desktop.mydocs": "Mis Documentos",
      "desktop.network": "Entorno de Red",
      "desktop.travel": "Blog de Viajes",
      "mycomputer.hint": "Elegí un fondo de escritorio. Todas las fotos las saqué yo. Sí, también me gusta sacar fotos.",
      "win.minesweeper": "Buscaminas",
      "tb.minesweeper": "Buscaminas",
      "ms.beginner": "Principiante",
      "ms.intermediate": "Intermedio",
      "ms.expert": "Experto",
      "ms.newGame": "Juego nuevo",
      "ms.win": "¡Ganaste!",
      "ms.lose": "¡Boom! Perdiste.",
      "win.solitaire": "Solitario",
      "tb.solitaire": "Solitario",
      "sol.newGame": "Juego Nuevo",
      "sol.win": "¡Ganaste!",
      "win.pinball": "Pinball",
      "tb.pinball": "Pinball",
      "pin.credit": "3D Pinball: Space Cadet - no lo hice yo; está espejado acá porque el original desactiva el botón de Play cuando se lo enmarca.",
      "pin.creditPort": "port web",
      "pin.creditDecompile": "decompilación",
      "face.hint": "Dale, hacé clic.",
      "quest.button": "Misión",
      "quest.line": "Dame el chipá.",
      "quest.done": "Gracias, capo.",
      "quest.doneBurp": "¡Buuurp! Disculpá.",
      "trash.label": "Papelera",
      "win.projects": "Mis Proyectos",
      "win.contact": "Contacto",
      "win.blog": "Blog del Proyecto",
      "win.travel": "Blog de Viajes",
      "tb.about": "Sobre mí",
      "tb.projects": "Mis Proyectos",
      "tb.travel": "Blog de Viajes",
      "travel.question": "Pregunta de seguridad: ¿qué marca de reloj uso?",
      "travel.hint": "Esto es encriptación real del lado del cliente, no un truco — solo alguien que sepa la respuesta puede desencriptarlo. Preguntale a algún amigo.",
      "travel.placeholder": "Tu respuesta",
      "travel.unlock": "Desbloquear",
      "travel.checking": "Verificando…",
      "travel.wrong": "No es esa.",
      "travel.back": "« Volver al escritorio",
      "travel.linkText": "Blog de Viajes Encriptado →",
      "tb.contact": "Contacto",
      "tb.blog": "Blog",
      "about.tagline": "Estudiante de Ingeniería en IA · Buenos Aires, Argentina",
      "about.p1":
        "Estudiante de cuarto año de Ingeniería en Inteligencia Artificial en la Universidad de San Andrés, con experiencia práctica en proyectos de visión por computadora, deep learning y modelos de lenguaje natural (pre-entrenamiento y fine-tuning). Me interesan los roles que mezclan investigación con desarrollo aplicado, y los proyectos propios donde puedo armar todo el stack yo mismo.",
      "about.p2":
        "Me manejo con Python, PyTorch, TensorFlow, OpenCV, C/C++ y entornos Linux/Docker. Fuera de la ingeniería, llevo años en el escultismo, en roles de liderazgo y servicio comunitario.",
      "about.email": "Escribime",
      "projects.help": "Hacé clic en un proyecto para ver los detalles. Cada uno enlaza a su propia entrada del blog.",
      "contact.email": "Mail",
      "contact.phone": "Teléfono",
      "contact.location": "Ubicación",
      "contact.locationValue": "Buenos Aires, Argentina",
      "modal.more": "Ver más →",
      "modal.close": "Cerrar",
      "blog.notFound": "Proyecto no encontrado",
      "blog.noSuchId": "No hay ningún proyecto con el id",
      "blog.source": "Código en GitHub",
      "blog.tryLive": "Probalo en vivo",
      "start": "Inicio",
      "lang.button": "English",
      "lang.title": "Switch to English"
    }
  };

  var current = "en";
  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "es") current = stored;
  } catch (e) {
    /* storage unavailable (private mode, blocked cookies) - fall back to English */
  }

  function t(key) {
    var table = STRINGS[current] || STRINGS.en;
    return table[key] !== undefined ? table[key] : (STRINGS.en[key] !== undefined ? STRINGS.en[key] : key);
  }

  // Picks the localized block of a project, falling back to English.
  function localized(project) {
    if (!project) return {};
    return project[current] || project.en || {};
  }

  function applyStatic() {
    document.documentElement.setAttribute("lang", current);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });

    var titleKey = document.body.getAttribute("data-title-key");
    if (titleKey) document.title = t(titleKey);

    var btn = document.getElementById("lang-btn");
    if (btn) {
      btn.textContent = t("lang.button");
      btn.setAttribute("title", t("lang.title"));
    }
  }

  function setLang(lang) {
    if (lang !== "en" && lang !== "es") return;
    current = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* not fatal - the choice just won't persist */
    }
    applyStatic();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  window.getLang = function () { return current; };
  window.setLang = setLang;
  window.t = t;
  window.localizedProject = localized;

  var btn = document.getElementById("lang-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      setLang(current === "en" ? "es" : "en");
    });
  }

  applyStatic();
})();
