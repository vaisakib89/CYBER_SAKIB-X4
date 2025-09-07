module.exports.config = {
  name: "mentionReply",
  version: "1.0.0",
  permission: 0, // সকল ব্যবহারকারীর জন্য
  credits: "Shakib",
  description: "Auto reply when someone writes @S　A　K　I　B　ツ",
  prefix: false, // prefix-free
  category: "auto",
  usages: "",
};

module.exports.run = async function({ api, event }) {
  try {
    const body = event.body || "";

    // স্পেস এবং ইউনিকোড মেনশন মিলানো
    if (body.includes("@S　A　K　I　B　ツ")) {
      await api.sendMessage(
        "হ্যাঁ ভাই! আমি এখানে আছি 😎", 
        event.threadID
      );
    }
  } catch (err) {
    console.error("mentionReply error:", err);
  }
};
