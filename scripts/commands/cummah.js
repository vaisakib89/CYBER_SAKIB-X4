module.exports.config = {
  name: "cummah",
  version: "1.0.0",
  permission: 0,
  credits: "Sakib Vai",
  description: "উম্মাহ বার্তা ও reply delete",
  prefix: true,
  category: "fun",
  usages: "@mention",
  cooldowns: 5,
};

const repliedUsers = new Map();

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, mentions } = event;

  if (!Object.keys(mentions).length) {
    return api.sendMessage("❌ আগে কাউকে মেনশন করো।", threadID, messageID);
  }

  const mentionID = Object.keys(mentions)[0];
  const mentionName = mentions[mentionID];
  const tag = { tag: mentionName, id: mentionID };

  const messages = [
  `@ তুমার গালে উম্মাহ 😘`,
  `@ তুমার ঠোঁটে উম্মাহ 😚`,
  `@ তুমার উপরে উম্মাহ 😍`,
  `@ তুমার কপালে উম্মাহ 🥰`,
  `@ তুমার গলায় উম্মাহ 😘`,
  `@ তুমার চোখে উম্মাহ 😌`,
  `@ তুমার হৃদয়ে উম্মাহ ❤️`,
  `@ তুমার নাকে উম্মাহ 💋`,
  `@ তুমার হাতের তালুতে উম্মাহ 🤲`,
  `@ তুমার কানে উম্মাহ 👂😘`,
  `@ তুমার গালের ডিম্পলে উম্মাহ 😳`,
  `@ তুমার চিনিতে উম্মাহ 😋`,
  `@ তুমার কোমরে উম্মাহ 🔥`,
  `@ তুমার পিঠে উম্মাহ 💞`,
  `@ তুমার ঘাড়ে উম্মাহ 😈`,
  `@ তুমার বুকের বামে উম্মাহ 💓`,
  `@ তুমার বুকের ডানে উম্মাহ 💗`,
  `@ তুমার পায়ের আঙুলে উম্মাহ 🦶💋`,
  `@ তুমার হৃদয়ের গভীরে উম্মাহ 🫀`,
  `@ তুমার আত্মায় উম্মাহ 👻❤️`,
  `@ তুমার শ্বাসে উম্মাহ 😮‍💨`,
  `@ তুমার কল্পনায় উম্মাহ 🤤`,
  `@ তুমার ছায়ায় উম্মাহ 🌑`,
  `@ তুমার সব কথায় উম্মাহ 🎤💋`,
];

  // Send উম্মাহ messages one by one
  for (let i = 0; i < messages.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    api.sendMessage({
      body: messages[i],
      mentions: [tag]
    }, threadID);
  }

  // Save target for this thread
  repliedUsers.set(threadID, mentionID);

  // Setup listener only once
  if (!global._cummahReplyHandlerSet) {
    global._cummahReplyHandlerSet = true;

    api.listenMqtt((callbackEvent) => {
      const { senderID, threadID, messageID } = callbackEvent;

      if (repliedUsers.has(threadID)) {
        const targetID = repliedUsers.get(threadID);

        if (senderID === targetID) {
          // Delete user's message
          api.unsendMessage(messageID, (err) => {
            if (!err) {
              api.sendMessage(
                "🤫 কথা বইলোনা! শাকিব ভাই তুমাকে উম্মাহ দিতে বলছে তার পক্ষ থেকে 😘",
                threadID
              );
            }
          });

          repliedUsers.delete(threadID); // Prevent repeated triggers
        }
      }
    });
  }
};
