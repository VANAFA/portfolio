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
  onAuthStateChanged,
  reload,
  getIdToken
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

  // Classic IM flavor: each screen name gets its own stable color (hash of
  // the name -> a hue), the way MSN contacts each had their own nickname
  // color, instead of every line reading in the same navy.
  function authorColor(name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    var hue = hash % 360;
    return "hsl(" + hue + ", 65%, 32%)";
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
  // Unsubscribed while the tab/window is hidden (see the visibilitychange
  // handler below) so a backgrounded tab isn't left holding an open
  // real-time connection and re-rendering the list for messages nobody's
  // there to read.
  var messagesQuery = query(collection(db, "chat_messages"), orderBy("createdAt", "desc"), limit(50));
  var unsubMessages = null;

  function subscribeMessages() {
    if (unsubMessages) return;
    var seenFirstSnapshot = false; // suppress the click sound for this subscription's own initial (re)load
    unsubMessages = onSnapshot(messagesQuery, function (snap) {
      var docs = [];
      snap.forEach(function (doc) { docs.push(doc.data()); });
      docs.reverse();
      messagesEl.innerHTML = docs.map(function (m) {
        var when = m.createdAt && m.createdAt.toDate ? m.createdAt.toDate() : null;
        var timeStr = when ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";
        var author = m.authorName || "?";
        return (
          '<p class="chat-line">' +
          '<span class="chat-author" style="color:' + authorColor(author) + ';">' + escapeHtml(author) + "</span> " +
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
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (unsubMessages) { unsubMessages(); unsubMessages = null; }
    } else {
      subscribeMessages();
    }
  });

  subscribeMessages();

  // ---- auth state -> which panel shows in the composer area ----
  var readonlyHint = document.getElementById("chat-readonly-hint");
  var verifyStatus = document.getElementById("chat-verify-status");

  function showUnverified() {
    sendForm.hidden = true;
    authBox.hidden = true;
    sessionBox.hidden = true;
    verifyBox.hidden = false;
    readonlyHint.hidden = false;
  }

  function showVerified(user) {
    authBox.hidden = true;
    verifyBox.hidden = true;
    sendForm.hidden = false;
    sessionBox.hidden = false;
    readonlyHint.hidden = true;
    sessionName.textContent = user.displayName || user.email;
  }

  onAuthStateChanged(auth, function (user) {
    if (!user) {
      sendForm.hidden = true;
      verifyBox.hidden = true;
      sessionBox.hidden = true;
      authBox.hidden = false;
      readonlyHint.hidden = false;
    } else if (!user.emailVerified) {
      showUnverified();
    } else {
      // The emailVerified flag on the user object can flip true before the
      // cached ID token's own email_verified claim catches up (that claim
      // only updates on the token's next refresh, normally up to an hour) -
      // firestore.rules checks the token claim, so without forcing a
      // refresh here a message can look like it sent (optimistic local
      // update) and then vanish when the server rejects the stale-token
      // write.
      getIdToken(user, true).then(function () { showVerified(user); }, function () { showVerified(user); });
    }
  });

  // Verifying happens in another tab/window, so this tab's cached user
  // object doesn't know until asked: reload() re-fetches the account (does
  // emailVerified say true yet?) and getIdToken(true) forces a fresh token
  // so a follow-up send isn't rejected on a stale claim.
  var recheckBtn = document.getElementById("chat-recheck-verify");
  if (recheckBtn) {
    recheckBtn.addEventListener("click", function () {
      if (window.SFX) window.SFX.click();
      var user = auth.currentUser;
      if (!user) return;
      verifyStatus.textContent = t("chat.working");
      reload(user)
        .then(function () { return getIdToken(user, true); })
        .then(function () {
          verifyStatus.textContent = "";
          if (user.emailVerified) showVerified(user);
          else verifyStatus.textContent = t("chat.stillNotVerified");
        })
        .catch(function (err) { verifyStatus.textContent = err.message; });
    });
  }

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

  var sendStatus = document.getElementById("chat-send-status");
  sendForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var raw = input.value.trim();
    if (!raw || !auth.currentUser) return;
    var result = censor(raw);
    input.value = "";
    sendStatus.hidden = true;
    addDoc(collection(db, "chat_messages"), {
      text: result.text,
      authorUid: auth.currentUser.uid,
      authorName: (auth.currentUser.displayName || auth.currentUser.email || "?").slice(0, 24),
      createdAt: serverTimestamp()
    }).catch(function (err) {
      input.value = raw;
      sendStatus.textContent = err.message;
      sendStatus.hidden = false;
      console.error("chat send failed:", err);
    });
    if (result.censored) showLanguagePopup();
  });
})();
