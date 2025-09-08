const fs = require("fs-extra");
const request = require("request");

module.exports.config = {
  name: "offer",
  version: "1.1.0",
  permission: 0,
  credits: "Shakib",
  description: "Send Messenger Bot Collection offer with creative buttons",
  prefix: true,
  category: "INFO",
  usages: "offer",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const offerText = `
🚀✨ আপনার জন্য দারুন অফার – Messenger Bot Collection ✨🚀

আমাদের কাছে পাচ্ছেন মোট ৪ ধরনের বট –
1️⃣ Simple Bot – বেসিক ফিচার সহ সহজ বট ✅
2️⃣ Special Bot – কমান্ড দিয়ে বট On/Off করার সুবিধা ✅
3️⃣ Premium Bot – Mention Reply Bot সিস্টেম সহ ✅
4️⃣ Modified Bot – এখানে আপনার নাম বসানো হবে একদম কাস্টমাইজড ✅

🐓 নতুন ফিচার – মুরগী সাইজ করার বট 🐓
💰 Price: ৳1000 ✅

💰 Price List:
👉 Simple Bot = ৳1000
👉 Special Bot = ৳1500
👉 Premium Bot = ৳2000
👉 Modified Bot = ৳3000
👉 মুরগী সাইজ করার বট = ৳1000

📦 প্যাকেজ অফার:
✔️ Simple + Special + Premium Bot একসাথে = ৳2000
✔️ প্যাকেজ + Modified Bot সহ = ৳3000

🔥 সীমিত সময়ের অফার – এখনই অর্ডার করুন আর পেয়ে যান আপনার নিজের স্মার্ট Messenger Bot! ✅
`;

  const imageURL = "https://i.postimg.cc/rptS5cVn/20250902-001924.png"; 
  const imagePath = __dirname + "/cache/offer.png";

  request(encodeURI(imageURL))
    .pipe(fs.createWriteStream(imagePath))
    .on("close", () => {
      api.sendMessage(
        {
          body: offerText,
          attachment: fs.createReadStream(imagePath),
          template: {
            type: "button",
            payload: {
              template_type: "button",
              text: "📲 যোগাযোগ করতে নিচের বাটনে ক্লিক করুন!",
              buttons: [
                {
                  type: "web_url",
                  url: "https://m.me/s.a.k.i.b.tsu.863539",
                  title: "💬 Messenger"
                },
                {
                  type: "web_url",
                  url: "https://wa.me/8801920826878",
                  title: "📞 WhatsApp"
                }
              ]
            }
          }
        },
        event.threadID,
        () => fs.unlinkSync(imagePath),
        event.messageID
      );
    });
};
