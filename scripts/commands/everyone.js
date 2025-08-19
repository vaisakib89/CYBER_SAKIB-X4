module.exports.config = {
    name: "everyone",
    version: "1.0.0",
    permission: 0,
    credits: "Sakib Vai",
    description: "Mention everyone in the group with your custom text",
    prefix: true,
    category: "group",
    usages: "-@everyone আপনার মেসেজ",
    cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
    if (!event.isGroup) return api.sendMessage("এই কমান্ড শুধু গ্রুপে কাজ করবে!", event.threadID);

    const text = args.join(" ");
    if (!text) return api.sendMessage("দয়া করে লিখুন: -@everyone আপনার মেসেজ", event.threadID);

    const threadInfo = await api.getThreadInfo(event.threadID);
    const mentions = [];
    let message = "";

    for (let participant of threadInfo.participantIDs) {
        if (participant != api.getCurrentUserID()) {
            const name = threadInfo.userInfo.find(u => u.id === participant)?.name || "Member";
            mentions.push({ tag: name, id: participant });
            message += "@" + name + " ";
        }
    }

    message += text;

    api.sendMessage({ body: message, mentions }, event.threadID);
};
