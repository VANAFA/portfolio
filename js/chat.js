// Open chat window: anyone can read it, only a signed-in + email-verified
// account can post (see firestore.rules). MSN-Messenger-flavored, not a
// pixel copy of it - real Messenger art/sounds are Microsoft's, so this is
// a faithful-feeling recreation instead of an extraction.
import { auth, db } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

(function () {
  var root = document.getElementById("chat-root");
  if (!root) return;

  function t(key) {
    return window.t ? window.t(key) : key;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- basic profanity filter (client-side only - Spark plan has no
  // Cloud Functions to re-check this server-side, see firestore.rules) ----
  var BAD_WORDS = [
    "fuck", "shit", "bitch", "asshole", "bastard", "dick", "cunt", "pussy",
    "cock", "whore", "slut", "faggot", "nigger", "retard",
    "puta", "puto", "mierda", "pelotudo", "boludo", "forro", "concha",
    "pendejo", "cornudo", "trolo", "trola", "verga", "chinga", "cagada"
  ];
  var BAD_WORDS_RE = new RegExp(
    "\\b(" + BAD_WORDS.join("|") + ")\\b",
    "gi"
  );

  function censor(text) {
    var hit = false;
    var out = text.replace(BAD_WORDS_RE, function (m) {
      hit = true;
      return "*".repeat(m.length);
    });
    return { text: out, censored: hit };
  }

  function showLanguagePopup() {
    var popup = document.getElementById("chat-cap-popup");
    if (!popup) return;
    if (window.SFX) window.SFX.hit();
    popup.hidden = false;
    popup.classList.remove("show");
    void popup.offsetWidth; // restart the animation if it's still showing
    popup.classList.add("show");
    clearTimeout(popup._hideTimer);
    popup._hideTimer = setTimeout(function () { popup.hidden = true; }, 2200);
  }

  // ---- elements ----
  var messagesEl = document.getElementById("chat-messages");
  var sendForm = document.getElementById("chat-send-form");
  var input = document.getElementById("chat-input");
  var authBox = document.getElementById("chat-auth");
  var verifyBox = document.getElementById("chat-verify");
  var sessionBox = document.getElementById("chat-session");
  var sessionName = document.getElementById("chat-session-name");
  var tabSignIn = document.getElementById("chat-tab-signin");
  var tabSignUp = document.getElementById("chat-tab-signup");
  var signInForm = document.getElementById("chat-signin-form");
  var signUpForm = document.getElementById("chat-signup-form");
  var authStatus = document.getElementById("chat-auth-status");

  // ---- message list (public read, works even signed out) ----
  var seenFirstSnapshot = false;
  var messagesQuery = query(collection(db, "chat_messages"), orderBy("createdAt", "desc"), limit(50));
  onSnapshot(messagesQuery, function (snap) {
    var docs = [];
    snap.forEach(function (doc) { docs.push(doc.data()); });
    docs.reverse();
    messagesEl.innerHTML = docs.map(function (m) {
      var when = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate() : null;
      var timeStr = when ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";
      return (
        '<p class="chat-line">' +
        '<span class="chat-author">' + escapeHtml(m.authorName || "?") + "</span> " +
        '<span class="chat-time">' + escapeHtml(timeStr) + "</span><br>" +
        '<span class="chat-text">' + escapeHtml(m.text || "") + "</span>" +
        "</p>"
      );
    }).join("");
    if (seenFirstSnapshot && window.SFX) window.SFX.click();
    seenFirstSnapshot = true;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }, function (err) {
    messagesEl.innerHTML = '<p class="chat-line chat-error">' + escapeHtml(err.message) + "</p>";
  });

  // ---- auth state -> which panel shows in the composer area ----
  var readonlyHint = document.getElementById("chat-readonly-hint");
  onAuthStateChanged(auth, function (user) {
    if (!user) {
      sendForm.hidden = true;
      verifyBox.hidden = true;
      sessionBox.hidden = true;
      authBox.hidden = false;
      readonlyHint.hidden = false;
    } else if (!user.emailVerified) {
      sendForm.hidden = true;
      authBox.hidden = true;
      sessionBox.hidden = true;
      verifyBox.hidden = false;
      readonlyHint.hidden = false;
    } else {
      authBox.hidden = true;
      verifyBox.hidden = true;
      sendForm.hidden = false;
      sessionBox.hidden = false;
      readonlyHint.hidden = true;
      sessionName.textContent = user.displayName || user.email;
    }
  });

  // ---- sign in / sign up tab toggle ----
  tabSignIn.addEventListener("click", function () {
    if (window.SFX) window.SFX.click();
    tabSignIn.classList.add("selected");
    tabSignUp.classList.remove("selected");
    signInForm.hidden = false;
    signUpForm.hidden = true;
    authStatus.textContent = "";
  });
  tabSignUp.addEventListener("click", function () {
    if (window.SFX) window.SFX.click();
    tabSignUp.classList.add("selected");
    tabSignIn.classList.remove("selected");
    signUpForm.hidden = false;
    signInForm.hidden = true;
    authStatus.textContent = "";
  });

  function describeAuthError(err) {
    var map = {
      "auth/invalid-email": t("chat.errInvalidEmail"),
      "auth/email-already-in-use": t("chat.errEmailInUse"),
      "auth/weak-password": t("chat.errWeakPassword"),
      "auth/invalid-credential": t("chat.errBadCredentials"),
      "auth/wrong-password": t("chat.errBadCredentials"),
      "auth/user-not-found": t("chat.errBadCredentials"),
      "auth/too-many-requests": t("chat.errTooMany")
    };
    return map[err.code] || err.message;
  }

  signUpForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var username = document.getElementById("chat-signup-username").value.trim();
    var email = document.getElementById("chat-signup-email").value.trim();
    var password = document.getElementById("chat-signup-password").value;
    if (!username) {
      authStatus.textContent = t("chat.errNoUsername");
      return;
    }
    authStatus.textContent = t("chat.working");
    createUserWithEmailAndPassword(auth, email, password)
      .then(function (cred) {
        return updateProfile(cred.user, { displayName: username.slice(0, 24) })
          .then(function () { return sendEmailVerification(cred.user); });
      })
      .then(function () {
        authStatus.textContent = "";
      })
      .catch(function (err) {
        authStatus.textContent = describeAuthError(err);
      });
  });

  signInForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("chat-signin-email").value.trim();
    var password = document.getElementById("chat-signin-password").value;
    authStatus.textContent = t("chat.working");
    signInWithEmailAndPassword(auth, email, password)
      .then(function () { authStatus.textContent = ""; })
      .catch(function (err) { authStatus.textContent = describeAuthError(err); });
  });

  document.getElementById("chat-resend-verify").addEventListener("click", function () {
    if (window.SFX) window.SFX.click();
    if (auth.currentUser) sendEmailVerification(auth.currentUser);
  });
  document.getElementById("chat-signout-unverified").addEventListener("click", function () {
    if (window.SFX) window.SFX.click();
    signOut(auth);
  });
  document.getElementById("chat-signout").addEventListener("click", function () {
    if (window.SFX) window.SFX.click();
    signOut(auth);
  });

  sendForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var raw = input.value.trim();
    if (!raw || !auth.currentUser) return;
    var result = censor(raw);
    input.value = "";
    addDoc(collection(db, "chat_messages"), {
      text: result.text,
      authorUid: auth.currentUser.uid,
      authorName: (auth.currentUser.displayName || auth.currentUser.email || "?").slice(0, 24),
      createdAt: serverTimestamp()
    }).catch(function (err) {
      input.value = raw;
      console.error("chat send failed:", err);
    });
    if (result.censored) showLanguagePopup();
  });
})();
