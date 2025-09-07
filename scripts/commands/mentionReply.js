module.exports.config = {
name: "mentionReply ",
version: "1.0.0",
permission: 0,
credits: "Shakib",
description: "Auto reply when someone writes Shakib variations",
prefix: false, // prefix-free
category: "auto",
usages: "",
};

module.exports = async function({ api, event }) {
try {
const body = event.body?.toLowerCase() || "";

// ✅ variations of "Shakib"  
const triggers = [  
  "শাকিব",  
  "sakib",  
  "@s a k i b ツ",  
  "@S A K I B ツ" // বড়ো হাতের version  
];  

// check message body for matches (case-insensitive)  
const matched = triggers.find(t => body.includes(t.toLowerCase()));  
if (matched) {  
  return api.sendMessage(  
    `⚡ তুমি "${matched}" লিখেছো! সাবধানে কথা বলো!`,  
    event.threadID,  
    event.messageID  
  );  
}

} catch (e) {
console.log("Shakib Text Reply Error:", e);
}
};
