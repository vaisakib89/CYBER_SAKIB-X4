// scripts/command/hack.js
module.exports.config = {
  name: "hack",
  version: "1.0.1",
  permission: 0,
  credits: "Nayan",
  description: "Create custom image with avatar and name",
  prefix: true,
  category: "Fun",
  usages: "user",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.wrapText = (ctx, text, maxWidth) => {
  return new Promise(resolve => {
    if (!text) return resolve([]);
    // দ্রুত চেক - পুরো স্ট্রিং ছোট হলে
    if (ctx.measureText(text).width <= maxWidth) return resolve([text]);
    // যদি একেকটি 'W' কেও ছাড়িয়ে যায় (অত্যন্ত সংকীর্ণ жағдай)
    if (ctx.measureText('W').width > maxWidth) return resolve(null);

    const words = text.split(' ');
    const lines = [];
    let line = '';

    while (words.length > 0) {
      // যদি প্রত্যেক শব্দ খুব বড় হয় তাহলে শব্দের মধ্যেই ভাঙতে হবে
      while (ctx.measureText(words[0]).width > maxWidth) {
        const word = words[0];
        // last char move to next word
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
  const { loadImage, createCanvas } = require("canvas");
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const path = require("path");

  // cache path inside this command folder
  const dir = __dirname;
  const pathImg = path.join(dir, "cache_background.png");
  const pathAvt = path.join(dir, "cache_avt.png");

  try {
    // get target id: mentioned user first else sender
    const mentions = event.mentions || {};
    const mentionedIds = Object.keys(mentions);
    const id = (mentionedIds.length > 0) ? mentionedIds[0] : event.senderID;

    const name = await Users.getNameUser(id);

    // background list - তোমার public image url এখানে দিতে হবে
    const backgrounds = [
      // উদাহরণ: public image URL
      "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ"
    ];
    const rd = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // === Important: এই token টা পরিবর্তন করে তোমার টোকেন বা কোনো কাজের টোকেন বসাও ===
    // যদি তোমার বটের graph token না থাকে, ভবিষ্যতে profile pic ডাউনলোড করার অন্য পথ ব্যবহার করতে পারো
    const graphToken = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"; // CHANGE THIS

    // download profile picture
    const avtRes = await axios.get(
      `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=${graphToken}`,
      { responseType: "arraybuffer" }
    );
    fs.ensureDirSync(path.dirname(pathAvt));
    fs.writeFileSync(pathAvt, Buffer.from(avtRes.data));

    // download background
    const bgRes = await axios.get(rd, { responseType: "arraybuffer" });
    fs.writeFileSync(pathImg, Buffer.from(bgRes.data));

    // load images
    const baseImage = await loadImage(pathImg);
    const baseAvt = await loadImage(pathAvt);

    // create canvas
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    // draw background
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    // text style - প্রয়োজন মত পরিবর্তন করবে
    ctx.font = "400 23px Arial";
    ctx.fillStyle = "#1878F3";
    ctx.textAlign = "start";

    // wrap text with maximum width in pixels (adjust per your background)
    const maxTextWidth = 1160;
    const lines = await this.wrapText(ctx, name, maxTextWidth) || [name];

    // draw each line (adjust starting x,y and lineHeight)
    const startX = 200;
    const startY = 497;
    const lineHeight = 30;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, startX, startY + i * lineHeight);
    });

    // draw avatar (adjust coords and size as needed)
    ctx.beginPath();
    ctx.drawImage(baseAvt, 83, 437, 100, 101);
    ctx.closePath();

    // write final image
    const finalBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, finalBuffer);

    // send message with attachment
    return api.sendMessage(
      { body: ``, attachment: fs.createReadStream(pathImg) },
      event.threadID,
      (err) => {
        // cleanup
        try { fs.unlinkSync(pathImg); } catch (e) {}
        try { fs.unlinkSync(pathAvt); } catch (e) {}
        if (err) console.error(err);
      },
      event.messageID
    );

  } catch (error) {
    console.error("hack command error:", error);
    // send error msg so user knows (optional)
    return api.sendMessage(`Error: ${error.message}`, event.threadID, event.messageID);
  }
};
