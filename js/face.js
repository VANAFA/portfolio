// Puppet jaw: the lower jaw is a separate layer hinged at the corner of the mouth.
// It opens as the cursor approaches the mouth and closes as it moves away, eased
// frame to frame so it never snaps.
//
// Tuning constants, all in one place:
//   PIVOT_*    hinge point, as a fraction of the image (240,325 of 390x608)
//   MOUTH_*    the point the cursor distance is measured to
//   MAX_ANGLE  how far the jaw drops, in degrees
//   NEAR_PX    distance at which the jaw is fully open
//   FAR_PX     distance beyond which it is fully shut
(function () {
  var rig = document.getElementById("face-rig");
  if (!rig) return;
  var jaw = rig.querySelector(".face-jaw");
  if (!jaw) return;

  var PIVOT_X = 240 / 390;
  var PIVOT_Y = 325 / 608;
  var MOUTH_X = 180 / 390;
  var MOUTH_Y = 350 / 608;
  var MAX_ANGLE = 16;
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

  jaw.style.transformOrigin = (PIVOT_X * 100).toFixed(3) + "% " + (PIVOT_Y * 100).toFixed(3) + "%";

  var angle = 0;
  var target = 0;
  var running = false;

  function tick() {
    angle += (target - angle) * EASE;
    if (Math.abs(target - angle) < 0.05) {
      angle = target;
      running = false;
    }
    jaw.style.transform = "rotate(" + (-angle).toFixed(2) + "deg)";
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
    target = t * MAX_ANGLE;
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
    if (document.hidden) { target = 0; angle = 0; jaw.style.transform = "rotate(0deg)"; }
  });

  // Let the hit effect slam the jaw shut while the angry face is showing.
  window.faceJawReset = function () {
    target = 0;
    angle = 0;
    jaw.style.transform = "rotate(0deg)";
  };
})();
