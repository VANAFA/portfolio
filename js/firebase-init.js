// Initializes Firebase (Auth + Firestore) for the site's chat feature.
// Loaded as an ES module (see the <script type="module"> tag), so this
// runs after all the classic scripts below it in the HTML have already
// executed - safe to rely on window.SFX/window.t etc. from here or from
// anything that imports from this file.
//
// This config is a public client identifier, not a secret - Firebase's
// actual security boundary is firestore.rules, deployed separately.
// Everything here runs on Firebase's free Spark plan: Firestore and Auth
// don't bill for overage on Spark, they just stop working past the daily
// quota, so this can never generate a charge.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLLaO9M1Qf9qSXWojboxW3owGgFwgVe7E",
  authDomain: "nallibar.firebaseapp.com",
  projectId: "nallibar",
  storageBucket: "nallibar.firebasestorage.app",
  messagingSenderId: "759335511518",
  appId: "1:759335511518:web:bb9db619c85ffa444de94f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
