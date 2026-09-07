/*
 * Quest button: reveals the quest line one character at a time while the jaw
 * flaps as if speaking, with a blip per few characters.
 */
(function () {
  var btn = document.getElementById("quest-btn");
  var out = document.getElementById("quest-text");
  if (!btn || !out) return;

  var CHAR_MS = 55;
  var timer = null;
  var speaking = false;
  var lastKey = "quest.line";

  function stop() {
    clearTimeout(timer);
    speaking = false;
    if (window.faceJaw) window.faceJaw.talk(false);
    btn.disabled = false;
  }

  function say(key, onDone) {
    var line = window.t ? window.t(key) : key;
    lastKey = key;
    clearTimeout(timer);
    out.textContent = "";
    speaking = true;
    btn.disabled = true;
    if (window.faceJaw) window.faceJaw.talk(true);

    var i = 0;
    (function step() {
      if (i >= line.length) {
        stop();
        if (onDone) onDone();
        return;
      }
      var ch = line.charAt(i);
      out.textContent += ch;
      // a blip roughly every third character, skipping spaces
      if (ch !== " " && i % 3 === 0 && window.SFX) window.SFX.speak();
      i++;
      timer = setTimeout(step, CHAR_MS + (ch === "." || ch === "," ? 180 : 0));
    })();
  }

  btn.addEventListener("click", function () {
    say("quest.line", function () {
      if (window.chipaQuest) window.chipaQuest.spawn();
    });
  });

  // Called by js/chipa.js once the chipa has been swallowed.
  // `burp` is true every 3rd chipa, and gets its own line.
  window.questComplete = function (burp) {
    say(burp ? "quest.doneBurp" : "quest.done");
  };

  // If the language is switched mid-sentence, restart in the new language.
  document.addEventListener("langchange", function () {
    if (speaking) {
      say(lastKey);
    } else if (out.textContent) {
      out.textContent = window.t ? window.t(lastKey) : out.textContent;
    }
  });
})();
