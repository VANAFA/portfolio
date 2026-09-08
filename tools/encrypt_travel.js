#!/usr/bin/env node
// Encrypts travel-blog content into js/traveldata.js. This is meant to run
// locally on the site owner's machine: real trip text/photos and the real
// answer never need to be typed anywhere but here.
//
//   node tools/encrypt_travel.js path/to/content.json
//
// content.json shape: { "entries": [ { id, title:{en,es}, location:{en,es},
// date, body:{en:[...paragraphs],es:[...]}, images:[relative/paths.png] } ] }
// (relative image paths resolve against content.json's own directory.)
//
// The answer is read from a hidden prompt (nothing echoed to the terminal,
// nothing written to shell history). --answer <value> skips the prompt for
// scripting/demo use - fine for a throwaway demo answer, avoid it for the
// real one.
//
// This is real AES-256-GCM encryption keyed by PBKDF2(answer), not a
// cosmetic effect: without the right answer, js/traveldata.js only contains
// ciphertext. The one thing this can't protect against is someone offline
// guessing a low-entropy answer against the public ciphertext+salt - pick an
// answer a stranger couldn't brute-force from a short list of guesses, even
// if your friends would get it immediately.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ITERATIONS = 250000;

function normalizeAnswer(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function hiddenPrompt(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    process.stdout.write(question);
    let input = "";
    if (stdin.isTTY) stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    function onData(char) {
      char = char.toString();
      if (char === "\n" || char === "\r" || char === "\u0004") {
        stdin.removeListener("data", onData);
        if (stdin.isTTY) stdin.setRawMode(wasRaw);
        stdin.pause();
        process.stdout.write("\n");
        resolve(input);
      } else if (char === "\u0003") {
        process.exit(1);
      } else if (char === "\u007f") {
        input = input.slice(0, -1);
      } else {
        input += char;
      }
    }
    stdin.on("data", onData);
  });
}

function encryptBuffer(key, plaintextBuf) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintextBuf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    data: Buffer.concat([ciphertext, tag]).toString("base64"),
  };
}

function encryptText(key, str) {
  return encryptBuffer(key, Buffer.from(str, "utf-8"));
}

const MIME_BY_EXT = { ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

async function main() {
  const args = process.argv.slice(2);
  const contentPath = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--answer" && args[args.indexOf(a) - 1] !== "--out");
  if (!contentPath) {
    console.error("Usage: node tools/encrypt_travel.js <content.json> [--answer <value>] [--out <path>]");
    process.exit(1);
  }
  const answerFlagIdx = args.indexOf("--answer");
  const outFlagIdx = args.indexOf("--out");
  const outPath = outFlagIdx !== -1 ? path.resolve(args[outFlagIdx + 1]) : path.join(__dirname, "..", "js", "traveldata.js");

  let answer;
  if (answerFlagIdx !== -1) {
    answer = args[answerFlagIdx + 1];
    console.warn("Warning: --answer on the command line can end up in shell history - fine for a demo answer, avoid it for the real one.");
  } else {
    answer = await hiddenPrompt("Answer (hidden): ");
  }
  const normalized = normalizeAnswer(answer);
  if (!normalized) {
    console.error("Empty answer, aborting.");
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(contentPath, "utf-8"));
  const baseDir = path.dirname(path.resolve(contentPath));

  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(normalized, salt, ITERATIONS, 32, "sha256");

  const entries = content.entries.map((entry) => {
    const out = { id: entry.id };
    out.title = {
      en: encryptText(key, entry.title.en),
      es: encryptText(key, entry.title.es || entry.title.en),
    };
    out.location = {
      en: encryptText(key, entry.location.en),
      es: encryptText(key, entry.location.es || entry.location.en),
    };
    out.date = encryptText(key, entry.date);
    out.body = {
      en: entry.body.en.map((p) => encryptText(key, p)),
      es: (entry.body.es || entry.body.en).map((p) => encryptText(key, p)),
    };
    out.images = (entry.images || []).map((imgPath) => {
      const full = path.resolve(baseDir, imgPath);
      const buf = fs.readFileSync(full);
      const ext = path.extname(full).toLowerCase();
      const mime = MIME_BY_EXT[ext] || "image/jpeg";
      return Object.assign({ mime: mime }, encryptBuffer(key, buf));
    });
    return out;
  });

  const js =
    "// Generated by tools/encrypt_travel.js - do not hand-edit.\n" +
    "// Ciphertext only: the real content only exists in plaintext on the\n" +
    "// machine that ran the encryption tool.\n" +
    "window.TRAVEL_SALT = " + JSON.stringify(salt.toString("base64")) + ";\n" +
    "window.TRAVEL_ITERATIONS = " + ITERATIONS + ";\n" +
    "window.TRAVEL_ENTRIES = " + JSON.stringify(entries, null, 2) + ";\n";

  fs.writeFileSync(outPath, js);
  console.log("Wrote " + outPath + " with " + entries.length + " entr" + (entries.length === 1 ? "y" : "ies") + ".");
}

main();
