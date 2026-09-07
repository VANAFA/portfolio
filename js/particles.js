// Shared particle burst, used by the hit reaction (red) and by chewing (crumbs).
(function () {
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    /* matchMedia unavailable - assume motion is fine */
  }

  // x, y are viewport coordinates (the particles are position:fixed).
  window.burstParticles = function (x, y, colors, options) {
    if (reduceMotion) return;
    var opts = options || {};
    var count = opts.count || (11 + Math.floor(Math.random() * 7));
    var minDist = opts.minDist || 38;
    var maxDist = opts.maxDist || 84;
    var minSize = opts.minSize || 3;
    var maxSize = opts.maxSize || 7;
    var spin = Math.random() * Math.PI * 2;
    var spread = opts.spread || Math.PI * 2;
    var facing = opts.facing || 0;

    for (var i = 0; i < count; i++) {
      var particle = document.createElement("span");
      particle.className = "hit-particle";

      var angle = spread >= Math.PI * 2
        ? spin + (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
        : facing - spread / 2 + (spread * i) / Math.max(1, count - 1) + (Math.random() - 0.5) * 0.3;
      var distance = minDist + Math.random() * (maxDist - minDist);
      var size = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));

      particle.style.left = x + "px";
      particle.style.top = y + "px";
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.background = colors[i % colors.length];
      particle.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      particle.style.setProperty("--dy", Math.sin(angle) * distance + "px");
      particle.style.animationDelay = (Math.random() * 40) + "ms";

      particle.addEventListener("animationend", function () {
        if (this.parentNode) this.parentNode.removeChild(this);
      });
      document.body.appendChild(particle);
    }
  };
})();
