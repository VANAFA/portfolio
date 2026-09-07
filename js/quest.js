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

  function stop() {
    clearTimeout(timer);
    speaking = false;
    if (window.faceJaw) window.faceJaw.talk(false);
    btn.disabled = false;
  }

  function say(line) {
    clearTimeout(timer);
    out.textContent = "";
    speaking = true;
    btn.disabled = true;
    if (window.faceJaw) window.faceJaw.talk(true);

    var i = 0;
    (function step() {
      if (i >= line.length) {
        stop();
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
    say(window.t ? window.t("quest.line") : "Bring me the chipa.");
  });

  // If the language is switched mid-sentence, restart in the new language.
  document.addEventListener("langchange", function () {
    if (speaking) {
      say(window.t ? window.t("quest.line") : "Bring me the chipa.");
    } else if (out.textContent) {
      out.textContent = window.t ? window.t("quest.line") : out.textContent;
    }
  });
})();
