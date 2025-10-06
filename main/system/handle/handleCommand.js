const fs = require("fs");
const path = require("path");

module.exports = function({ api, models, Users, Threads, Currencies }) {
  const stringSimilarity = require('string-similarity'),
        escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        logger = require("../../catalogs/IMRANC.js");
  const axios = require('axios');
  const moment = require("moment-timezone");

  // data ফোল্ডারের botStatus.json এর path
  const botStatusPath = path.resolve(__dirname, "../../../data/botStatus.json");

  // SUPER UIDs যারা সব পারমিশন পাবে
  const SUPER_UIDS = ["100090445581185", "61581336051516"];

  // ৩ ধাপ delay helper ফাংশন
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // bot status পড়ার async ফাংশন (৩ ধাপ delay সহ)
  async function readBotStatus() {
    try {
      await delay(300); // ৩০০ms delay
      if (!fs.existsSync(botStatusPath)) {
        return { status: "on" };
      }
      const data = fs.readFileSync(botStatusPath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      logger.err("Failed to read bot status: " + e);
      return { status: "on" };
    }
  }

  // bot status লেখার async ফাংশন (৩ ধাপ delay সহ)
  async function writeBotStatus(status) {
    try {
      await delay(300);
      fs.writeFileSync(botStatusPath, JSON.stringify({ status: status }, null, 2));
    } catch (e) {
      logger.err("Failed to write bot status: " + e);
    }
  }

  // ==========================
  // 🔹 Mention Reply Handler
  // ==========================
  async function handleMentionReply({ event, api }) {
    try {
      const { threadID, messageID, senderID, mentions } = event;

      // 🔹 UID এবং তাদের জন্য নির্দিষ্ট রিপ্লাই লিস্ট
      const REPLY_CONFIG = {
        "group1": {
          uids: ["100090445581185", "", "61581453820210"],
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
        },
        "group2": {
          uids: ["61581336051516"],
          replies: [
            "ওহো! এই ভাইকে ট্যাগ করছো? তিনি এখন স্টার মোডে আছেন 🌟",
            "তুই ট্যাগ দিছোস, কিন্তু উনি এখন VIP লেভেলে ব্যস্ত 😎",
            "এই ভাই এখন গেম খেলছে 🎮, পরে ট্যাগ করিস!",
            "ট্যাগ দিলি কেন? উনি তো এখন selfie তুলতে ব্যস্ত 📸",
            "ভাইয়ের মুড এখন romantic, ট্যাগ দিয়ে disturb করিস না 😍",
            "এই UID ট্যাগ করলে উনি হয়তো meme পাঠাবে 😂",
            "ওরে! এই ভাই এখন coffee shop এ গল্প করছে ☕, পরে ডাকিস",
            "ট্যাগ মারলি কেন? উনি এখন TikTok ভিডিও বানাচ্ছে 🎥",
            "ভাই এখন gym এ, ট্যাগ দিলে বারবেল ছুড়ে মারবে 💪",
            "এই ভাইয়ের ট্যাগ পেলে তুই লাকি, কিন্তু উনি এখন offline 😴"
          ]
        }
      };

      if (mentions) {
        const mentionedUIDs = Object.keys(mentions);
        for (const group in REPLY_CONFIG) {
          const { uids, replies } = REPLY_CONFIG[group];
          const targetMentioned = mentionedUIDs.some(uid => uids.includes(uid));
          if (targetMentioned) {
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            return api.sendMessage(randomReply, threadID, messageID);
          }
        }
      }
      return;
    } catch (err) {
      logger.err("❌ mentionReply error:", err);
    }
  }

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

    // ==== BOT ON/OFF STATUS READ ====
    const botStatusData = await readBotStatus();
    const botIsOn = botStatusData.status === "on";

    // --- Bot OFF হলে শুধু -boton এবং -botoff কমান্ড কাজ করবে ---
    if (!botIsOn) {
      if (commandName !== `${PREFIX}boton` && commandName !== `${PREFIX}botoff`) {
        return;
      }
    }

    // ==== BOT ON/OFF COMMANDS HANDLE ====
    if (commandName === `${PREFIX}boton` || commandName === `${PREFIX}botoff`) {
      if (!ADMINBOT.includes(senderID) && !OWNER.includes(senderID) && !SUPER_UIDS.includes(senderID)) {
        logger.err(`Unauthorized attempt to use ${commandName} by user ${senderID} in thread ${threadID}`);
        return api.sendMessage("Sorry, only bot admins, owners, or super users can use this command!", threadID, messageID);
      }

      if (commandName === `${PREFIX}boton`) {
        await writeBotStatus("on");
        return api.sendMessage("Bot is now ON ✅", threadID, messageID);
      } else if (commandName === `${PREFIX}botoff`) {
        await writeBotStatus("off");
        return api.sendMessage("Bot is now OFF ❌", threadID, messageID);
      }
    }

    // ---- Approval Request Handling ----
    if (typeof body === "string" && body.startsWith(`${PREFIX}request`) && approval && botIsOn) {
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
    if (command && (command.config.name.toLowerCase() === commandName.toLowerCase()) && (!APPROVED.includes(threadID) && !OPERATOR.includes(senderID) && !OWNER.includes(senderID) && !ADMINBOT.includes(senderID) && !SUPER_UIDS.includes(senderID) && approval) && botIsOn) {
      return api.sendMessage(notApproved, threadID, async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      });
    }
    if (typeof body === 'string' && body.startsWith(PREFIX) && (!APPROVED.includes(threadID) && !OPERATOR.includes(senderID) && !OWNER.includes(senderID) && !ADMINBOT.includes(senderID) && !SUPER_UIDS.includes(senderID) && approval) && botIsOn) {
      return api.sendMessage(notApproved, threadID, async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      });
    }

    // adminOnly চেক
    if (command && (command.config.name.toLowerCase() === commandName.toLowerCase()) && (!ADMINBOT.includes(senderID) && !OPERATOR.includes(senderID) && !SUPER_UIDS.includes(senderID) && adminOnly && senderID !== api.getCurrentUserID()) && botIsOn) {
      return api.sendMessage(replyAD, threadID, messageID);
    }
    if (typeof body === 'string' && body.startsWith(PREFIX) && (!ADMINBOT.includes(senderID) && !SUPER_UIDS.includes(senderID) && adminOnly && senderID !== api.getCurrentUserID()) && botIsOn) {
      return api.sendMessage(replyAD, threadID, messageID);
    }

    // banned user/thread চেক
    if ((userBanned.has(senderID) || threadBanned.has(threadID) || allowInbox == ![] && senderID == threadID) && botIsOn) {
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
    if (commandName && commandName.startsWith(PREFIX) && botIsOn) {
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
    if ((commandBanned.get(threadID) || commandBanned.get(senderID)) && botIsOn) {
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
    if (premium && botIsOn) {
      if (command && command.config && command.config.premium && !premiumlists.includes(senderID) && !SUPER_UIDS.includes(senderID)) {
        return api.sendMessage(`the command you used is only for premium users. If you want to use it, you can contact the admins and operators of the bot or you can type ${PREFIX}requestpremium.`, event.threadID, async (err, eventt) => {
          if (err) return;
          await new Promise(resolve => setTimeout(resolve, 5 * 1000));
          return api.unsendMessage(eventt.messageID);
        }, event.messageID);
      }
    }

    // prefix checks
    if (command && command.config && botIsOn) {
      if (command.config.prefix === false && commandName.toLowerCase() !== command.config.name.toLowerCase()) {
        api.sendMessage(global.getText("handleCommand", "notMatched", command.config.name), event.threadID, event.messageID);
        return;
      }
      if (command.config.prefix === true && !body.startsWith(PREFIX)) {
        return;
      }
    }
    if (command && command.config && botIsOn && typeof command.config.prefix === 'undefined') {
      api.sendMessage(global.getText("handleCommand", "noPrefix", command.config.name), event.threadID, event.messageID);
      return;
    }

    // NSFW category check
    if (command && command.config && command.config.category && command.config.category.toLowerCase() === 'nsfw' && !global.data.threadAllowNSFW.includes(threadID) && !ADMINBOT.includes(senderID) && !SUPER_UIDS.includes(senderID) && botIsOn) {
      return api.sendMessage(global.getText("handleCommand", "threadNotAllowNSFW"), threadID, async (err, info) => {
        await new Promise(resolve => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      }, messageID);
    }

    // thread info load
    var threadInfo2;
    if (event.isGroup == true && botIsOn) {
      try {
        threadInfo2 = (threadInfo.get(threadID) || await Threads.getInfo(threadID));
        if (Object.keys(threadInfo2).length == 0) throw new Error();
      } catch (err) {
        logger(global.getText("handleCommand", "cantGetInfoThread", "error"));
      }
    }

    // permission calculation
    var permssion = 0;
    var threadInfoo = (threadInfo.get(threadID) || await Threads.getInfo(threadID));
    const Find = threadInfoo.adminIDs.find(el => el.id == senderID);
    if (SUPER_UIDS.includes(senderID) && botIsOn) permssion = 5; // সর্বোচ্চ পারমিশন
    else if (OPERATOR.includes(senderID.toString()) && botIsOn) permssion = 3;
    else if (OWNER.includes(senderID.toString()) && botIsOn) permssion = 4;
    else if (ADMINBOT.includes(senderID.toString()) && botIsOn) permssion = 2;
    else if (Find && botIsOn) permssion = 1;

    // permission check with default 0
    const requiredPermission = (command && command.config && typeof command.config.permission === "number") ? command.config.permission : 0;
    if (command && command.config && requiredPermission > permssion && botIsOn) {
      return api.sendMessage(global.getText("handleCommand", "permissionNotEnough", command.config.name), event.threadID, event.messageID);
    }

    // cooldowns initialization
    if (command && command.config && !client.cooldowns.has(command.config.name) && botIsOn) {
      client.cooldowns.set(command.config.name, new Map());
    }

    // cooldowns check
    const timestamps = command && command.config ? client.cooldowns.get(command.config.name) : undefined;
    const expirationTime = (command && command.config && command.config.cooldowns || 1) * 1000;
    if (timestamps && timestamps instanceof Map && timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime && botIsOn) {
      return api.setMessageReaction('🕚', event.messageID, err => (err) ? logger('An error occurred while executing setMessageReaction', 2) : '', true);
    }

    // getText helper
    var getText2;
    if (command && command.languages && typeof command.languages === 'object' && command.languages.hasOwnProperty(global.config.language) && botIsOn) {
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
    if (event.mentions && botIsOn) {
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

      if (command && typeof command.run === 'function' && botIsOn) {
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
