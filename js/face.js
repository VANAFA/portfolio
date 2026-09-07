/*
 * Jaw controller.
 *
 * The lower jaw is a separate layer that slides straight down, the way a puppet
 * mouth opens. It no longer follows the cursor — it is driven by whatever is
 * happening: the chipa being dragged near the mouth, talking, or chewing.
 *
 * Public API (window.faceJaw):
 *   setOpen(t)     hold the jaw open at t (0 shut .. 1 fully open)
 *   talk(on)       flap the jaw as if speaking
 *   chew(bites, cb)  chomp a number of times, then call cb
 *   mouthPoint()   viewport coords of the mouth, for hit-testing
 *   reset()        slam shut
 *
 * Tuning:
 *   MOUTH_*   where the mouth sits within the 390x608 source image
 *   MAX_DROP  how far the jaw drops, as a fraction of image height
 */
(function () {
  var rig = document.getElementById("face-rig");
  if (!rig) return;
  var jaw = rig.querySelector(".face-jaw");
  if (!jaw) return;

  var MOUTH_X = 180 / 390;
  var MOUTH_Y = 350 / 608;
  var MAX_DROP = 40 / 608;   // 40px of the 608px-tall source
  var EASE = 0.25;

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    /* matchMedia unavailable - assume motion is fine */
  }

  var drop = 0;        // current opening, 0..MAX_DROP
  var target = 0;      // where it is easing towards
  var running = false;
  var talking = false;
  var talkPhase = 0;
  var chewing = false;

  function apply() {
    jaw.style.transform = "translateY(" + (drop * 100).toFixed(3) + "%)";
  }

  function tick() {
    if (talking) {
      // Flap between mostly-shut and mostly-open at a speech-like rate.
      talkPhase += 0.32;
      target = (0.28 + 0.62 * (0.5 + 0.5 * Math.sin(talkPhase))) * MAX_DROP;
    }

    drop += (target - drop) * EASE;
    if (!talking && !chewing && Math.abs(target - drop) < 0.0002) {
      drop = target;
      running = false;
    }
    apply();
    if (running) requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  }

  function mouthPoint() {
    var r = rig.getBoundingClientRect();
    return { x: r.left + r.width * MOUTH_X, y: r.top + r.height * MOUTH_Y, rect: r };
  }

  window.faceJaw = {
    mouthPoint: mouthPoint,

    // Hold the jaw at a fraction of its full travel.
    setOpen: function (t) {
      if (talking || chewing) return;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      target = t * MAX_DROP;
      start();
    },

    talk: function (on) {
      if (reduceMotion) return;
      talking = !!on;
      if (talking) {
        start();
      } else {
        talkPhase = 0;
        target = 0;
        start();
      }
    },

    // Chomp `bites` times, then run the callback.
    chew: function (bites, done) {
      if (reduceMotion) {
        if (done) done();
        return;
      }
      chewing = true;
      talking = false;
      var left = bites || 4;
      var openNext = true;

      function step() {
        if (!left && !openNext) {
          chewing = false;
          target = 0;
          start();
          if (done) done();
          return;
        }
        if (openNext) {
          target = MAX_DROP * (0.75 + Math.random() * 0.25);
          if (window.SFX) window.SFX.chew();
        } else {
          target = MAX_DROP * 0.05;
          left--;
        }
        openNext = !openNext;
        start();
        setTimeout(step, 105 + Math.random() * 55);
      }
      step();
    },

    reset: function () {
      talking = false;
      chewing = false;
      target = 0;
      drop = 0;
      apply();
    },

    // A big open-mouth beat with a shake and a puff, then closes and calls back.
    burp: function (done) {
      if (reduceMotion) {
        if (done) done();
        return;
      }
      chewing = true;
      talking = false;
      target = MAX_DROP;
      start();

      rig.classList.remove("burp");
      void rig.offsetWidth;
      rig.classList.add("burp");
      if (window.SFX) window.SFX.burp();
      if (window.burstParticles) {
        var m = mouthPoint();
        window.burstParticles(m.x, m.y - 8, ["rgba(220,220,220,0.55)", "rgba(190,205,195,0.5)", "rgba(235,235,225,0.6)"], {
          count: 6, minDist: 30, maxDist: 70, minSize: 7, maxSize: 13,
          spread: Math.PI * 0.55, facing: -Math.PI / 2
        });
      }

      setTimeout(function () {
        target = 0;
        chewing = false;
        rig.classList.remove("burp");
        start();
        if (done) done();
      }, 420);
    }
  };

  // Shut the jaw when the tab is hidden.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) window.faceJaw.reset();
  });

  apply();
})();
