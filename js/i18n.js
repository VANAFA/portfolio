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
      "desktop.travel": "Travel Blog",
      "mycomputer.hint": "Pick a desktop background. All images where taken by me. Yes, I like photography.",
      "win.music": "Music",
      "tb.music": "Music",
      "desktop.music": "Music",
      "music.intro": "",
      "music.recommend": "Recommend me a song",
      "music.hint": "Hit the button and I'll pick one of my Tidal favourites for you.",
      "music.youtube": "▶ Play on YouTube",
      "music.empty": "No songs here yet — check back soon.",
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
      "pin.credit": "3D Pinball: Space Cadet - engine not built from scratch by me; rebuilt here from the open-source decompilation, with a couple of small additions so it can report your score to the leaderboard.",
      "pin.creditPort": "web port",
      "pin.creditDecompile": "decompilation",
      "pin.reset": "Reset",
      "face.hint": "Go on, click.",
      "quest.button": "Quest",
      "quest.line": "Bring me the chipa.",
      "quest.done": "Thanks. Exactly what I needed.",
      "quest.doneBurp": "Buuurp! Pardon me.",
      "trash.label": "Recycle Bin",
      "bsod.text": "NALLIB.AR\n\nA fatal exception 0E has occurred at 0028:C0011E36 while dragging\nMY_COMPUTER.EXE onto RECYCLE_BIN.DLL.\n\n*  Press any key to terminate this desktop.\n*  Press any key again to restart nallib.ar. You will lose any\n   unsaved changes in all open windows.",
      "bsod.hint": "Press any key to continue _",
      "win.projects": "My Projects",
      "win.contact": "Contact",
      "win.blog": "Project Blog",
      "win.travel": "Travel Blog",
      "tb.about": "About Me",
      "tb.projects": "My Projects",
      "tb.contact": "Contact",
      "tb.travel": "Travel Blog",
      "travel.question": "Security question: what brand of watch do I wear?",
      "travel.hint": "This is real client-side encryption, not a trick — only someone who knows the answer can decrypt it. Ask a friend.",
      "travel.placeholder": "Your answer",
      "travel.unlock": "Unlock",
      "travel.checking": "Checking…",
      "travel.wrong": "That's not it.",
      "travel.linkText": "Encrypted Travel Blog →",
      "travel.marquee": "🌴 Welcome to my Travel Page!!! 🌴 ~*~ Best viewed in Netscape Navigator at 800x600 ~*~ Thanks for stopping by!! 🌴",
      "travel.readMore": "Read more →",
      "about.tagline": "AI Engineering student · Buenos Aires, Argentina",
      "about.p1":
        "Fourth-year Artificial Intelligence Engineering student at Universidad de San Andrés, with hands-on project experience in computer vision, deep learning, and natural language models (pre-training and fine-tuning). I like roles that mix research with practical, applied AI development; and side projects that let me build the whole stack myself.",
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
      "lang.title": "Cambiar a español",
      "win.chat": "Chat",
      "tb.chat": "Chat",
      "chat.placeholder": "Type a message…",
      "chat.send": "Send",
      "chat.signIn": "Sign in",
      "chat.signUp": "Sign up",
      "chat.username": "Username",
      "chat.email": "Email",
      "chat.password": "Password (6+ characters)",
      "chat.verifyHint": "Check your email and click the verification link, then come back here to chat.",
      "chat.recheckVerify": "I verified it - check again",
      "chat.stillNotVerified": "Still not verified - check the email and try again.",
      "chat.resendVerify": "Resend verification email",
      "chat.signOut": "Sign out",
      "chat.working": "Working…",
      "chat.errNoUsername": "Pick a username first.",
      "chat.errInvalidEmail": "That email doesn't look right.",
      "chat.errEmailInUse": "That email already has an account - try signing in instead.",
      "chat.errWeakPassword": "Password needs to be at least 6 characters.",
      "chat.errBadCredentials": "Wrong email or password.",
      "chat.errTooMany": "Too many tries - wait a bit and try again.",
      "chat.language": "Language!",
      "chat.readOnlyHint": "Anyone can read this chat. Sign in or sign up to post.",
      "chat.onlineLabel": "online",
      "win.leaderboard": "Leaderboard",
      "tb.leaderboard": "Leaderboard",
      "leaderboard.msBeginner": "Beginner",
      "leaderboard.msIntermediate": "Intermediate",
      "leaderboard.msExpert": "Expert",
      "leaderboard.solitaire": "Solitaire",
      "leaderboard.pinball": "Pinball",
      "leaderboard.moves": "moves",
      "leaderboard.seconds": "s",
      "leaderboard.points": "pts",
      "leaderboard.empty": "No scores yet - be the first!",
      "score.title": "Save your score?",
      "score.summaryPrefix": "You got:",
      "score.namePlaceholder": "Your name",
      "score.submit": "Submit",
      "score.skip": "Skip"
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
      "desktop.travel": "Blog de Viajes",
      "mycomputer.hint": "Elegí un fondo de escritorio. Todas las fotos las saqué yo. Sí, también me gusta sacar fotos.",
      "win.music": "Música",
      "tb.music": "Música",
      "desktop.music": "Música",
      "music.intro": "Una de mis canciones favoritas en Tidal, elegida al azar.",
      "music.recommend": "Recomendame una canción",
      "music.hint": "Tocá el botón y te elijo una de mis favoritas de Tidal.",
      "music.youtube": "▶ Reproducir en YouTube",
      "music.empty": "Todavía no hay canciones — volvé pronto.",
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
      "pin.credit": "3D Pinball: Space Cadet - el motor no lo hice desde cero; está recompilado a partir de la decompilación de código abierto, con un par de agregados para que pueda reportar tu puntaje al ranking.",
      "pin.creditPort": "port web",
      "pin.creditDecompile": "decompilación",
      "pin.reset": "Reiniciar",
      "face.hint": "Dale, hacé clic.",
      "quest.button": "Misión",
      "quest.line": "Dame el chipá.",
      "quest.done": "Gracias, capo.",
      "quest.doneBurp": "¡Buuurp! Disculpá.",
      "trash.label": "Papelera",
      "bsod.text": "NALLIB.AR\n\nSe produjo una excepción fatal 0E en 0028:C0011E36 al arrastrar\nMI_PC.EXE hasta la PAPELERA.DLL.\n\n*  Presioná cualquier tecla para cerrar este escritorio.\n*  Volvé a presionar cualquier tecla para reiniciar nallib.ar. Vas a\n   perder los cambios sin guardar en todas las ventanas abiertas.",
      "bsod.hint": "Presioná cualquier tecla para continuar _",
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
      "travel.linkText": "Blog de Viajes Encriptado →",
      "travel.marquee": "🌴 ¡Bienvenido a mi página de viajes!!! 🌴 ~*~ Mejor vista en Netscape Navigator a 800x600 ~*~ ¡Gracias por venir!! 🌴",
      "travel.readMore": "Leer más →",
      "tb.contact": "Contacto",
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
      "lang.title": "Switch to English",
      "win.chat": "Chat",
      "tb.chat": "Chat",
      "chat.placeholder": "Escribí un mensaje…",
      "chat.send": "Enviar",
      "chat.signIn": "Ingresar",
      "chat.signUp": "Registrarse",
      "chat.username": "Usuario",
      "chat.email": "Mail",
      "chat.password": "Contraseña (6+ caracteres)",
      "chat.verifyHint": "Revisá tu mail y hacé clic en el link de verificación, después volvé acá para chatear.",
      "chat.recheckVerify": "Ya lo verifiqué - revisar de nuevo",
      "chat.stillNotVerified": "Todavía no está verificado - revisá el mail y probá de nuevo.",
      "chat.resendVerify": "Reenviar mail de verificación",
      "chat.signOut": "Salir",
      "chat.working": "Un momento…",
      "chat.errNoUsername": "Elegí un usuario primero.",
      "chat.errInvalidEmail": "Ese mail no parece válido.",
      "chat.errEmailInUse": "Ese mail ya tiene una cuenta - probá ingresar en vez de registrarte.",
      "chat.errWeakPassword": "La contraseña necesita al menos 6 caracteres.",
      "chat.errBadCredentials": "Mail o contraseña incorrectos.",
      "chat.errTooMany": "Demasiados intentos - esperá un poco y probá de nuevo.",
      "chat.language": "¡Lenguaje!",
      "chat.readOnlyHint": "Cualquiera puede leer este chat. Para escribir, ingresá o registrate.",
      "chat.onlineLabel": "en línea",
      "win.leaderboard": "Ranking",
      "tb.leaderboard": "Ranking",
      "leaderboard.msBeginner": "Principiante",
      "leaderboard.msIntermediate": "Intermedio",
      "leaderboard.msExpert": "Experto",
      "leaderboard.solitaire": "Solitario",
      "leaderboard.pinball": "Pinball",
      "leaderboard.moves": "movimientos",
      "leaderboard.seconds": "s",
      "leaderboard.points": "pts",
      "leaderboard.empty": "Todavía no hay puntajes - ¡sé el primero!",
      "score.title": "¿Guardar tu puntaje?",
      "score.summaryPrefix": "Hiciste:",
      "score.namePlaceholder": "Tu nombre",
      "score.submit": "Enviar",
      "score.skip": "Omitir"
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
      if (window.SFX) window.SFX.click();
      setLang(current === "en" ? "es" : "en");
    });
  }

  applyStatic();
})();
