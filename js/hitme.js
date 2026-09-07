// Easter egg: clicking the face "hits" it — the head/jaw rig is swapped for the
// angry expression, the whole thing recoils, and red damage particles burst out
// of the point of impact. Everything reverts after a moment.
(function () {
  var rig = document.getElementById("face-rig");
  if (!rig) return;

  var head = rig.querySelector(".face-head");
  var jaw = rig.querySelector(".face-jaw");
  var angry = rig.querySelector(".face-angry");
  if (!head || !jaw || !angry) return;

  var REVERT_MS = 700;
  // Damage colours: bright arterial red through to dark clotted red.
  var COLORS = ["#ff2d2d", "#e00000", "#b00000", "#7a0000", "#ff5a5a"];

  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    /* matchMedia unavailable - assume motion is fine */
  }

  var revertTimer = null;

  function burst(x, y) {
    if (window.burstParticles) window.burstParticles(x, y, COLORS);
  }

  // Randomise the recoil so repeated hits never replay the same canned motion.
  function randomiseRecoil() {
    var dir = Math.random() < 0.5 ? -1 : 1;
    var kickX = (3.5 + Math.random() * 5) * dir;
    var kickY = -(1.5 + Math.random() * 4.5);
    var rot = (1.8 + Math.random() * 3.4) * dir;
    var scale = 1.04 + Math.random() * 0.05;
    var dur = 0.3 + Math.random() * 0.2;

    rig.style.setProperty("--hit-x", kickX.toFixed(2) + "px");
    rig.style.setProperty("--hit-y", kickY.toFixed(2) + "px");
    rig.style.setProperty("--hit-rot", rot.toFixed(2) + "deg");
    rig.style.setProperty("--hit-scale", scale.toFixed(3));
    rig.style.setProperty("--hit-dur", dur.toFixed(3) + "s");
  }

  function showAngry(on) {
    head.hidden = on;
    jaw.hidden = on;
    angry.hidden = !on;
  }

  rig.addEventListener("click", function (e) {
    if (window.SFX) window.SFX.hit();
    showAngry(true);
    if (window.faceJaw) window.faceJaw.reset();

    if (!reduceMotion) {
      // restart the recoil even on rapid repeat clicks, with fresh randomness
      randomiseRecoil();
      rig.classList.remove("hit");
      void rig.offsetWidth;
      rig.classList.add("hit");
      burst(e.clientX, e.clientY);
    }

    clearTimeout(revertTimer);
    revertTimer = setTimeout(function () {
      showAngry(false);
      rig.classList.remove("hit");
    }, REVERT_MS);
  });
})();
