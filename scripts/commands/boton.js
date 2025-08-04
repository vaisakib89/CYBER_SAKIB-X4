const fs = require("fs");

module.exports.config = {
  name: "boton",
  version: "1.0.0",
  permission: 1,
  credits: "sakib vai",
  description: "Turn the bot ON",
  category: "system",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  fs.writeFileSync(__dirname + "/../../data/botStatus.json", JSON.stringify({ status: true }, null, 2));
  return api.sendMessage("✅ বট এখন চালু হয়ে গেছে!", event.threadID);
};
