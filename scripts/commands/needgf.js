const axios = require("axios");
const fs = require("fs");
const path = require("path");
const https = require("https");

const cacheFile = path.join(__dirname, "cache", "cache.json");

// Ensure cache.json exists
if (!fs.existsSync(cacheFile)) fs.writeFileSync(cacheFile, JSON.stringify({}));

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
  version: "2.1.0",
  permission: 0,
  credits: "SAKIB",
  description: "সিঙ্গেলদের শেষ ভরসা — র‍্যান্ডম GF ছবি পাঠায় 😅 (cache system)",
  prefix: true,
  category: "fun",
  usages: "-needgf",
  cooldowns: 15,
};

module.exports.run = async function ({ api, event }) {
  try {
    const userID = event.senderID;
    let cache = JSON.parse(fs.readFileSync(cacheFile));

    let imageUrl;
    // যদি cache এ থাকে, reuse করো
    if (cache[userID]) {
      imageUrl = cache[userID];
    } else {
      // নতুন image fetch
      const apiUrl = "https://nekos.best/api/v2/neko";
      const res = await axios.get(apiUrl);
      imageUrl = res.data.results[0].url;

      // cache update
      cache[userID] = imageUrl;
      fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
    }

    const imgPath = path.join(__dirname, "cache", `${userID}_gf.jpg`);
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
