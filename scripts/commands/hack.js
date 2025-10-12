// scripts/commands/hack.js
module.exports.config = {
  name: "hack",
  version: "1.0.3",
  permission: 0,
  credits: "Nayan",
  description: "Create custom image with avatar and name",
  prefix: true,
  category: "Fun",
  usages: "user",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "canvas": ""
  }
};

// load once — লগ দেখাবে লোড হয়েছে কিনা
console.log("[COMMAND] hack.js loaded");

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
let canvasModule;
try {
  canvasModule = require("canvas");
} catch (e) {
  console.error("[COMMAND] canvas module load failed:", e.message);
  // আমরা চালিয়ে দেব কিন্তু run হলে obvious error দেখাবে
}

module.exports.wrapText = (ctx, text, maxWidth) => {
  return new Promise(resolve => {
    if (!text) return resolve([]);
    if (ctx.measureText(text).width <= maxWidth) return resolve([text]);
    if (ctx.measureText('W').width > maxWidth) return resolve(null);

    const words = text.split(' ');
    const lines = [];
    let line = '';

    while (words.length > 0) {
      while (ctx.measureText(words[0]).width > maxWidth) {
        const word = words[0];
        words[0] = word.slice(0, -1);
        if (words[1]) words[1] = word.slice(-1) + words[1];
        else words.splice(1, 0, word.slice(-1));
      }

      if (ctx.measureText((line + words[0]).trim()).width <= maxWidth) {
        line = (line + words.shift() + " ").trim() + " ";
      } else {
        lines.push(line.trim());
        line = '';
      }

      if (words.length === 0 && line.length > 0) lines.push(line.trim());
    }
    resolve(lines);
  });
};

module.exports.run = async function ({ Users, api, event }) {
  try {
    console.log("[COMMAND] hack.run invoked, event:", event.threadID, "from:", event.senderID);

    if (!canvasModule) {
      return api.sendMessage("Command temp unavailable: canvas module missing. Admin check console.", event.threadID);
    }
    const { loadImage, createCanvas } = canvasModule;

    const dir = __dirname;
    const pathImg = path.join(dir, "cache_background.png");
    const pathAvt = path.join(dir, "cache_avt.png");

    // get target id
    const mentions = event.mentions || {};
    const mentionedIds = Object.keys(mentions);
    const id = (mentionedIds.length > 0) ? mentionedIds[0] : event.senderID;

    console.log("[COMMAND] target id:", id);

    // safe Users name fetch
    let name = "Unknown";
    try {
      if (Users && typeof Users.getNameUser === "function") {
        name = await Users.getNameUser(id);
      } else {
        console.warn("[COMMAND] Users.getNameUser not available");
      }
    } catch (e) {
      console.warn("[COMMAND] getNameUser error:", e.message);
    }

    // backgrounds - use direct public image links (test one)
    const backgrounds = [
      "https://i.imgur.com/4AiXzf8.jpeg" // replace with your bg
    ];
    const rd = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // optional FB token (nil allowed)
    const graphToken = ""; // put your token if needed

    // download avatar (try without token first)
    let avtUrl = `https://graph.facebook.com/${id}/picture?width=720&height=720`;
    if (graphToken) avtUrl += `&access_token=${graphToken}`;

    console.log("[COMMAND] downloading avatar from:", avtUrl);
    const avtRes = await axios.get(avtUrl, { responseType: "arraybuffer" });
    fs.ensureDirSync(path.dirname(pathAvt));
    fs.writeFileSync(pathAvt, Buffer.from(avtRes.data));
    console.log("[COMMAND] avatar saved:", pathAvt);

    // download background
    console.log("[COMMAND] downloading background from:", rd);
    const bgRes = await axios.get(rd, { responseType: "arraybuffer" });
    fs.writeFileSync(pathImg, Buffer.from(bgRes.data));
    console.log("[COMMAND] background saved:", pathImg);

    // load images
    const baseImage = await loadImage(pathImg);
    const baseAvt = await loadImage(pathAvt);

    // create canvas
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    // draw background
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // text style
    ctx.font = "400 23px Sans";
    ctx.fillStyle = "#1878F3";
    ctx.textAlign = "start";

    const maxTextWidth = Math.min(1160, canvas.width - 250);
    const lines = await this.wrapText(ctx, name, maxTextWidth) || [name];

    const startX = 200;
    const startY = 497;
    const lineHeight = 30;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, startX, startY + i * lineHeight);
    });

    // draw avatar
    ctx.drawImage(baseAvt, 83, 437, 100, 101);

    // write final image
    const finalBuffer = canvas.toBuffer("image/png");
    fs.writeFileSync(pathImg, finalBuffer);

    console.log("[COMMAND] final image written, sending...");

    return api.sendMessage(
      { body: ``, attachment: fs.createReadStream(pathImg) },
      event.threadID,
      (err) => {
        try { fs.unlinkSync(pathImg); } catch (e) {}
        try { fs.unlinkSync(pathAvt); } catch (e) {}
        if (err) console.error(err);
      },
      event.messageID
    );

  } catch (error) {
    console.error("hack command error:", error);
    return api.sendMessage(`Error: ${error.message}`, event.threadID, event.messageID);
  }
};
