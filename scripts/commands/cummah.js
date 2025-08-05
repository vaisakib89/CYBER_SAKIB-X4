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
    `${mentionName} তুমার গালে উম্মাহ 😘`,
    `${mentionName} তুমার ঠোঁটে উম্মাহ 😚`,
    `${mentionName} তুমার উপরে উম্মাহ 😍`,
    `${mentionName} তুমার কপালে উম্মাহ 🥰`,
    `${mentionName} তুমার গলায় উম্মাহ 😘`,
    `${mentionName} তুমার চোখে উম্মাহ 😌`,
    `${mentionName} তুমার হৃদয়ে উম্মাহ ❤️`,
    `${mentionName} তুমার নাকে উম্মাহ 💋`,
    `${mentionName} তুমার হাতের তালুতে উম্মাহ 🤲`,
    `${mentionName} তুমার কানে উম্মাহ 👂😘`,
    `${mentionName} তুমার গালের ডিম্পলে উম্মাহ 😳`,
    `${mentionName} তুমার চিনিতে উম্মাহ 😋`,
    `${mentionName} তুমার কোমরে উম্মাহ 🔥`,
    `${mentionName} তুমার পিঠে উম্মাহ 💞`,
    `${mentionName} তুমার ঘাড়ে উম্মাহ 😈`,
    `${mentionName} তুমার বুকের বামে উম্মাহ 💓`,
    `${mentionName} তুমার বুকের ডানে উম্মাহ 💗`,
    `${mentionName} তুমার পায়ের আঙুলে উম্মাহ 🦶💋`,
    `${mentionName} তুমার হৃদয়ের গভীরে উম্মাহ 🫀`,
    `${mentionName} তুমার আত্মায় উম্মাহ 👻❤️`,
    `${mentionName} তুমার শ্বাসে উম্মাহ 😮‍💨`,
    `${mentionName} তুমার কল্পনায় উম্মাহ 🤤`,
    `${mentionName} তুমার ছায়ায় উম্মাহ 🌑`,
    `${mentionName} তুমার সব কথায় উম্মাহ 🎤💋`,
  ];

  for (let i = 0; i < messages.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    api.sendMessage({
      body: messages[i],
      mentions: [tag]
    }, threadID);
  }

  repliedUsers.set(threadID, mentionID);

  if (!global._cummahReplyHandlerSet) {
    global._cummahReplyHandlerSet = true;

    api.listenMqtt((callbackEvent) => {
      const { senderID, threadID, messageID, messageReply } = callbackEvent;

      if (repliedUsers.has(threadID)) {
        const targetID = repliedUsers.get(threadID);

        // ✅ শুধুমাত্র বটের মেসেজে রিপ্লাই করলে কাজ করবে
        if (
          senderID === targetID &&
          messageReply &&
          messageReply.senderID === api.getCurrentUserID()
        ) {
          api.unsendMessage(messageID, (err) => {
            if (!err) {
              api.sendMessage(
                "🤫 কথা বইলোনা! শাকিব ভাই তুমাকে উম্মাহ দিতে বলছে তার পক্ষ থেকে 😘",
                threadID
              );
            }
          });

          repliedUsers.delete(threadID);
        }
      }
    });
  }
};
