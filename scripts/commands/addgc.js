module.exports.config = {
  name: "addgc",
  version: "1.0.0",
  permission: 2,
  credits: "sakib vai",
  description: "Add a user to the group using Facebook profile link",
  prefix: true,
  category: "admin"
};

const axios = require("axios");

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;

  if (!args[0]) {
    return api.sendMessage("❌ দয়া করে একজনের ফেসবুক প্রোফাইল লিংক দিন।\n\n📌 উদাহরণ: -addgc https://www.facebook.com/profile.php?id=61579273161156", threadID, messageID);
  }

  const profileLink = args[0];
  let uid;

  try {
    // ✅ link থেকে id বের করো
    if (profileLink.includes("profile.php?id=")) {
      uid = profileLink.split("id=")[1].split("&")[0];
    } else {
      // যদি custom username হয়
      const res = await axios.get(`https://api.popcat.xyz/fbinfo?user=${encodeURIComponent(profileLink)}`);
      uid = res.data.id;
    }

    // ✅ বট সেই uid কে গ্রুপে অ্যাড করবে
    await api.addUserToGroup(uid, threadID);
    api.sendMessage(`✅ ইউজার (UID: ${uid}) কে গ্রুপে অ্যাড করা হয়েছে।`, threadID, messageID);

  } catch (err) {
    console.log(err.message || err);
    api.sendMessage("❌ ইউজারকে গ্রুপে অ্যাড করা যায়নি।\n\n👉 হয়তো বটের ফ্রেন্ড না বা প্রাইভেসি সেটিংস বন্ধ।", threadID, messageID);
  }
};
