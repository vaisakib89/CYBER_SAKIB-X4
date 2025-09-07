// ========================================
// Shakib Bot - Main Index File
// ========================================

// মূল কনফিগ/লগার ফাইল লোড
const { api } = require('./main/catalogs/IMRANA.js');

// mentionReply ফাইল লোড
const mentionReply = require('./main/scripts/commands/mentionReply.js');

// ==================================================
// মূল মেসেজ ইভেন্ট লিসেনার
// ==================================================
api.listenMqtt(async (err, event) => {
  if (err) return console.error("MQTT Error:", err);

  try {
    // mentionReply ফিচার চালানো
    await mentionReply({ api, event });

    // এখানে অন্য ইভেন্ট বা কমান্ড হ্যান্ডলার থাকলে কল করতে পারো
    // উদাহরণ:
    // await handleCommand({ api, event });

  } catch (error) {
    console.error("Event Error:", error);
  }
});

console.log("✅ Shakib Bot চালু হয়েছে। সব ঠিক আছে!");
