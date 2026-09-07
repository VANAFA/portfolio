// Puppet jaw: the lower jaw is a separate layer that slides straight down, the
// way a puppet mouth opens. It opens as the cursor approaches the mouth and
// closes as it moves away, eased frame to frame so it never snaps.
//
// Tuning constants, all in one place:
//   MOUTH_*   the point the cursor distance is measured to
//   MAX_DROP  how far the jaw drops, as a fraction of the image height
//   NEAR_PX   distance at which the jaw is fully open
//   FAR_PX    distance beyond which it is fully shut
(function () {
  var rig = document.getElementById("face-rig");
  if (!rig) return;
  var jaw = rig.querySelector(".face-jaw");
  if (!jaw) return;

  var MOUTH_X = 180 / 390;
  var MOUTH_Y = 350 / 608;
  var MAX_DROP = 40 / 608;   // 40px of the 608px-tall source
  var NEAR_PX = 55;
  var FAR_PX = 230;
  var EASE = 0.2;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    /* matchMedia unavailable - assume motion is fine */
  }
  if (reduceMotion) return;

  var drop = 0;      // current offset, as a fraction of rig height
  var target = 0;
  var running = false;

  function tick() {
    drop += (target - drop) * EASE;
    if (Math.abs(target - drop) < 0.0002) {
      drop = target;
      running = false;
    }
    jaw.style.transform = "translateY(" + (drop * 100).toFixed(3) + "%)";
    if (running) requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  }

  function setTargetFromPointer(clientX, clientY) {
    // Hidden (e.g. while the angry face shows) or window closed: shut the jaw.
    if (rig.offsetParent === null || jaw.hidden) {
      target = 0;
      start();
      return;
    }
    var r = rig.getBoundingClientRect();
    var mx = r.left + r.width * MOUTH_X;
    var my = r.top + r.height * MOUTH_Y;
    var d = Math.hypot(clientX - mx, clientY - my);

    var t = (FAR_PX - d) / (FAR_PX - NEAR_PX);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    target = t * MAX_DROP;
    start();
  }

  window.addEventListener("mousemove", function (e) {
    setTargetFromPointer(e.clientX, e.clientY);
  }, { passive: true });

  // Pointer gone / tabbed away: let the jaw fall shut.
  window.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget) {
      target = 0;
      start();
    }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { target = 0; drop = 0; jaw.style.transform = "translateY(0)"; }
  });

  // Let the hit effect slam the jaw shut while the angry face is showing.
  window.faceJawReset = function () {
    target = 0;
    drop = 0;
    jaw.style.transform = "translateY(0)";
  };
})();
