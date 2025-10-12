const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

module.exports.config = {
  name: "needgf",
  version: "3.0.0",
  permission: 0,
  credits: "SAKIB",
  description: "রিয়েল মেয়ের র‍্যান্ডম পিক পাঠায় 😍 (Unsplash version)",
  prefix: true,
  category: "fun",
  usages: "-needgf",
  cooldowns: 10,
};

module.exports.run = async function ({ api, event }) {
  try {
    const userID = event.senderID;
    const imgPath = path.join(cacheDir, `${userID}_real_gf.jpg`);

    // ✅ রিয়েল মেয়েদের র‍্যান্ডম ছবি (Unsplash)
    const imageUrl = "https://source.unsplash.com/random/600x800/?beautiful,girl,portrait";

    // Axios দিয়ে সরাসরি ডাউনলোড
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, response.data);

    // পাঠানো
    api.sendMessage({
      body: "তোমার রিয়েল GF হাজির 😍💖",
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);

  } catch (err) {
    console.error("❌ Error:", err);
    api.sendMessage("দুঃখিত ভাই 😅, এখন একটু সমস্যা হচ্ছে!", event.threadID, event.messageID);
  }
};
