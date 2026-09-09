// Visual editor for the encrypted travel blog (see FEATURES.md / TODO's "make
// me a UI to write my travel blogs" ask). Not part of the public site - only
// reachable by knowing this page's URL (see the on-page warning for what that
// does and doesn't protect).
//
// Produces the exact same window.TRAVEL_SALT / TRAVEL_ITERATIONS /
// TRAVEL_ENTRIES shape tools/encrypt_travel.js writes (see that file for the
// wire format), via WebCrypto instead of Node's crypto - the two are
// interoperable (same AES-256-GCM + PBKDF2-SHA256 construction, same
// ciphertext||tag layout), so either tool can produce a file the other's
// output already works with, and js/travel.js can't tell which one wrote it.
(function () {
  var state = {
    salt: null,          // Uint8Array, only meaningful once loaded/built
    trips: [],            // [{ id, title:{en,es}, location:{en,es}, date, blocks:[...] }]
  };
  // block shapes while editing:
  //   { type: "text", body: {en, es} }
  //   { type: "image", mime, bytes: ArrayBuffer, date: "" | "YYYY-MM-DD", _url: cached object URL }

  var ITERATIONS = 250000;

  // ---- crypto helpers (mirrors tools/encrypt_travel.js / js/travel.js) ----

  function normalizeAnswer(s) {
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  function bytesToB64(bytes) {
    var binary = "";
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function deriveKey(answer, salt, iterations, usages) {
    var enc = new TextEncoder();
    return crypto.subtle
      .importKey("raw", enc.encode(normalizeAnswer(answer)), "PBKDF2", false, ["deriveKey"])
      .then(function (baseKey) {
        return crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
          baseKey,
          { name: "AES-GCM", length: 256 },
          false,
          usages
        );
      });
  }

  function encryptBuffer(key, buf) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, buf).then(function (ct) {
      return { iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(ct)) };
    });
  }
  function encryptText(key, str) {
    return encryptBuffer(key, new TextEncoder().encode(str));
  }

  function decryptBuffer(key, field) {
    var iv = b64ToBytes(field.iv);
    var data = b64ToBytes(field.data);
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
  }
  function decryptText(key, field) {
    return decryptBuffer(key, field).then(function (buf) { return new TextDecoder().decode(buf); });
  }

  // ---- loading + decrypting existing js/traveldata.js ----

  function decryptBlockRaw(key, block) {
    if (block.type === "image") {
      return Promise.all([
        decryptBuffer(key, block),
        block.date ? decryptText(key, block.date) : Promise.resolve(""),
      ]).then(function (r) {
        return { type: "image", mime: block.mime, bytes: r[0], date: r[1] };
      });
    }
    return Promise.all([decryptText(key, block.body.en), decryptText(key, block.body.es)]).then(function (r) {
      return { type: "text", body: { en: r[0], es: r[1] } };
    });
  }

  function decryptEntry(key, entry) {
    return Promise.all([
      decryptText(key, entry.title.en),
      decryptText(key, entry.title.es),
      decryptText(key, entry.location.en),
      decryptText(key, entry.location.es),
      decryptText(key, entry.date),
      Promise.all((entry.blocks || []).map(function (b) { return decryptBlockRaw(key, b); })),
    ]).then(function (r) {
      return { id: entry.id, title: { en: r[0], es: r[1] }, location: { en: r[2], es: r[3] }, date: r[4], blocks: r[5] };
    });
  }

  function loadExisting(answer) {
    var salt = b64ToBytes(window.TRAVEL_SALT);
    var iterations = window.TRAVEL_ITERATIONS || ITERATIONS;
    return deriveKey(answer, salt, iterations, ["decrypt"])
      .then(function (key) {
        return Promise.all((window.TRAVEL_ENTRIES || []).map(function (entry) { return decryptEntry(key, entry); }));
      })
      .then(function (trips) {
        state.trips = trips;
      });
  }

  // ---- building fresh encrypted output ----

  function encryptBlock(key, block) {
    if (block.type === "image") {
      return Promise.all([
        encryptBuffer(key, block.bytes),
        block.date ? encryptText(key, block.date) : Promise.resolve(null),
      ]).then(function (r) {
        return Object.assign({ type: "image", mime: block.mime }, r[0], { date: r[1] });
      });
    }
    return Promise.all([
      encryptText(key, block.body.en),
      encryptText(key, block.body.es || block.body.en),
    ]).then(function (r) {
      return { type: "text", body: { en: r[0], es: r[1] } };
    });
  }

  function encryptEntry(key, trip) {
    return Promise.all([
      encryptText(key, trip.title.en),
      encryptText(key, trip.title.es || trip.title.en),
      encryptText(key, trip.location.en),
      encryptText(key, trip.location.es || trip.location.en),
      encryptText(key, trip.date),
      Promise.all(trip.blocks.map(function (b) { return encryptBlock(key, b); })),
    ]).then(function (r) {
      return { id: trip.id, title: { en: r[0], es: r[1] }, location: { en: r[2], es: r[3] }, date: r[4], blocks: r[5] };
    });
  }

  function buildTravelData(answer) {
    var salt = crypto.getRandomValues(new Uint8Array(16)); // fresh every build, same as the CLI tool does per run
    return deriveKey(answer, salt, ITERATIONS, ["encrypt"])
      .then(function (key) {
        return Promise.all(state.trips.map(function (trip) { return encryptEntry(key, trip); }));
      })
      .then(function (entries) {
        return (
          "// Generated by js/travel-admin.js - do not hand-edit.\n" +
          "// Ciphertext only: the real content only exists in plaintext on the\n" +
          "// machine that built this (browser memory here, never sent anywhere\n" +
          "// but straight into this same encryption step).\n" +
          "window.TRAVEL_SALT = " + JSON.stringify(bytesToB64(salt)) + ";\n" +
          "window.TRAVEL_ITERATIONS = " + ITERATIONS + ";\n" +
          "window.TRAVEL_ENTRIES = " + JSON.stringify(entries, null, 2) + ";\n"
        );
      });
  }

  // ---- id/slug helpers ----

  function slugify(s) {
    return (s || "trip")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "trip";
  }

  function uniqueId(base) {
    var id = base, n = 1;
    var taken = state.trips.map(function (t) { return t.id; });
    while (taken.indexOf(id) !== -1) { id = base + "-" + (++n); }
    return id;
  }

  // ---- UI ----

  var loadAnswerEl = document.getElementById("admin-load-answer");
  var loadStatusEl = document.getElementById("admin-load-status");
  var editorEl = document.getElementById("admin-editor");
  var tripsEl = document.getElementById("admin-trips");
  var answerEl = document.getElementById("admin-answer");
  var buildStatusEl = document.getElementById("admin-build-status");
  var outputEl = document.getElementById("admin-output");
  var downloadEl = document.getElementById("admin-download");
  var ghStatusEl = document.getElementById("gh-status");

  function setStatus(el, text, kind) {
    el.textContent = text;
    el.className = "admin-status" + (kind ? " " + kind : "");
  }

  function openEditor() {
    editorEl.hidden = false;
    renderTrips();
  }

  function newTrip() {
    return { id: uniqueId("trip"), title: { en: "", es: "" }, location: { en: "", es: "" }, date: "", blocks: [] };
  }

  function blockImageUrl(block) {
    if (!block._url) block._url = URL.createObjectURL(new Blob([block.bytes], { type: block.mime }));
    return block._url;
  }

  function renderTrips() {
    tripsEl.innerHTML = state.trips.map(function (trip, ti) {
      var blocksHtml = trip.blocks.map(function (block, bi) {
        if (block.type === "image") {
          return (
            '<div class="admin-block" data-ti="' + ti + '" data-bi="' + bi + '">' +
            '<div class="admin-block-head"><span>Image</span>' + blockControls(ti, bi, trip.blocks.length) + "</div>" +
            (block.bytes ? '<img src="' + blockImageUrl(block) + '" alt="">' : "") +
            '<input type="file" accept="image/*" data-role="image-file" data-ti="' + ti + '" data-bi="' + bi + '"><br>' +
            '<label>Date (optional): <input type="date" data-role="image-date" data-ti="' + ti + '" data-bi="' + bi + '" value="' + escapeAttr(block.date || "") + '"></label>' +
            "</div>"
          );
        }
        return (
          '<div class="admin-block" data-ti="' + ti + '" data-bi="' + bi + '">' +
          '<div class="admin-block-head"><span>Text</span>' + blockControls(ti, bi, trip.blocks.length) + "</div>" +
          '<textarea rows="2" placeholder="English" data-role="text-en" data-ti="' + ti + '" data-bi="' + bi + '">' + escapeHtml(block.body.en) + "</textarea>" +
          '<textarea rows="2" placeholder="Español" data-role="text-es" data-ti="' + ti + '" data-bi="' + bi + '">' + escapeHtml(block.body.es) + "</textarea>" +
          "</div>"
        );
      }).join("");

      return (
        '<div class="admin-trip" data-ti="' + ti + '">' +
        '<div class="admin-trip-head"><strong>Trip ' + (ti + 1) + " (" + escapeHtml(trip.id) + ')</strong>' +
        '<button type="button" class="btn98 admin-btn-sm" data-action="remove-trip" data-ti="' + ti + '">Remove trip</button>' +
        "</div>" +
        '<div class="admin-row"><label>Title (EN)</label><input type="text" data-role="title-en" data-ti="' + ti + '" value="' + escapeAttr(trip.title.en) + '"></div>' +
        '<div class="admin-row"><label>Title (ES)</label><input type="text" data-role="title-es" data-ti="' + ti + '" value="' + escapeAttr(trip.title.es) + '"></div>' +
        '<div class="admin-row"><label>Location (EN)</label><input type="text" data-role="loc-en" data-ti="' + ti + '" value="' + escapeAttr(trip.location.en) + '"></div>' +
        '<div class="admin-row"><label>Location (ES)</label><input type="text" data-role="loc-es" data-ti="' + ti + '" value="' + escapeAttr(trip.location.es) + '"></div>' +
        '<div class="admin-row"><label>Trip date</label><input type="date" data-role="trip-date" data-ti="' + ti + '" value="' + escapeAttr(trip.date) + '"></div>' +
        "<p><strong>Blocks</strong> (shown in this order - drag isn't wired up, use the arrows)</p>" +
        blocksHtml +
        '<button type="button" class="btn98 admin-btn-sm" data-action="add-text" data-ti="' + ti + '">+ Text block</button> ' +
        '<button type="button" class="btn98 admin-btn-sm" data-action="add-image" data-ti="' + ti + '">+ Image block</button>' +
        "</div>"
      );
    }).join("");

    attachTripListeners();
  }

  function blockControls(ti, bi, count) {
    return (
      '<span>' +
      '<button type="button" class="btn98 admin-btn-sm" data-action="move-up" data-ti="' + ti + '" data-bi="' + bi + '"' + (bi === 0 ? " disabled" : "") + '>↑</button> ' +
      '<button type="button" class="btn98 admin-btn-sm" data-action="move-down" data-ti="' + ti + '" data-bi="' + bi + '"' + (bi === count - 1 ? " disabled" : "") + '>↓</button> ' +
      '<button type="button" class="btn98 admin-btn-sm" data-action="remove-block" data-ti="' + ti + '" data-bi="' + bi + '">Remove</button>' +
      "</span>"
    );
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
  }

  function attachTripListeners() {
    // Field edits mutate state directly (no re-render) so focus/cursor position survives typing.
    tripsEl.querySelectorAll("input[data-role], textarea[data-role]").forEach(function (el) {
      el.addEventListener("input", function () {
        var ti = Number(el.dataset.ti);
        var trip = state.trips[ti];
        switch (el.dataset.role) {
          case "title-en": trip.title.en = el.value; break;
          case "title-es": trip.title.es = el.value; break;
          case "loc-en": trip.location.en = el.value; break;
          case "loc-es": trip.location.es = el.value; break;
          case "trip-date": trip.date = el.value; break;
          case "text-en": trip.blocks[Number(el.dataset.bi)].body.en = el.value; break;
          case "text-es": trip.blocks[Number(el.dataset.bi)].body.es = el.value; break;
          case "image-date": trip.blocks[Number(el.dataset.bi)].date = el.value; break;
        }
      });
    });

    tripsEl.querySelectorAll('input[data-role="image-file"]').forEach(function (el) {
      el.addEventListener("change", function () {
        var file = el.files && el.files[0];
        if (!file) return;
        var ti = Number(el.dataset.ti), bi = Number(el.dataset.bi);
        file.arrayBuffer().then(function (buf) {
          var block = state.trips[ti].blocks[bi];
          if (block._url) URL.revokeObjectURL(block._url);
          block.bytes = buf;
          block.mime = file.type || "image/jpeg";
          block._url = null;
          renderTrips();
        });
      });
    });

    tripsEl.querySelectorAll("button[data-action]").forEach(function (el) {
      el.addEventListener("click", function () {
        var ti = Number(el.dataset.ti);
        var bi = el.dataset.bi !== undefined ? Number(el.dataset.bi) : null;
        var trip = state.trips[ti];
        switch (el.dataset.action) {
          case "remove-trip":
            if (confirm("Remove this trip? This can't be undone here (it's still fine if you haven't pushed yet).")) {
              state.trips.splice(ti, 1);
            }
            break;
          case "add-text":
            trip.blocks.push({ type: "text", body: { en: "", es: "" } });
            break;
          case "add-image":
            trip.blocks.push({ type: "image", mime: "", bytes: null, date: "" });
            break;
          case "remove-block":
            trip.blocks.splice(bi, 1);
            break;
          case "move-up":
            if (bi > 0) { var tmp = trip.blocks[bi - 1]; trip.blocks[bi - 1] = trip.blocks[bi]; trip.blocks[bi] = tmp; }
            break;
          case "move-down":
            if (bi < trip.blocks.length - 1) { var tmp2 = trip.blocks[bi + 1]; trip.blocks[bi + 1] = trip.blocks[bi]; trip.blocks[bi] = tmp2; }
            break;
        }
        renderTrips();
      });
    });
  }

  document.getElementById("admin-add-trip").addEventListener("click", function () {
    state.trips.push(newTrip());
    renderTrips();
  });

  document.getElementById("admin-load-btn").addEventListener("click", function () {
    var answer = loadAnswerEl.value;
    if (!answer) { setStatus(loadStatusEl, "Enter the current passphrase first.", "error"); return; }
    setStatus(loadStatusEl, "Decrypting…");
    loadExisting(answer)
      .then(function () {
        setStatus(loadStatusEl, "Loaded " + state.trips.length + " trip(s).", "ok");
        answerEl.value = answer;
        openEditor();
      })
      .catch(function () {
        setStatus(loadStatusEl, "Wrong passphrase, or js/traveldata.js has no entries yet.", "error");
      });
  });

  document.getElementById("admin-fresh-btn").addEventListener("click", function () {
    state.trips = [];
    setStatus(loadStatusEl, "Starting fresh - no existing trips loaded.", "ok");
    openEditor();
    if (!state.trips.length) { state.trips.push(newTrip()); renderTrips(); }
  });

  document.getElementById("admin-build-btn").addEventListener("click", function () {
    var answer = answerEl.value;
    if (!answer) { setStatus(buildStatusEl, "Set a publish passphrase first.", "error"); return; }
    if (!state.trips.length) { setStatus(buildStatusEl, "Add at least one trip first.", "error"); return; }
    for (var i = 0; i < state.trips.length; i++) {
      var blocks = state.trips[i].blocks;
      for (var j = 0; j < blocks.length; j++) {
        if (blocks[j].type === "image" && !blocks[j].bytes) {
          setStatus(buildStatusEl, "Trip " + (i + 1) + " has an image block with no file chosen yet.", "error");
          return;
        }
      }
    }
    setStatus(buildStatusEl, "Encrypting…");
    buildTravelData(answer)
      .then(function (js) {
        state.builtJs = js;
        outputEl.hidden = false;
        outputEl.value = js;
        var blob = new Blob([js], { type: "text/javascript" });
        downloadEl.hidden = false;
        downloadEl.href = URL.createObjectURL(blob);
        setStatus(buildStatusEl, "Built " + (js.length / 1024).toFixed(0) + " KB. Download it or push to GitHub below.", "ok");
      })
      .catch(function (err) {
        setStatus(buildStatusEl, "Failed: " + err.message, "error");
      });
  });

  // ---- GitHub push ----

  var GH_TOKEN_KEY = "travel-admin-gh-token";
  var ghTokenEl = document.getElementById("gh-token");
  var ghRememberEl = document.getElementById("gh-remember");
  try {
    var savedToken = localStorage.getItem(GH_TOKEN_KEY);
    if (savedToken) { ghTokenEl.value = savedToken; ghRememberEl.checked = true; }
  } catch (e) { /* localStorage unavailable - just skip remembering */ }

  function b64EncodeUtf8(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = "";
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  document.getElementById("gh-push-btn").addEventListener("click", function () {
    if (!state.builtJs) { setStatus(ghStatusEl, "Build the encrypted data first.", "error"); return; }
    var token = ghTokenEl.value.trim();
    var owner = document.getElementById("gh-owner").value.trim();
    var repo = document.getElementById("gh-repo").value.trim();
    var branch = document.getElementById("gh-branch").value.trim() || "main";
    var filePath = document.getElementById("gh-path").value.trim();
    if (!token || !owner || !repo || !filePath) {
      setStatus(ghStatusEl, "Fill in the token, owner, repo and path.", "error");
      return;
    }
    if (!confirm("Commit straight to " + owner + "/" + repo + "@" + branch + ":" + filePath + "? This pushes to the live repo.")) return;

    try {
      if (ghRememberEl.checked) localStorage.setItem(GH_TOKEN_KEY, token);
      else localStorage.removeItem(GH_TOKEN_KEY);
    } catch (e) { /* not fatal - the token just won't be remembered */ }

    var api = "https://api.github.com/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) + "/contents/" + filePath;
    var headers = { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json" };

    setStatus(ghStatusEl, "Checking current file…");
    fetch(api + "?ref=" + encodeURIComponent(branch), { headers: headers })
      .then(function (res) {
        if (res.status === 404) return null;
        if (!res.ok) return res.json().then(function (e) { throw new Error(e.message || res.statusText); });
        return res.json();
      })
      .then(function (existing) {
        setStatus(ghStatusEl, "Pushing…");
        var body = {
          message: "Update travel blog content",
          content: b64EncodeUtf8(state.builtJs),
          branch: branch,
        };
        if (existing && existing.sha) body.sha = existing.sha;
        return fetch(api, {
          method: "PUT",
          headers: Object.assign({ "Content-Type": "application/json" }, headers),
          body: JSON.stringify(body),
        });
      })
      .then(function (res) {
        return res.json().then(function (j) {
          if (!res.ok) throw new Error(j.message || res.statusText);
          return j;
        });
      })
      .then(function (result) {
        var sha = result.commit && result.commit.sha ? result.commit.sha.slice(0, 7) : "?";
        setStatus(ghStatusEl, "Pushed - commit " + sha + ". The live site picks it up on its next deploy/serve.", "ok");
      })
      .catch(function (err) {
        setStatus(ghStatusEl, "Failed: " + err.message, "error");
      });
  });
})();
