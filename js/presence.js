// "N online" counter for the MSN chat window. The Spark plan has no
// Realtime Database (the usual home for real presence via onDisconnect), so
// this approximates it with a plain Firestore heartbeat: one document per
// open tab, refreshed every HEARTBEAT_MS while the tab is visible, and only
// counted by everyone else while it's fresher than STALE_MS. See
// firestore.rules' "presence" collection for the write-side rules.
import { db } from "./firebase-init.js";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

(function () {
  var countEl = document.getElementById("chat-online-count");
  if (!countEl) return;

  var SESSION_KEY = "presence-session-id";
  var HEARTBEAT_MS = 20000;
  var STALE_MS = 75000; // a couple of missed heartbeats' grace before a tab drops out of the count

  function sessionId() {
    try {
      var id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : (Date.now() + "-" + Math.random().toString(16).slice(2));
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      // sessionStorage unavailable (private mode, blocked storage) - a fresh
      // id every call just means this tab shows up as more than one
      // heartbeat slot instead of reusing one; harmless for a rough count.
      return Date.now() + "-" + Math.random().toString(16).slice(2);
    }
  }

  var myId = sessionId();
  var heartbeatHandle = null;
  var resubscribeHandle = null;
  var unsub = null;

  function beat() {
    setDoc(doc(db, "presence", myId), { lastSeen: serverTimestamp() }).catch(function () {
      /* a dropped beat just ages this tab out of others' counts a little early - not fatal */
    });
  }

  // The query's cutoff is a fixed timestamp from when it was built, so a
  // tab that's gone quiet doesn't fall out of an already-open snapshot on
  // its own - rebuilding the query on the same interval as the heartbeat is
  // what actually ages stale sessions out of the displayed count.
  function subscribeCount() {
    if (unsub) unsub();
    var cutoff = Timestamp.fromMillis(Date.now() - STALE_MS);
    var q = query(collection(db, "presence"), where("lastSeen", ">", cutoff));
    unsub = onSnapshot(q, function (snap) {
      countEl.textContent = String(Math.max(1, snap.size));
    }, function () {
      /* leave the last known count showing rather than blank it on a transient read error */
    });
  }

  function start() {
    beat();
    subscribeCount();
    heartbeatHandle = setInterval(beat, HEARTBEAT_MS);
    resubscribeHandle = setInterval(subscribeCount, HEARTBEAT_MS);
  }

  function stop() {
    if (heartbeatHandle) { clearInterval(heartbeatHandle); heartbeatHandle = null; }
    if (resubscribeHandle) { clearInterval(resubscribeHandle); resubscribeHandle = null; }
    if (unsub) { unsub(); unsub = null; }
  }

  // A backgrounded/closed tab shouldn't keep counting itself as "here" -
  // stopping the heartbeat lets it age out of everyone else's count the
  // same way an actually-closed tab does.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  start();
})();
