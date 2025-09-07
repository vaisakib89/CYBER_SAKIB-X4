const axios = require("axios");

module.exports.config = {
  name: "mentionReply",
  version: "2.2.1",
  permission: 0,
  credits: "Shakib",
  description: "Auto reply whenever someone mentions anyone in chat",
  prefix: false,
  premium: false,
  category: "auto",
  usages: "[your message]",
  cooldowns: 0
};

// Cute/funny replies
const cuteReplies = [
  "I love you 💝",
  "এ বেডা তোগো GC এর C E O বাপ্পি কই😌",
  "Bot না জানু,বল 😌",
  "বলো জানু 🌚",
  "Hop beda😾,Boss বল boss😼",
  "𝗕𝗼𝘁 না জানু, বল 😌",
  "Bolo Babu, তুমি কি আমাকে ভালোবাসো? 🙈",
  "আজকে আমার মন ভালো নেই 🙉",
  "হ্যাঁ ভাই! আমি এখানে আছি 😎"
  // … আগের সব cuteReplies এখানে রাখতে পারো
];

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, mentions } = event;
  const query = args.join(" ");

  // যদি মেসেজে মেনশন থাকে
  if (mentions && Object.keys(mentions).length > 0) {
    const userIDs = Object.keys(mentions);
    for (let id of userIDs) {
      const reply = cuteReplies[Math.floor(Math.random() * cuteReplies.length)];
      await api.getUserInfo(id, (err, result) => {
        if (err) return console.error(err);

        const userName = result[id].name;
        api.sendMessage({
          body: `${userName}, ${reply}`,
          mentions: [{ tag: userName, id }]
        }, threadID);
      });
    }
    return; // মেনশন রিপ্লাই হয়ে গেলে মূল কোড চলবে না
  }

  // যদি কোনো মেসেজ থাকে তবে আগের লজিক চালাবে
  if (!query) {
    const reply = cuteReplies[Math.floor(Math.random() * cuteReplies.length)];
    return api.getUserInfo(senderID, (err, result) => {
      if (err) return console.error(err);

      const userName = result[senderID].name;
      api.sendMessage({
        body: `${userName}, ${reply}`,
        mentions: [{ tag: userName, id: senderID }]
      }, threadID);
    });
  }

  // API call for user query
  try {
    const response = await axios.get(`https://www.noobs-api.rf.gd/dipto/baby?text=${encodeURIComponent(query)}&senderID=100075122837809&font=1`);
    const reply = response.data.reply || "I didn't get that. Try asking something else!";

    api.sendMessage(reply, threadID, (err, info) => {
      if (err) return;
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);
  } catch (error) {
    console.error("API Error:", error.message);
    api.sendMessage("Something went wrong while contacting the bot service.", threadID, messageID);
  }
};

module.exports.handleReply = async ({ api, event }) => {
  const { threadID, messageID, senderID, body } = event;

  try {
    const response = await axios.get(`https://www.noobs-api.rf.gd/dipto/baby?text=${encodeURIComponent(body)}&senderID=100075122837809&font=1`);
    const reply = response.data.reply || "I didn't get that. Try asking something else!";

    api.sendMessage(reply, threadID, (err, info) => {
      if (err) return;
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID
      });
    }, messageID);
  } catch (error) {
    console.error("API Error:", error.message);
    api.sendMessage("Something went wrong while contacting the bot service.", threadID, messageID);
  }
};

module.exports.handleReaction = async ({ api, event }) => {
  const { reaction, messageReply } = event;

  if (reaction === '😡') {
    try {
      await api.unsendMessage(messageReply.messageID);
    } catch (err) {
      console.error("Failed to unsend message:", err.message);
    }
  }
};
