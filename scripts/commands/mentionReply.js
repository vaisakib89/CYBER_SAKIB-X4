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

module.exports = async function ({ event, api }) {
    try {
        // শুধুমাত্র এই UID মেনশন হলে রিপ্লাই
        const targetUIDs = ["100090445581185"];

        if (event.type === "message" && event.mentions) {
            const mentionedIDs = Object.keys(event.mentions);
            const found = targetUIDs.find(uid => mentionedIDs.includes(uid));

            if (found) {
                let name = event.mentions[found] || "Special User";

                // Send reply
                api.sendMessage(
                    `⚡ তুমি ${name} কে মেনশন করেছো! সাবধানে কথা বলো!`,
                    event.threadID,
                    event.messageID
                );
            }
        }
    } catch (e) {
        console.log("MentionReply Error:", e);
    }
};
