// Tiny decorative taskbar clock.
(function () {
  var clock = document.getElementById("taskbar-clock");
  if (!clock) return;
  function tick() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    var ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    var mm = (m < 10 ? "0" : "") + m;
    clock.textContent = h + ":" + mm + " " + ampm;
  }
  tick();
  setInterval(tick, 1000 * 10);
})();
