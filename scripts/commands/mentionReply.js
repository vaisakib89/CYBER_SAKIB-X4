module.exports.config = {
  name: "mentionReply",
  version: "1.0.0",
  permission: 0, // সকল ব্যবহারকারীর জন্য
  credits: "Shakib",
  description: "Auto reply whenever someone mentions anyone in chat",
  prefix: false,
  category: "auto",
  usages: "",
};

module.exports.run = async function({ api, event }) {
  try {
    const mentions = event.mentions; // Messenger API থেকে mentions নেয়া হয়

    // যদি মেনশন থাকে
    if (mentions && Object.keys(mentions).length > 0) {
      await api.sendMessage(
        "হ্যাঁ ভাই! আমি মেনশন দেখেছি 😎",
        event.threadID
      );
    }
  } catch (err) {
    console.error("mentionReply error:", err);
  }
};
