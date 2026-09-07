// Easter egg: clicking the profile photo "hits" it — the expression switches to
// images/expresions/angry.png, the photo recoils, and particles burst out of the
// point of impact. Everything reverts after a moment.
(function () {
  var photo = document.querySelector(".profile-photo");
  if (!photo) return;

  var NORMAL_SRC = photo.getAttribute("src");
  var ANGRY_SRC = "images/expresions/angry.png";
  var REVERT_MS = 700;
  var COLORS = ["#f03e3e", "#f2c200", "#1971c2", "#37b24d", "#ffffff"];

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    /* matchMedia unavailable - assume motion is fine */
  }

  // Preload so the first hit doesn't flash an empty frame.
  var preload = new Image();
  preload.src = ANGRY_SRC;

  var revertTimer = null;

  function burst(x, y) {
    var count = 14;
    for (var i = 0; i < count; i++) {
      var particle = document.createElement("span");
      particle.className = "hit-particle";

      var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      var distance = 38 + Math.random() * 46;
      var size = 3 + Math.floor(Math.random() * 4);

      particle.style.left = x + "px";
      particle.style.top = y + "px";
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.background = COLORS[i % COLORS.length];
      particle.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      particle.style.setProperty("--dy", Math.sin(angle) * distance + "px");
      particle.style.animationDelay = (Math.random() * 40) + "ms";

      particle.addEventListener("animationend", function () {
        if (this.parentNode) this.parentNode.removeChild(this);
      });
      document.body.appendChild(particle);
    }
  }

  photo.addEventListener("click", function (e) {
    photo.src = ANGRY_SRC;

    if (!reduceMotion) {
      // restart the recoil animation even on rapid repeat clicks
      photo.classList.remove("hit");
      void photo.offsetWidth;
      photo.classList.add("hit");
      burst(e.clientX, e.clientY);
    }

    clearTimeout(revertTimer);
    revertTimer = setTimeout(function () {
      photo.src = NORMAL_SRC;
      photo.classList.remove("hit");
    }, REVERT_MS);
  });
})();
