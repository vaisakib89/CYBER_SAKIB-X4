const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");

function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, res => {
      if (res.statusCode !== 200)
        return reject(new Error(`Image fetch failed with status: ${res.statusCode}`));
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", err => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

module.exports.config = {
  name: "needgf",
  version: "2.0.0",
  permission: 0,
  credits: "SAKIB",
  description: "সিঙ্গেলদের শেষ ভরসা — র‍্যান্ডম GF ছবি পাঠায় 😅",
  prefix: true,
  category: "fun", // ✅ সঠিক ফিল্ড (commandCategory → category)
  usages: "-needgf",
  cooldowns: 15,
};

module.exports.run = async function ({ api, event }) {
  try {
    // ✅ Random anime-style girl API
    const apiUrl = "https://nekos.best/api/v2/neko";
    const res = await axios.get(apiUrl);

    const imageUrl = res.data.results[0].url;
    const imgPath = path.join(__dirname, "cache", `${event.senderID}_gf.jpg`);

    await downloadImage(imageUrl, imgPath);

    api.sendMessage({
      body: "তোমার নতুন GF হাজির 😘💖",
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);

  } catch (err) {
    console.error("❌ Error fetching image:", err.message);
    api.sendMessage("দুঃখিত ভাই 😅, এখন একটু সমস্যা হচ্ছে!", event.threadID, event.messageID);
  }
};
