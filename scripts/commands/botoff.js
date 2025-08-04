const fs = require("fs");

module.exports.config = {
  name: "botoff",
  version: "1.0.0",
  permission: 1,
  credits: "sakib vai",
  description: "Turn the bot OFF",
  category: "system",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  fs.writeFileSync(__dirname + "/../../data/botStatus.json", JSON.stringify({ status: false }, null, 2));
  return api.sendMessage("🤖 বট এখন বন্ধ হয়ে গেছে। আবার চালু করতে লিখুন: -boton", event.threadID);
};
