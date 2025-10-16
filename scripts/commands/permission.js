const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "permission",
  version: "1.0.0",
  permission: 1,
  credits: "Shakib",
  description: "Set or change user permission level",
  prefix: true,
  category: "Admin",
  usages: "[1|2] [userID]",
  cooldowns: 5,
};

const filePath = path.join(__dirname, "../../data/permission.json");

module.exports.run = async function ({ api, event, args }) {
  // permission.json ফাইল না থাকলে নতুন বানাবে
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  }

  const permissionData = JSON.parse(fs.readFileSync(filePath));

  // কমান্ডে পারামিটার না দিলে হেল্প দেখাবে
  if (args.length < 2) {
    return api.sendMessage(
      "❌ ব্যবহার:\n\n-permission1 <uid>\n-permission2 <uid>",
      event.threadID,
      event.messageID
    );
  }

  const command = args[0].toLowerCase(); // permission1 or permission2
  const userID = args[1];
  let level;

  if (command === "permission1") {
    level = 1;
  } else if (command === "permission2") {
    level = 2;
  } else {
    return api.sendMessage("⚠️ ভুল কমান্ড!", event.threadID, event.messageID);
  }

  // আইডি যুক্ত বা আপডেট করো
  permissionData[userID] = level;

  // ফাইলে সেভ করো
  fs.writeFileSync(filePath, JSON.stringify(permissionData, null, 2));

  return api.sendMessage(
    `✅ ইউজার ${userID} এখন permission level ${level} পেয়ে গেছে।`,
    event.threadID,
    event.messageID
  );
};
