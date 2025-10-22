const axios = require("axios");

module.exports.config = {
  name: "love",
  version: "1.0.5",
  permission: 0,
  credits: "Shakib",
  description: "Create a love image using love1 to love11 APIs (streamed)",
  prefix: true,
  category: "image",
  usages: "love [1-11] [@mention/reply]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const { threadID, messageID, senderID, type, mentions, messageReply } = event;
    api.setMessageReaction("❤️", messageID, () => {}, true);

    let uid1, uid2;
    if (type === "message_reply") {
      uid1 = senderID;
      uid2 = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      uid1 = senderID;
      uid2 = Object.keys(mentions)[0];
    } else {
      return api.sendMessage("❌ Please mention or reply to someone to generate a love image.", threadID, messageID);
    }

    const version = /^[1-9]$|^1[0-1]$/.test(args[0]) ? args[0] : (Math.floor(Math.random() * 11) + 1).toString();

    // 🔍 API link log test
    console.log("API LINK:", global.imranapi?.api1);

    const url = `${global.imranapi.api1}/love${version}?uid1=${uid1}&uid2=${uid2}`;
    const res = await axios.get(url, { responseType: "arraybuffer" });

    if (!res.headers['content-type'].includes("image")) {
      console.log("API response (not image):", res.data.toString());
      return api.sendMessage("⚠️ API did not return an image. Please check the API link or try another version.", threadID, messageID);
    }

    return api.sendMessage({
      body: `❤️ Here's your love image! (love${version})`,
      attachment: Buffer.from(res.data, "binary")
    }, threadID, messageID);

  } catch (err) {
    console.error("Error in love command:", err);
    return api.sendMessage("❌ Could not generate the image. Try again later.", event.threadID, event.messageID);
  }
};
