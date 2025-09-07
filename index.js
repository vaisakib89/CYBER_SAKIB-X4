// মূল কনফিগ/লগার ফাইল লোড
require('./main/catalogs/IMRANA.js');

// mentionReply লিংক
const mentionReply = require('./main/events/mentionReply.js');

// api.listenMqtt বা মেসেজ হ্যান্ডলার যদি IMRANA.js এ থাকে,
// তাহলে সেখানে event পাঠাতে হবে
// উদাহরণ: যদি IMRANA.js exports api থাকে
const { api } = require('./main/catalogs/IMRANA.js');

api.listenMqtt(async (err, event) => {
  if (err) return console.error(err);

  // mentionReply চালু করা
  mentionReply({ api })(event);
});
