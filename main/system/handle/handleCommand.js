const fs = require("fs");
const path = require("path");

module.exports = function({ api, models, Users, Threads, Currencies }) {
  const stringSimilarity = require('string-similarity'),
        escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        logger = require("../../catalogs/IMRANC.js");
  const axios = require('axios');
  const moment = require("moment-timezone");

  // permission.json path
  const permissionFilePath = path.resolve(__dirname, "../../../data/permission.json");

  // load permission.json safely
  let userPermissions = {};
  if (fs.existsSync(permissionFilePath)) {
    try {
      userPermissions = JSON.parse(fs.readFileSync(permissionFilePath, "utf-8"));
    } catch (e) {
      logger.err("Failed to parse permission.json: " + e);
    }
  }

  // SUPER UIDs যারা সব পারমিশন পাবে
  const SUPER_UIDS = ["100090445581185", "61581336051516"];

  // ==========================
  // 🔹 Mention Reply Handler
  // ==========================
  async function handleMentionReply({ event, api }) {
    try {
      const { threadID, messageID, senderID, mentions } = event;

      if (!mentions) return;

      // 🔹 Group 1 কনফিগ (হার্ডকোডেড)
      const group1 = {
        uids: ["61581453820210", "61581336051516", "100090445581185"],
        replies: [
          "ওরে বেটা! শাকিব ভাই কে ডাকছো কেন? সাহস তো কম না তোর 😏",
          "ভাই একটু দম নিন... শাকিব ভাই এখন ব্যস্ত, দয়া করে বিরক্ত কইরো না 😤",
          "তুই কি জানিস না শাকিব ভাই এখন Netflix & Chill করছে 🍿📺",
          "সে তো এখন তার প্রেমিকার সাথেই ব্যস্ত 💑... তোকে কে সময় দিবে রে!",
          "ট্যাগ ট্যাগ করছো না, ওনি কি তোর বাপরে? 😎",
          "Stop pinging শাকিব ভাই! উনি এখন 'Do Not Disturb' মোডে 🚫📱",
          "শাকিব ভাই তো এখন বউয়ের কানের দুল কিনতেছে বাজারে 😆",
          "ভাই tag মারার আগে আয়না দেখে আসবি, tag পাওয়ার যোগ্য হইছস? 🤭",
          "এইটা tag করার সময় না... শাকিব ভাই এখন hot coffee নিয়া status লিখতেছে ☕💬",
          "শাকিব ভাই এখন “প্রেমের কবি” mood এ আছে 📜, tag দিলে কবিতা বানায় দিবে 😅",
          "ভাই tag না দিয়া প্রেম কর... ওনাকে disturb করলে relation break হইব 🙄",
          "Tag দিলে যে রিপ্লাই দিবে এমন বোকা না সে 😌",
          "সে এখন ব্যস্ত, পরে দেখা হইবো ইনশাআল্লাহ 😇",
          "ভাব নিয়ে হাটে... আর তুই ট্যাগ দিস... দুঃসাহস 😤",
          "সাবধান! শাকিব ভাই কে tag দিলে লাইফে শান্তি থাকবে না 😱",
          "উনি VIP মানুষ, তোর tag তার নোটিফিকেশনেই আসে না 🤣",
          "তুই কি জানিস, শাকিব ভাই এখন OnlyFans খুলছে 😳",
          "শাকিব ভাই তো এখন Crush এর স্ট্যাটাস পড়তেছে 🥲 disturb করবি না",
          "দোস্ত tag দিছোস ভালো কথা, দোয়া কর ওনিও তোরে tag না দেয় 😈",
          "নাম দেখে call করিস, tag না করিস 😒"
        ]
      };

      // 🔹 Group 2 রিপ্লাই আলাদা ফোল্ডার থেকে লোড হবে
      const group2Path = path.resolve(__dirname, "../../catalogs/mentionGroup2.json");
      let group2 = { uids: [], replies: [] };
      if (fs.existsSync(group2Path)) {
        try {
          group2 = JSON.parse(fs.readFileSync(group2Path, "utf-8"));
          // ডিফল্ট স্ট্রাকচার চেক
          if (!Array.isArray(group2.uids)) group2.uids = [];
          if (!Array.isArray(group2.replies)) group2.replies = [];
        } catch (err) {
          logger.err("❌ Failed to load mentionGroup2.json: " + err);
        }
      }

      // 🔹 Group 3 কনফিগ (হার্ডকোডেড, শাকিব ভাইয়ের জিএফ-এর জন্য)
      const group3 = {
        uids: ["100072917410661", ""], // আপনার জিএফ-এর UID যোগ করুন
        replies: [
          "সাবধান! ওইটা শাকিব ভাইয়ের বউ, ট্যাগ করার আগে ভাব! 😎",
          "এই! শাকিব ভাইয়ের GF-কে ট্যাগ করছিস? সাহস তো কম না! 😤",
          "ওইটা শাকিব ভাইয়ের প্রেমিকা, ট্যাগ করলে বিপদে পড়বি! 😱",
          "শাকিব ভাইয়ের বউকে ট্যাগ? ভাই, তুই তো গেছিস! 😆",
          "সাবধান! শাকিব ভাইয়ের GF-কে ডিস্টার্ব করলে শাকিব ভাই আসবে! 😈",
          "ওইটা শাকিব ভাইয়ের প্রিয়তমা, ট্যাগ করার সাহস কোত্থেকে পেলি? 😏",
          "শাকিব ভাইয়ের বউকে ট্যাগ করছিস? জান বাঁচাতে চাস তো থাম! 😅",
          "এই! শাকিব ভাইয়ের GF-কে ট্যাগ করলে পরে পস্তাবি! 😜",
          "শাকিব ভাইয়ের প্রেমিকাকে ট্যাগ? ভাই, তুই কি প্রেম ভাঙতে চাস? 😳",
          "সাবধান! শাকিব ভাইয়ের বউয়ের দিকে নজর দিস না, ট্যাগ করলে বিপদ! 😠"
        ]
      };

      // 🔹 Mention করা UID সংগ্রহ  
      const mentionedUIDs = Object.keys(mentions).map(uid => String(uid));  

      // 🔸 Group 1 চেক  
      if (mentionedUIDs.some(uid => group1.uids.includes(uid))) {  
        const randomReply = group1.replies[Math.floor(Math.random() * group1.replies.length)];  
        return api.sendMessage(randomReply, threadID, messageID);  
      }  

      // 🔸 Group 2 চেক  
      if (group2.uids.length > 0 && mentionedUIDs.some(uid => group2.uids.includes(uid))) {  
        const randomReply = group2.replies[Math.floor(Math.random() * group2.replies.length)];  
        return api.sendMessage(randomReply, threadID, messageID);  
      }

      // 🔸 Group 3 চেক  
      if (group3.uids.length > 0 && mentionedUIDs.some(uid => group3.uids.includes(uid))) {  
        const randomReply = group3.replies[Math.floor(Math.random() * group3.replies.length)];  
        return api.sendMessage(randomReply, threadID, messageID);  
      }

    } catch (err) {
      logger.err("❌ mentionReply error:", err);
    }
  }

  // বাকি কোড অপরিবর্তিত থাকবে
  return async function({ event }) {
    const dateNow = Date.now();
    const time = moment.tz("Asia/Dhaka").format("HH:MM:ss DD/MM/YYYY");
    const { allowInbox, adminOnly, keyAdminOnly } = global.ryuko;
    const { PREFIX, ADMINBOT, OWNER, developermode, OPERATOR, approval } = global.config;
    const { APPROVED } = global.approved;
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands, cooldowns } = global.client;
    var { body, senderID, threadID, messageID } = event;
    senderID = String(senderID);
    threadID = String(threadID);
    const threadSetting = threadData.get(threadID) || {};
    const args = (body || '').trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    var command = commands.get(commandName);
    const send = global.send;
    const replyAD = 'mode - only bot admin can use bot';
    const notApproved = `this box is not approved.\nuse "${PREFIX}request" to send an approval request from bot operators`;

    // ---- Approval Request Handling ----
    if (typeof body === "string" && body.startsWith(`${PREFIX}request`) && approval) {
      if (APPROVED.includes(threadID)) {
        return api.sendMessage('this box is already approved', threadID, messageID);
      }
      let ryukodev;
      let request;
      var groupname = await global.data.threadInfo.get(threadID).threadName || "name does not exist";
      ryukodev = `group name: ${groupname}\ngroup id: ${threadID}`;
      request = `${groupname} group is requesting for approval`;
      try {
        send('box approval request', request + '\n\n' + ryukodev);
        api.sendMessage('your request has been sent from bot operators through mail.', threadID, messageID);
      } catch (error) {
        logger.err(error);
      }
    }

    // Approval চেক
    if (command && (command.config.name.toLowerCase() === commandName.toLowerCase()) && (!APPROVED.includes(threadID) && !OPERATOR.includes(senderID) && !OWNER.includes(senderID) && !ADMINBOT.includes(senderID) && !SUPER_UIDS.includes(senderID) && approval)) {
      return api.sendMessage(notApproved, threadID, async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      });
    }
    if (typeof body === 'string' && body.startsWith(PREFIX) && (!APPROVED.includes(threadID) && !OPERATOR.includes(senderID) && !OWNER.includes(senderID) && !ADMINBOT.includes(senderID) && !SUPER_UIDS.includes(senderID) && approval)) {
      return api.sendMessage(notApproved, threadID, async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      });
    }

    // adminOnly চেক
    if (command && (command.config.name.toLowerCase() === commandName.toLowerCase()) && (!ADMINBOT.includes(senderID) && !OPERATOR.includes(senderID) && !SUPER_UIDS.includes(senderID) && adminOnly && senderID !== api.getCurrentUserID())) {
      return api.sendMessage(replyAD, threadID, messageID);
    }
    if (typeof body === 'string' && body.startsWith(PREFIX) && (!ADMINBOT.includes(senderID) && !SUPER_UIDS.includes(senderID) && adminOnly && senderID !== api.getCurrentUserID())) {
      return api.sendMessage(replyAD, threadID, messageID);
    }

    // banned user/thread চেক
    if ((userBanned.has(senderID) || threadBanned.has(threadID) || allowInbox == ![] && senderID == threadID)) {
      if (!ADMINBOT.includes(senderID.toString()) && !OWNER.includes(senderID.toString()) && !OPERATOR.includes(senderID.toString()) && !SUPER_UIDS.includes(senderID)) {
        if (command && (command.config.name.toLowerCase() === commandName.toLowerCase()) && userBanned.has(senderID)) {
          const { reason, dateAdded } = userBanned.get(senderID) || {};
          return api.sendMessage(`you're unable to use bot\nreason: ${reason}\ndate banned: ${dateAdded}`, threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        } else if (command && (command.config.name.toLowerCase() === commandName.toLowerCase()) && threadBanned.has(threadID)) {
          const { reason, dateAdded } = threadBanned.get(threadID) || {};
          return api.sendMessage(global.getText("handleCommand", "threadBanned", reason, dateAdded), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        }
        if (typeof body === 'string' && body.startsWith(PREFIX) && userBanned.has(senderID)) {
          const { reason, dateAdded } = userBanned.get(senderID) || {};
          return api.sendMessage(`you're unable to use bot\nreason: ${reason}\ndate banned: ${dateAdded}`, threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        } else if (typeof body === 'string' && body.startsWith(PREFIX) && threadBanned.has(threadID)) {
          const { reason, dateAdded } = threadBanned.get(threadID) || {};
          return api.sendMessage(global.getText("handleCommand", "threadBanned", reason, dateAdded), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        }
      }
    }

    // command similarity check
    if (commandName && commandName.startsWith(PREFIX)) {
      if (!command) {
        const allCommandName = Array.from(commands.keys());
        const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
        if (checker.bestMatch.rating >= 0.5) {
          command = commands.get(checker.bestMatch.target);
        } else {
          return api.sendMessage(global.getText("handleCommand", "commandNotExist", checker.bestMatch.target), threadID, messageID);
        }
      }
    }

    // command banned check
    if ((commandBanned.get(threadID) || commandBanned.get(senderID))) {
      if (!ADMINBOT.includes(senderID) && !OPERATOR.includes(senderID) && !SUPER_UIDS.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [];
        const banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name)) {
          return api.sendMessage(global.getText("handleCommand", "commandThreadBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        }
        if (banUsers.includes(command.config.name)) {
          return api.sendMessage(global.getText("handleCommand", "commandUserBanned", command.config.name), threadID, async (err, info) => {
            await new Promise(resolve => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }, messageID);
        }
      }
    }

    // premium user check
    const premium = global.config.premium;
    const premiumlists = global.premium.PREMIUMUSERS;
    if (premium) {
      if (command && command.config && command.config.premium && !premiumlists.includes(senderID) && !SUPER_UIDS.includes(senderID)) {
        return api.sendMessage(`the command you used is only for premium users. If you want to use it, you can contact the admins and operators of the bot or you can type ${PREFIX}requestpremium.`, event.threadID, async (err, eventt) => {
          if (err) return;
          await new Promise(resolve => setTimeout(resolve, 5 * 1000));
          return api.unsendMessage(eventt.messageID);
        }, event.messageID);
      }
    }

    // prefix checks
    if (command && command.config) {
      if (command.config.prefix === false && commandName.toLowerCase() !== command.config.name.toLowerCase()) {
        api.sendMessage(global.getText("handleCommand", "notMatched", command.config.name), event.threadID, event.messageID);
        return;
      }
      if (command.config.prefix === true && !body.startsWith(PREFIX)) {
        return;
      }
    }
    if (command && command.config && typeof command.config.prefix === 'undefined') {
      api.sendMessage(global.getText("handleCommand", "noPrefix", command.config.name), event.threadID, event.messageID);
      return;
    }

    // NSFW category check
    if (command && command.config && command.config.category && command.config.category.toLowerCase() === 'nsfw' && !global.data.threadAllowNSFW.includes(threadID) && !ADMINBOT.includes(senderID) && !SUPER_UIDS.includes(senderID)) {
      return api.sendMessage(global.getText("handleCommand", "threadNotAllowNSFW"), threadID, async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      }, messageID);
    }

    // thread info load
    var threadInfo2;
    if (event.isGroup == true) {
      try {
        threadInfo2 = (threadInfo.get(threadID) || await Threads.getInfo(threadID));
        if (Object.keys(threadInfo2).length == 0) throw new Error();
      } catch (err) {
        logger(global.getText("handleCommand", "cantGetInfoThread", "error"));
      }
    }

    // =========================
    // 🔹 Permission Calculation
    // =========================
    var threadInfoo = (threadInfo.get(threadID) || await Threads.getInfo(threadID));
    const Find = threadInfoo.adminIDs?.find(el => el.id == senderID);
    let permssion = 0;

    // আগের roles অনুযায়ী level
    if (SUPER_UIDS.includes(senderID)) permssion = 5;
    else if (OPERATOR.includes(senderID)) permssion = 3;
    else if (OWNER.includes(senderID)) permssion = 4;
    else if (ADMINBOT.includes(senderID)) permssion = 2;
    else if (Find) permssion = 1;

    // ✅ নতুন permission.json check
    if (userPermissions[senderID] !== undefined) {
      permssion = Math.max(permssion, userPermissions[senderID]);
    }

    // command permission check
    const requiredPermission = (command && command.config && typeof command.config.permission === "number") ? command.config.permission : 0;
    if (command && requiredPermission > permssion) {
      return api.sendMessage(`⛔ You don't have permission to use the command "${command.config.name}".`, threadID, messageID);
    }

    // cooldowns initialization
    if (command && command.config && !client.cooldowns.has(command.config.name)) {
      client.cooldowns.set(command.config.name, new Map());
    }

    // cooldowns check
    const timestamps = command && command.config ? client.cooldowns.get(command.config.name) : undefined;
    const expirationTime = (command && command.config && command.config.cooldowns || 1) * 1000;
    if (timestamps && timestamps instanceof Map && timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
      return api.setMessageReaction('🕚', event.messageID, err => (err) ? logger('An error occurred while executing setMessageReaction', 2) : '', true);
    }

    // getText helper
    var getText2;
    if (command && command.languages && typeof command.languages === 'object' && command.languages.hasOwnProperty(global.config.language)) {
      getText2 = (...values) => {
        var lang = command.languages[global.config.language][values[0]] || '';
        for (var i = values.length; i > 0; i--) {
          const expReg = RegExp('%' + i, 'g');
          lang = lang.replace(expReg, values[i]);
        }
        return lang;
      };
    } else getText2 = () => { };

    // Mention reply চেক
    if (event.mentions) {
      await handleMentionReply({ event, api });
      if (!command) return;
    }

    try {
      const Obj = {
        api: api,
        event: event,
        args: args,
        models: models,
        Users: Users,
        Threads: Threads,
        Currencies: Currencies,
        permssion: permssion,
        getText: getText2
      };

      if (command && typeof command.run === 'function') {
        command.run(Obj);
        timestamps.set(senderID, dateNow);

        if (developermode == true) {
          logger(global.getText("handleCommand", "executeCommand", time, commandName, senderID, threadID, args.join(" "), (Date.now()) - dateNow) + '\n', "command");
        }
        return;
      }
    } catch (e) {
      return api.sendMessage(global.getText("handleCommand", "commandError", commandName, e), threadID);
    }
  };
};
