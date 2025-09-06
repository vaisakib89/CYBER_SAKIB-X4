// main/system/handle/mentionCheck.js
module.exports = function({ api, event }) {
    try {
        const mention = event.mentions;
        if (mention && Object.keys(mention).length > 0) {
            const myID = '100052951819398'; // এখানে নিজের ইউজার আইডি বসাও
            if (mention[myID]) {
                api.sendMessage(
                    "হ্যাঁ, আমি দেখেছি আপনি আমাকে মেনশন করেছেন!",
                    event.threadID
                );
            }
        }
    } catch (err) {
        console.error("Mention check error:", err);
    }
};
