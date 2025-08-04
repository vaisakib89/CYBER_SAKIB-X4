module.exports.config = {
  name: "unsent",
  version: "1.2.1",
  permission: 2,
  credits: "Sakib Vai",
  description: "Reply করে মেসেজ ডিলিট ও সতর্কবার্তা দিন",
  prefix: true,
  category: "moderation",
  usages: "-unsent (reply)",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, Users }) {
  const { messageReply, threadID, messageID } = event;

  if (!messageReply)
    return api.sendMessage("❌ অনুগ্রহ করে যেই মেসেজ ডিলিট করতে চান সেটিতে reply করে -unsent লিখুন।", threadID, messageID);

  const targetMsgID = messageReply.messageID;
  const offenderID = messageReply.senderID;

  try {
    // Get offender's name
    const name = await Users.getNameUser(offenderID);

    // First delete the message
    await api.unsendMessage(targetMsgID);

    // Then send warning message mentioning the offender
    await api.sendMessage({
      body: `⚠️ ${name}, দয়া করে এমন ভাষা ব্যবহার করবেন না!`,
      mentions: [{
        tag: name,
        id: offenderID
      }]
    }, threadID);

  } catch (err) {
    console.error("❌ আনসেন্ড করতে সমস্যা:", err);
    api.sendMessage("❌ মেসেজ ডিলিট করতে সমস্যা হয়েছে। বটের অনুমতি আছে তো নিশ্চিত হন।", threadID, messageID);
  }
};
