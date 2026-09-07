/*
 * The chipa: a draggable snack that appears at a random spot on the page when
 * the quest is accepted.
 *
 * Drag it towards the face and the jaw opens as it gets close. Let go with the
 * chipa over the mouth and it gets eaten — chomping, crumbs and a swallow —
 * which completes the quest. It only ever appears via the Quest button.
 *
 * Tuning:
 *   NEAR_PX / FAR_PX   distance over which the jaw opens as the chipa approaches
 *   EAT_PX             how close to the mouth counts as "in the mouth"
 */
(function () {
  var chipa = document.getElementById("chipa");
  if (!chipa) return;

  var NEAR_PX = 60;
  var FAR_PX = 260;
  var EAT_PX = 62;
  var CRUMBS = ["#e8ba68", "#d6a04a", "#b3792a", "#f6dea0", "#8a5c1c"];
  var SPARKS = ["#ffffff", "#fff3b0", "#ffe066", "#ffd43b", "#fab005"];

  var eatenCount = 0;   // every 3rd chipa swallowed gets a burp instead of just "thanks"

  var dragging = false;
  var pointerId = null;
  var grabDX = 0;
  var grabDY = 0;

  function viewportSize() {
    return { w: window.innerWidth, h: window.innerHeight };
  }

  // Drop the chipa somewhere random on the page, avoiding the taskbar, the very
  // edges, and the face itself (so it never spawns already-in the mouth).
  function reposition() {
    var vp = viewportSize();
    var size = chipa.offsetWidth || 46;
    var pad = 12;
    var maxX = Math.max(pad, vp.w - size - pad);
    var maxY = Math.max(pad, vp.h - size - 60);   // 60 keeps clear of the taskbar

    var mouth = window.faceJaw ? window.faceJaw.mouthPoint() : null;
    var x, y, tries = 0;
    do {
      x = pad + Math.random() * (maxX - pad);
      y = pad + Math.random() * (maxY - pad);
      tries++;
    } while (
      mouth && tries < 30 &&
      Math.hypot(x + size / 2 - mouth.x, y + size / 2 - mouth.y) < 200
    );

    chipa.style.left = Math.round(x + window.scrollX) + "px";
    chipa.style.top = Math.round(y + window.scrollY) + "px";
  }

  function centre() {
    var r = chipa.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // How far open the jaw should be, given where the chipa currently is.
  function updateJawFromChipa() {
    if (!window.faceJaw) return;
    var mouth = window.faceJaw.mouthPoint();
    var c = centre();
    var d = Math.hypot(c.x - mouth.x, c.y - mouth.y);
    var t = (FAR_PX - d) / (FAR_PX - NEAR_PX);
    window.faceJaw.setOpen(t < 0 ? 0 : t > 1 ? 1 : t);
  }

  function eat() {
    var mouth = window.faceJaw.mouthPoint();
    chipa.classList.add("eaten");
    chipa.style.pointerEvents = "none";

    // Keep Quest disabled for the whole eat -> (maybe burp) -> thank-you
    // sequence, not just while a line is actively typing. Otherwise a click
    // in that gap abandons the pending sequence mid-flight (its callback -
    // spawning a fresh chipa, or a burp's own thank-you line - never runs).
    var questBtn = document.getElementById("quest-btn");
    if (questBtn) questBtn.disabled = true;

    window.faceJaw.chew(4, function () {
      if (window.SFX) window.SFX.swallow();
      eatenCount++;
      var burpTime = eatenCount % 3 === 0;

      setTimeout(function () {
        // The chipa is gone for good until the quest is taken again.
        chipa.hidden = true;
        chipa.classList.remove("eaten");
        chipa.style.pointerEvents = "";

        if (burpTime && window.faceJaw.burp) {
          window.faceJaw.burp(function () {
            if (window.questComplete) window.questComplete(true);
          });
        } else if (window.questComplete) {
          window.questComplete(false);
        }
      }, 350);
    });

    // crumbs, sprayed downward out of the mouth
    var spray = function () {
      if (window.burstParticles) {
        window.burstParticles(mouth.x, mouth.y, CRUMBS, {
          count: 8 + Math.floor(Math.random() * 5),
          minDist: 22, maxDist: 60, minSize: 3, maxSize: 6,
          spread: Math.PI * 0.9, facing: Math.PI / 2
        });
      }
    };
    spray();
    setTimeout(spray, 230);
    setTimeout(spray, 460);
  }

  chipa.addEventListener("pointerdown", function (e) {
    if (dragging) return;
    dragging = true;
    pointerId = e.pointerId;
    var r = chipa.getBoundingClientRect();
    grabDX = e.clientX - r.left;
    grabDY = e.clientY - r.top;
    chipa.classList.add("held");
    if (chipa.setPointerCapture) chipa.setPointerCapture(pointerId);
    if (window.SFX) window.SFX.pick();
    e.preventDefault();
  });

  chipa.addEventListener("pointermove", function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    chipa.style.left = (e.clientX - grabDX + window.scrollX) + "px";
    chipa.style.top = (e.clientY - grabDY + window.scrollY) + "px";
    updateJawFromChipa();
    e.preventDefault();
  });

  function release(e) {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    dragging = false;
    chipa.classList.remove("held");
    if (chipa.releasePointerCapture && pointerId !== null) {
      try { chipa.releasePointerCapture(pointerId); } catch (err) { /* already gone */ }
    }
    pointerId = null;

    var mouth = window.faceJaw ? window.faceJaw.mouthPoint() : null;
    var c = centre();
    if (mouth && Math.hypot(c.x - mouth.x, c.y - mouth.y) <= EAT_PX) {
      eat();
    } else {
      if (window.SFX) window.SFX.drop();
      if (window.faceJaw) window.faceJaw.setOpen(0);
    }
  }

  chipa.addEventListener("pointerup", release);
  chipa.addEventListener("pointercancel", release);

  // Keep it on-screen if the window is resized while it sits there.
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (dragging) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var r = chipa.getBoundingClientRect();
      if (r.right > window.innerWidth || r.bottom > window.innerHeight - 40) reposition();
    }, 200);
  });

  // Only the Quest button brings a chipa into the world. Taking the quest again
  // while one is already out just moves it somewhere new.
  window.chipaQuest = {
    spawn: function () {
      chipa.hidden = false;
      chipa.classList.remove("eaten");
      chipa.style.pointerEvents = "";
      reposition();

      // sparks, so it is obvious where it just landed
      var c = centre();
      if (window.burstParticles) {
        window.burstParticles(c.x, c.y, SPARKS, {
          count: 14 + Math.floor(Math.random() * 5),
          minDist: 26, maxDist: 66, minSize: 2, maxSize: 5
        });
      }
      chipa.classList.remove("spawning");
      void chipa.offsetWidth;
      chipa.classList.add("spawning");
    },
    isOut: function () {
      return !chipa.hidden;
    }
  };
})();
