module.exports.config = {
    name: "mentionReply",
    version: "1.0.0",
    permission: 0,
    credits: "Shakib",
    description: "Auto reply when owner is mentioned",
    prefix: false,
    category: "auto",
    usages: "",
};

module.exports.run = async ({ api, event }) => {
    try {
        // শুধুমাত্র মেসেজ বা রিপ্লাই ইভেন্টে চলবে
        if (event.type !== "message" && event.type !== "message_reply") return;

        // Owner UID
        const ownerID = global.config.ownerID || "100090445581185";

        // যদি মেনশনে Owner থাকে
        if (event.mentions && (event.mentions[ownerID] || Object.keys(event.mentions).includes(ownerID))) {
            api.sendMessage(
                "⚠️ শাকিব ভাই এখন ব্যস্ত আছেন, পরে রিপ্লাই দেবেন ❣️",
                event.threadID,
                { replyTo: event.messageID } // নিরাপদভাবে রিপ্লাই করার জন্য
            );
        }
    } catch (e) {
        console.error("Mention reply এরর: ", e.message, e.stack);
    }
};
