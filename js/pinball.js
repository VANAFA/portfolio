// An original pinball table (not a copy of any specific commercial table -
// same "recreate the idea, not the asset" approach as the Solitaire card
// deck). Canvas-rendered, simple circle/segment physics, no libraries.
(function () {
  var canvas = document.getElementById("pin-canvas");
  if (!canvas) return;
  var windowEl = document.querySelector('[data-window="pinball"]');
  var ctx = canvas.getContext("2d");

  var scoreEl = document.getElementById("pin-score");
  var ballsEl = document.getElementById("pin-balls");
  var statusEl = document.getElementById("pin-status");
  var newGameBtn = document.getElementById("pin-newgame");
  var leftBtn = document.getElementById("pin-left");
  var rightBtn = document.getElementById("pin-right");
  var launchBtn = document.getElementById("pin-launch");

  // ---- table geometry (fixed internal coordinate space) -----------------
  var W = 300, H = 500;
  var LANE_X = 268; // divider between the launch lane and the main field

  // Table boundary, open at the bottom middle (the drain gap). The lane is
  // fully sealed off from the field by a straight wall (see LANE_WALLS) -
  // earlier attempts at an open gap or an angled "guide" wall relied on
  // either the ball's free-flight arc or the exact angle of a collision to
  // carry it sideways into the field, and both were too fiddly to land
  // reliably. Getting the ball from the lane into the field is instead a
  // single deterministic transition in update() once it reaches the top of
  // the (sealed) lane - simpler and, more importantly, actually reliable.
  var BOUNDARY = [
    [10, 320], [10, 60], [40, 15], [LANE_X, 15],
  ];
  var LANE_WALLS = [
    [[LANE_X, 470], [LANE_X, 15]],
    [[290, 470], [290, 15]],
    [[LANE_X, 15], [290, 15]],
    [[LANE_X, 470], [290, 470]], // lane floor - catches a launch that falls back without enough speed
  ];
  // Flipper-side lower walls (funnel down toward the drain gap)
  var LOWER_WALLS = [
    [[10, 320], [40, 430]],
    [[LANE_X, 320], [LANE_X - 30, 430]],
  ];

  var BUMPERS = [
    { x: 96, y: 150, r: 19 },
    { x: 182, y: 150, r: 19 },
    { x: 139, y: 105, r: 21 },
  ];

  var FLIPPER_LEN = 52;
  // angle convention: tip = pivot + (cos(angle), sin(angle)) * LEN * side.
  // Both flippers point toward the center gap at rest (angled down) and
  // swing toward horizontal/up when activated - side mirrors left/right.
  var flippers = {
    left: { pivot: [78, 434], rest: 1.0, active: -0.35, side: 1, angle: 0, prevAngle: 0, activation: 0 },
    right: { pivot: [LANE_X - 44, 434], rest: -1.0, active: 0.35, side: -1, angle: 0, prevAngle: 0, activation: 0 }
  };
  flippers.left.angle = flippers.left.prevAngle = flippers.left.rest;
  flippers.right.angle = flippers.right.prevAngle = flippers.right.rest;

  var DRAIN_Y = 495;
  var GRAVITY = 0.32;
  var WALL_RESTITUTION = 0.72;
  var BUMPER_RESTITUTION = 1.35;
  var BALL_R = 7;

  var ball = null; // { x, y, vx, vy, inLane }
  var score = 0;
  var ballsLeft = 0;
  var state = "idle"; // idle | ready | playing | over
  var charge = 0;
  var awaitingFieldEntry = false; // launched, hasn't transitioned into the field yet
  var chargeHandle = null;
  var bumperFlash = {}; // index -> ms remaining

  function t(key) { return window.t ? window.t(key) : key; }

  var statusKey = null;
  function setStatus(key) {
    statusKey = key;
    statusEl.textContent = key ? t(key) : "";
  }

  function updateHud() {
    scoreEl.textContent = String(score).padStart(6, "0");
    ballsEl.textContent = String(Math.max(0, ballsLeft));
  }

  // ---- ball lifecycle -----------------------------------------------------

  function spawnBall() {
    ball = { x: 279, y: 460, vx: 0, vy: 0, inLane: true };
    state = "ready";
    setStatus("pin.readyToLaunch");
  }

  function newGame() {
    score = 0;
    ballsLeft = 3;
    updateHud();
    if (window.SFX) window.SFX.shuffle();
    spawnBall();
  }

  function loseBall() {
    ball = null;
    ballsLeft--;
    updateHud();
    if (ballsLeft <= 0) {
      state = "over";
      setStatus("pin.gameOver");
      if (window.SFX) window.SFX.gameover();
    } else {
      if (window.SFX) window.SFX.drain();
      spawnBall();
    }
  }

  // ---- input ---------------------------------------------------------------

  function setFlipper(side, on) {
    var f = flippers[side];
    if (on && f.activation === 0 && window.SFX) window.SFX.flipper();
    f.activation = on ? 1 : 0;
  }

  function startCharge() {
    if (state !== "ready" || !ball || !ball.inLane) return;
    charge = 0;
    clearInterval(chargeHandle);
    chargeHandle = setInterval(function () {
      charge = Math.min(1, charge + 0.045);
    }, 16);
  }

  function releaseLaunch() {
    clearInterval(chargeHandle);
    if (state !== "ready" || !ball || !ball.inLane) { charge = 0; return; }
    ball.vy = -(6 + charge * 13);
    ball.vx = 0;
    ball.inLane = false;
    awaitingFieldEntry = true; // see the field-entry transition in update()
    state = "playing";
    setStatus(null);
    if (window.SFX) window.SFX.launch();
    charge = 0;
  }

  function bindHold(el, onDown, onUp) {
    if (!el) return;
    el.addEventListener("pointerdown", function (e) { e.preventDefault(); onDown(); });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointerleave", onUp);
    el.addEventListener("pointercancel", onUp);
  }
  bindHold(leftBtn, function () { setFlipper("left", true); }, function () { setFlipper("left", false); });
  bindHold(rightBtn, function () { setFlipper("right", true); }, function () { setFlipper("right", false); });
  bindHold(launchBtn, startCharge, releaseLaunch);

  function isVisible() { return windowEl && !windowEl.hidden; }

  document.addEventListener("keydown", function (e) {
    if (!isVisible() || e.repeat) return;
    if (e.key === "z" || e.key === "Z" || e.key === "ArrowLeft") { setFlipper("left", true); e.preventDefault(); }
    else if (e.key === "/" || e.key === "ArrowRight") { setFlipper("right", true); e.preventDefault(); }
    else if (e.key === " ") { startCharge(); e.preventDefault(); }
  });
  document.addEventListener("keyup", function (e) {
    if (e.key === "z" || e.key === "Z" || e.key === "ArrowLeft") setFlipper("left", false);
    else if (e.key === "/" || e.key === "ArrowRight") setFlipper("right", false);
    else if (e.key === " ") releaseLaunch();
  });

  if (newGameBtn) newGameBtn.addEventListener("click", newGame);

  document.addEventListener("langchange", function () {
    if (statusKey) setStatus(statusKey);
  });

  // ---- physics helpers ------------------------------------------------------

  function closestPointOnSegment(px, py, ax, ay, bx, by) {
    var abx = bx - ax, aby = by - ay;
    var len2 = abx * abx + aby * aby;
    var tt = len2 ? ((px - ax) * abx + (py - ay) * aby) / len2 : 0;
    tt = Math.max(0, Math.min(1, tt));
    return [ax + abx * tt, ay + aby * tt];
  }

  function resolveSegment(ax, ay, bx, by, kickVx, kickVy) {
    var cp = closestPointOnSegment(ball.x, ball.y, ax, ay, bx, by);
    var dx = ball.x - cp[0], dy = ball.y - cp[1];
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0 || dist >= BALL_R) return false;
    var nx = dx / dist, ny = dy / dist;
    var overlap = BALL_R - dist;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
    var vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      ball.vx -= (1 + WALL_RESTITUTION) * vn * nx;
      ball.vy -= (1 + WALL_RESTITUTION) * vn * ny;
    }
    if (kickVx) { ball.vx += kickVx; ball.vy += kickVy; }
    return true;
  }

  function segmentsFromLoop(points) {
    var segs = [];
    for (var i = 0; i < points.length - 1; i++) segs.push([points[i], points[i + 1]]);
    return segs;
  }
  var boundarySegs = segmentsFromLoop(BOUNDARY);

  function flipperEndpoint(f) {
    return [f.pivot[0] + Math.cos(f.angle) * FLIPPER_LEN * f.side, f.pivot[1] + Math.sin(f.angle) * FLIPPER_LEN * f.side];
  }

  function stepFlipper(f, dt) {
    var target = f.activation ? f.active : f.rest;
    f.prevAngle = f.angle;
    var speed = 0.35; // radians per frame at 60fps-equivalent
    var diff = target - f.angle;
    var maxStep = speed * (dt / 16.7);
    if (Math.abs(diff) <= maxStep) f.angle = target;
    else f.angle += Math.sign(diff) * maxStep;
  }

  function resolveFlipper(f) {
    var tip = flipperEndpoint(f);
    var hit = resolveSegment(f.pivot[0], f.pivot[1], tip[0], tip[1], 0, 0);
    if (!hit) return;
    // Add a kick proportional to how fast the flipper is currently swinging,
    // in the direction its tip is moving - this is what makes an active
    // flick feel different from just resting against it.
    var angVel = f.angle - f.prevAngle;
    var kick = angVel * FLIPPER_LEN * 0.9;
    var perpX = -Math.sin(f.angle) * f.side;
    var perpY = Math.cos(f.angle) * f.side;
    ball.vx += perpX * kick;
    ball.vy += perpY * kick;
  }

  function resolveBumper(b, index) {
    var dx = ball.x - b.x, dy = ball.y - b.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0 || dist >= BALL_R + b.r) return;
    var nx = dx / dist, ny = dy / dist;
    var overlap = BALL_R + b.r - dist;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
    var speed = Math.max(4, Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * BUMPER_RESTITUTION);
    ball.vx = nx * speed;
    ball.vy = ny * speed;
    score += 100;
    updateHud();
    bumperFlash[index] = 150;
    if (window.SFX) window.SFX.bumper();
    if (window.burstParticles) {
      var r = canvas.getBoundingClientRect();
      var sx = r.left + (b.x / W) * r.width;
      var sy = r.top + (b.y / H) * r.height;
      window.burstParticles(sx, sy, ["#ffd700", "#fff", "#ff9900"], { count: 10, minDist: 20, maxDist: 46 });
    }
  }

  // ---- main loop -------------------------------------------------------------

  var lastTs = null;

  function update(dt) {
    stepFlipper(flippers.left, dt);
    stepFlipper(flippers.right, dt);

    for (var key in bumperFlash) {
      bumperFlash[key] -= dt;
      if (bumperFlash[key] <= 0) delete bumperFlash[key];
    }

    if (!ball) return;

    if (ball.inLane) {
      // resting in the lane, waiting for launch - no physics needed
    } else {
      // A fast ball can move further in one frame than a wall is thick,
      // and skip clean over it (checking only the start/end position of
      // the frame misses everything in between). Substepping - resolving
      // collisions several times per frame, each covering a smaller
      // distance - is a simple, standard fix for that without needing full
      // continuous collision detection.
      var SUBSTEPS = 6;
      for (var i = 0; i < SUBSTEPS; i++) physicsSubstep(1 / SUBSTEPS);

      // The lane is a fully sealed straight channel (see LANE_WALLS) - a
      // launched ball just goes straight up and back down inside it. Once
      // it's gotten high enough to have cleared the top of the field's own
      // walls, hand it off into the field with a set trajectory rather than
      // trying to get collision physics to carry it sideways on its own
      // (see the comment at LANE_WALLS for why that didn't work out).
      if (awaitingFieldEntry && ball.y <= 120) {
        ball.x = 255;
        ball.vx = -6.5;
        if (ball.vy > 0) ball.vy = 1;
        awaitingFieldEntry = false;
      }

      if (awaitingFieldEntry && ball.x > LANE_X && ball.vy > 0 && ball.y > 450) {
        // Fell back without enough speed to reach the field - let the
        // player just try the launch again instead of losing the ball.
        resetBallToLane();
      } else if (ball.y > DRAIN_Y) {
        loseBall();
      } else if (ball.x < -40 || ball.x > W + 40 || ball.y < -80) {
        // Defensive backstop: should never happen, but if the ball ever
        // did tunnel out of the play area, don't let it fly off forever.
        resetBallToLane();
      }
    }
  }

  function resetBallToLane() {
    ball.x = 279; ball.y = 460; ball.vx = 0; ball.vy = 0;
    ball.inLane = true;
    awaitingFieldEntry = false;
    state = "ready";
    setStatus("pin.readyToLaunch");
  }

  function physicsSubstep(fraction) {
    ball.vy += GRAVITY * fraction;
    var sp = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    var MAXSP = 24; // comfortably above the strongest launch (~19) or bumper kick
    if (sp > MAXSP) { ball.vx = (ball.vx / sp) * MAXSP; ball.vy = (ball.vy / sp) * MAXSP; }

    ball.x += ball.vx * fraction;
    ball.y += ball.vy * fraction;

    boundarySegs.forEach(function (s) { resolveSegment(s[0][0], s[0][1], s[1][0], s[1][1]); });
    LANE_WALLS.forEach(function (s) { resolveSegment(s[0][0], s[0][1], s[1][0], s[1][1]); });
    LOWER_WALLS.forEach(function (s) { resolveSegment(s[0][0], s[0][1], s[1][0], s[1][1]); });
    BUMPERS.forEach(resolveBumper);
    resolveFlipper(flippers.left);
    resolveFlipper(flippers.right);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a1a3a";
    ctx.fillRect(0, 0, W, H);

    // table boundary
    ctx.strokeStyle = "#8fa8ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(BOUNDARY[0][0], BOUNDARY[0][1]);
    BOUNDARY.forEach(function (p) { ctx.lineTo(p[0], p[1]); });
    ctx.stroke();

    ctx.beginPath();
    LANE_WALLS.concat(LOWER_WALLS).forEach(function (s) {
      ctx.moveTo(s[0][0], s[0][1]);
      ctx.lineTo(s[1][0], s[1][1]);
    });
    ctx.stroke();

    // drain gap marker
    ctx.strokeStyle = "#402020";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, DRAIN_Y);
    ctx.lineTo(LANE_X - 30, DRAIN_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // bumpers
    BUMPERS.forEach(function (b, i) {
      var lit = !!bumperFlash[i];
      ctx.fillStyle = lit ? "#fff2b0" : "#ffcc33";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8a5a00";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });

    // flippers
    [flippers.left, flippers.right].forEach(function (f) {
      var tip = flipperEndpoint(f);
      ctx.strokeStyle = "#e8e8f0";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(f.pivot[0], f.pivot[1]);
      ctx.lineTo(tip[0], tip[1]);
      ctx.stroke();
    });

    // launch lane charge meter
    if (state === "ready" && charge > 0) {
      ctx.fillStyle = "#ff5050";
      ctx.fillRect(LANE_X + 6, 460 - charge * 120, 10, charge * 120);
    }

    // ball
    if (ball) {
      ctx.fillStyle = "#f0f0f5";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!isVisible()) { lastTs = null; return; }
    if (lastTs === null) lastTs = ts;
    var dt = Math.min(40, ts - lastTs);
    lastTs = ts;
    if (state === "playing" || state === "ready") update(dt);
    draw();
  }

  newGame();
  requestAnimationFrame(frame);
})();
