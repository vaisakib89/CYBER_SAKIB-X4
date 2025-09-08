const fs = require("fs-extra");
const request = require("request");

module.exports.config = {
  name: "offer",
  version: "2.0.0",
  permission: 0,
  credits: "Shakib",
  description: "Send Messenger Bot Collection offer with image and styled text",
  prefix: true,
  category: "INFO",
  usages: "offer",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const offerText = `
✨🚀 **Exclusive Messenger Bot Collection Offer** 🚀✨

আমাদের কাছে পাচ্ছেন মোট **৪ ধরনের স্মার্ট বট** 🔥

1️⃣ **Simple Bot** – বেসিক ফিচার সহ সহজ বট ✅  
2️⃣ **Special Bot** – কমান্ড দিয়ে বট **On/Off** করার সুবিধা ✅  
3️⃣ **Premium Bot** – **Mention Reply Bot** সিস্টেম সহ ✅  
4️⃣ **Modified Bot** – আপনার নাম দিয়ে একদম **কাস্টমাইজড** ✅  

🐓 **নতুন ফিচার** – *মুরগী সাইজ করার বট* 🐓  
💰 **Price: ৳1000** ✅  

📋 **Price List:**  
👉 Simple Bot = **৳1000**  
👉 Special Bot = **৳1500**  
👉 Premium Bot = **৳2000**  
👉 Modified Bot = **৳3000**  
👉 মুরগী সাইজ করার বট = **৳1000**  

📦 **প্যাকেজ অফার:**  
✔️ Simple + Special + Premium Bot একসাথে = **৳2000**  
✔️ প্যাকেজ + Modified Bot সহ = **৳3000**  

🔥 সীমিত সময়ের অফার – এখনই অর্ডার করুন আর পেয়ে যান আপনার নিজের স্মার্ট Messenger Bot! ✅  

📩 **যোগাযোগের লিঙ্ক:**  
👉 Messenger: [এখানে ক্লিক করুন](https://m.me/s.a.k.i.b.tsu.863539)  
👉 WhatsApp: [এখানে ক্লিক করুন](https://wa.me/8801920826878)  
`;

  const imageURL = "https://i.postimg.cc/rptS5cVn/20250902-001924.png";
  const imagePath = __dirname + "/cache/offer.png";

  request(encodeURI(imageURL))
    .pipe(fs.createWriteStream(imagePath))
    .on("close", () => {
      api.sendMessage(
        {
          body: offerText,
          attachment: fs.createReadStream(imagePath)
        },
        event.threadID,
        () => fs.unlinkSync(imagePath),
        event.messageID
      );
    });
};
