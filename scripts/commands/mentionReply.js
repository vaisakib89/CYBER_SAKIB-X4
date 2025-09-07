module.exports.config = {
  name: "mentionReply",
  version: "1.0.0",
  permission: 0,
  credits: "Shakib",
  description: "Auto reply when someone mentions or writes Shakib",
  prefix: false,
  category: "auto"
};

module.exports.run = async function({ api, event }) {
  try {
    const { threadID, mentions, body, messageID } = event;

    // ✅ Case 1: যদি মেনশন হয়
    if (mentions && Object.keys(mentions).length > 0) {
      return api.sendMessage("😎 কারে মেনশন দিছো ভাই?", threadID, messageID);
    }

    // ✅ Case 2: কেউ নাম লিখলে (Shakib variations)
    if (body) {
      const lower = body.toLowerCase();
      if (lower.includes("shakib") || lower.includes("সাকিব") || lower.includes("@sakib")) {
        return api.sendMessage("👀 কিরে আমাকে ডাকলি নাকি? 😏", threadID, messageID);
      }
    }

  } catch (e) {
    console.log("❌ mentionReply error:", e);
  }
};
