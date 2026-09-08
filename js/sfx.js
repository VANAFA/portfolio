/*
 * Sound effects. Each one first tries a real recording from sounds/<name>.mp3;
 * if that file is still the untouched placeholder (see
 * tools/make_sound_placeholders.py), it falls back to a sound synthesised with
 * the Web Audio API instead — no audio files required to get a working site,
 * but dropping a real recording in under the same filename is picked up
 * automatically, with nothing to wire up.
 *
 * Every sound is triggered by a user gesture, so the audio context is created
 * lazily on first use and resumed if suspended (browsers block audio that
 * starts without interaction).
 */
(function () {
  var ctx = null;

  function audio() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (e) {
      return null;
    }
    return ctx;
  }

  // A short noise burst, shaped by a band-pass filter — the basis of the
  // crunchy sounds (chewing, impact).
  function noise(duration, freq, q, gainValue) {
    var ac = audio();
    if (!ac) return;
    var frames = Math.floor(ac.sampleRate * duration);
    var buffer = ac.createBuffer(1, frames, ac.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }
    var src = ac.createBufferSource();
    src.buffer = buffer;

    var filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = freq;
    filter.Q.value = q;

    var gain = ac.createGain();
    gain.gain.setValueAtTime(gainValue, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

    src.connect(filter).connect(gain).connect(ac.destination);
    src.start();
    src.stop(ac.currentTime + duration);
  }

  function tone(fromFreq, toFreq, duration, type, gainValue) {
    var ac = audio();
    if (!ac) return;
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(fromFreq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), ac.currentTime + duration);
    gain.gain.setValueAtTime(gainValue, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  }

  var synth = {
    // Picking something up: a short upward blip.
    pick: function () {
      tone(420, 780, 0.09, "square", 0.05);
    },
    // Putting it down again without eating it.
    drop: function () {
      tone(520, 240, 0.11, "square", 0.045);
    },
    // A comedic burp: a wavering low tone plus a breathy noise tail.
    burp: function () {
      tone(150, 55, 0.38, "sawtooth", 0.1);
      setTimeout(function () { tone(110, 70, 0.22, "sawtooth", 0.06); }, 90);
      noise(0.32, 280, 0.6, 0.05);
    },
    // A single chomp — noise crunch plus a soft low body.
    chew: function () {
      noise(0.11, 900 + Math.random() * 700, 3, 0.16);
      tone(180 + Math.random() * 60, 90, 0.1, "triangle", 0.05);
    },
    // Finishing the mouthful.
    swallow: function () {
      tone(320, 120, 0.22, "sine", 0.06);
    },
    // Getting hit: a low thud with a slap of noise over it.
    hit: function () {
      tone(190, 55, 0.16, "sine", 0.13);
      noise(0.13, 1500, 1.2, 0.1);
    },
    // One syllable of speech.
    speak: function () {
      tone(200 + Math.random() * 120, 150 + Math.random() * 90, 0.06, "square", 0.022);
    },
    // A card landing somewhere legal - a crisp little tap.
    place: function () {
      tone(900, 500, 0.05, "square", 0.05);
      noise(0.03, 2600, 2.5, 0.05);
    },
    // An illegal move - a short low buzz, paired with a shake in the UI.
    invalid: function () {
      tone(180, 140, 0.12, "sawtooth", 0.07);
      setTimeout(function () { tone(160, 120, 0.1, "sawtooth", 0.06); }, 70);
    },
    // Riffling the deck for a new game.
    shuffle: function () {
      for (var i = 0; i < 7; i++) {
        setTimeout(function () { noise(0.05, 1800 + Math.random() * 1200, 4, 0.05); }, i * 35);
      }
    },
    // A short rising jingle for a win.
    win: function () {
      var notes = [523, 659, 784, 1047];
      notes.forEach(function (freq, i) {
        setTimeout(function () { tone(freq, freq, 0.16, "square", 0.05); }, i * 90);
      });
    }
  };

  // --- custom recordings, if any have replaced their placeholder ---------

  // Placeholders from tools/make_sound_placeholders.py are 593 bytes; anything
  // this small is assumed to still be the placeholder. Any real recording,
  // even a very short one, comes in well above this.
  var PLACEHOLDER_MAX_BYTES = 3000;

  var custom = {};   // name -> HTMLAudioElement, once confirmed to be a real file

  Object.keys(synth).forEach(function (name) {
    var path = "sounds/" + name + ".mp3";
    fetch(path)
      .then(function (res) { return res.ok ? res.blob() : null; })
      .then(function (blob) {
        if (blob && blob.size > PLACEHOLDER_MAX_BYTES) {
          var el = new Audio(path);
          el.preload = "auto";
          custom[name] = el;
        }
      })
      .catch(function () {
        /* no sounds/ folder, blocked by file:// CORS, offline, etc. - synth stays the fallback */
      });
  });

  function play(name) {
    var el = custom[name];
    if (el) {
      el.currentTime = 0;
      el.play().catch(function () { /* autoplay/decoding hiccup - not fatal */ });
      return;
    }
    synth[name]();
  }

  window.SFX = {
    pick: function () { play("pick"); },
    drop: function () { play("drop"); },
    burp: function () { play("burp"); },
    chew: function () { play("chew"); },
    swallow: function () { play("swallow"); },
    hit: function () { play("hit"); },
    speak: function () { play("speak"); },
    place: function () { play("place"); },
    invalid: function () { play("invalid"); },
    shuffle: function () { play("shuffle"); },
    win: function () { play("win"); }
  };
})();
