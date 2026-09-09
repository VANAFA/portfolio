// Feature flags for work-in-progress features that shouldn't be visible on
// the live site yet. This repo ships no build step (see README), so hiding
// happens at runtime based on where the page is being viewed from: the exact
// same files are served locally and in production, but a feature listed in
// HIDDEN_IN_PROD only renders when the hostname isn't the live domain.
//
// This is a soft hide, not a security boundary: a page like travel.html still
// works over a direct link even when its nav entry is hidden — exactly how it
// was already meant to be shared (see README's "Travel blog" section).
//
// To hide a new feature: add its name to HIDDEN_IN_PROD, then tag its nav
// entry point(s) with data-feature="name" (auto-hidden below), and check
// window.isFeatureHidden("name") anywhere a feature's entry point is built
// from JS instead of static markup (e.g. js/desktopicons.js).
(function () {
  var HIDDEN_IN_PROD = [];

  var isProd = !(
    location.protocol === "file:" ||
    location.hostname === "" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]" ||
    location.hostname.endsWith(".local")
  );

  window.isFeatureHidden = function (name) {
    return isProd && HIDDEN_IN_PROD.indexOf(name) !== -1;
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-feature]"), function (el) {
    if (window.isFeatureHidden(el.dataset.feature)) el.hidden = true;
  });
})();
