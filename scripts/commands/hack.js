// scripts/command/hack.js
module.exports.config = {
  name: "hack",
  version: "1.0.2",
  permission: 0,
  credits: "Nayan",
  description: "Safe version: Show custom image URL with avatar and name (no canvas)",
  prefix: true,
  category: "Fun",
  usages: "-hack",
  cooldowns: 5,
  dependencies: {
    "axios": ""
  }
};

module.exports.run = async function ({ Users, api, event }) {
  const axios = global.nodemodule["axios"];
  
  try {
    // get target id: mentioned user first else sender
    const mentions = event.mentions || {};
    const mentionedIds = Object.keys(mentions);
    const id = (mentionedIds.length > 0) ? mentionedIds[0] : event.senderID;

    const name = await Users.getNameUser(id);

    // background list - public image URLs
    const backgrounds = [
      "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ",
      "https://i.imgur.com/3sTQXfO.png"
    ];
    const rd = backgrounds[Math.floor(Math.random() * backgrounds.length)];

    // Facebook profile picture URL
    const graphToken = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662"; // keep your token
    const avatarUrl = `https://graph.facebook.com/${id}/picture?width=720&height=720&access_token=${graphToken}`;

    // send message with avatar + background URLs
    const message = `👤 Name: ${name}\n🖼️ Background: ${rd}\n📸 Avatar: ${avatarUrl}\n\n(Note: Canvas image creation is disabled in this environment)`;

    return api.sendMessage(message, event.threadID, event.messageID);

  } catch (error) {
    console.error("hack command error:", error);
    return api.sendMessage(`Error: ${error.message}`, event.threadID, event.messageID);
  }
};
