const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

module.exports.config = {
  name: "needbf",
  version: "3.0.0",
  permission: 0,
  credits: "SAKIB",
  description: "রিয়েল বয়ফ্রেন্ড টাইপ র‍্যান্ডম পিক পাঠায় 😎 (Unsplash version)",
  prefix: true,
  category: "fun",
  usages: "-needbf",
  cooldowns: 10,
};

module.exports.run = async function ({ api, event }) {
  try {
    const userID = event.senderID;
    const imgPath = path.join(cacheDir, `${userID}_real_bf.jpg`);

    // ✅ রিয়েল ছেলেদের র‍্যান্ডম ছবি (Unsplash)
    const imageUrl = "https://source.unsplash.com/random/600x800/?handsome,boy,man,portrait";

    // Axios দিয়ে সরাসরি ডাউনলোড
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, response.data);

    // পাঠানো
    api.sendMessage({
      body: "তোমার রিয়েল BF হাজির 😎💘",
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);

  } catch (err) {
    console.error("❌ Error:", err);
    api.sendMessage("দুঃখিত ভাই 😅, এখন একটু সমস্যা হচ্ছে!", event.threadID, event.messageID);
  }
};
