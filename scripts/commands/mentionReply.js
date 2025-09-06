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
        // আপনার UID
        const ownerID = "100090445581185";

        // যদি মেনশনে Owner থাকে
        if (event.mentions && event.mentions[ownerID]) {
            api.sendMessage(
                "⚠️ শাকিব ভাই এখন ব্যস্ত আছেন, পরে রিপ্লাই দেবেন ❣️",
                event.threadID,
                event.messageID
            );
        }
    } catch (e) {
        console.log("Mention reply error: ", e);
    }
};
