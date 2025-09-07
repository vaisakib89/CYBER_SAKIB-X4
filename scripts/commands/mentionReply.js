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
    const { mentions, threadID } = event;

    // যদি মেনশন থাকে
    if (mentions && Object.keys(mentions).length > 0) {
      const userIDs = Object.keys(mentions);

      for (let id of userIDs) {
        const reply = cuteReplies[Math.floor(Math.random() * cuteReplies.length)];
        const userName = mentions[id]; // Messenger API থেকে সরাসরি নাম

        await api.sendMessage({
          body: `${userName}, ${reply}`,
          mentions: [{ tag: userName, id }]
        }, threadID);
      }
    }
  } catch (err) {
    console.error("mentionReply error:", err);
  }
};
