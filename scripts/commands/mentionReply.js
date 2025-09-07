module.exports.config = {
  name: "mentionReply",
  version: "1.0.0",
  permission: 0,
  credits: "Shakib",
  description: "Auto reply when someone mentions anyone",
  prefix: false,
  category: "auto",
};

const cuteReplies = [
  "হ্যাঁ ভাই! আমি এখানে আছি 😎",
  "বাবু খেয়াল রাখো 😌",
  "কি খবর? 😏",
  "বলো জানু 🌚",
  "মজা করছিস নাকি? 😜"
];

module.exports.run = async function({ api, event }) {
  try {
    const { threadID, mentions, body } = event;

    // ডিবাগ: Messenger থেকে আসা data দেখাও
    console.log("Event body:", body);
    console.log("Mentions:", mentions);

    // যদি মেনশন থাকে
    if (mentions && Object.keys(mentions).length > 0) {
      const userIDs = Object.keys(mentions);

      for (let id of userIDs) {
        const userName = mentions[id];  // Messenger থেকে নাম
        const reply = cuteReplies[Math.floor(Math.random() * cuteReplies.length)];

        // মেসেজ পাঠাও
        await api.sendMessage({
          body: `${userName}, ${reply}`,
          mentions: [{ tag: userName, id }]
        }, threadID);

        console.log(`Replied to ${userName} (${id}) with: ${reply}`);
      }
    }
  } catch (err) {
    console.error("mentionReply error:", err);
  }
};
