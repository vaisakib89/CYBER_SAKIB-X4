const fs = require("fs");
const path = require("path");

module.exports = function ({ api, models, Users, Threads, Currencies }) {
  const stringSimilarity = require("string-similarity"),
    escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    logger = require("../../catalogs/IMRANC.js");
  const axios = require("axios");
  const moment = require("moment-timezone");

  // Data ফোল্ডারের ফাইল পাথ
  const botStatusPath = path.resolve(__dirname, "../../../data/botStatus.json");
  const warnDataPath = path.resolve(__dirname, "../../../data/wornData.json");

  // ৩ ধাপ delay helper ফাংশন
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Bot status পড়ার async ফাংশন
  async function readBotStatus() {
    try {
      await delay(300);
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

  // Bot status লেখার async ফাংশন
  async function writeBotStatus(status) {
    try {
      await delay(300);
      fs.writeFileSync(botStatusPath, JSON.stringify({ status: status }, null, 2));
    } catch (e) {
      logger.err("Failed to write bot status: " + e);
    }
  }

  // warnData.json থেকে ডাটা লোড বা ডিফল্ট তৈরি
  function loadWarnData() {
    if (!fs.existsSync(warnDataPath)) {
      const initData = { status: "true", warns: {} };
      fs.writeFileSync(warnDataPath, JSON.stringify(initData, null, 2));
      return initData;
    }
    const data = fs.readFileSync(warnDataPath, "utf-8");
    try {
      return JSON.parse(data);
    } catch {
      return { status: "true", warns: {} };
    }
  }

  // warnData.json এ ডাটা লেখা
  function saveWarnData(data) {
    try {
      fs.writeFileSync(warnDataPath, JSON.stringify(data, null, 2));
    } catch (e) {
      logger.err("Failed to write warn data: " + e);
    }
  }

  // মেসেজে লিংক আছে কিনা চেক করার ফাংশন
  function containsGroupLink(text) {
    if (!text) return false;
    const regex = /(https?:\/\/)?(www\.)?(facebook\.com\/groups\/|fb\.com\/groups\/|m\.me\/join\/|fb\.me\/groups\/)[^\s]+/i;
    return regex.test(text);
  }

  return async function ({ event }) {
    const dateNow = Date.now();
    const time = moment.tz("Asia/Dhaka").format("HH:MM:ss DD/MM/YYYY");
    const { allowInbox, adminOnly, keyAdminOnly } = global.ryuko;
    const { PREFIX, ADMINBOT, OWNER, developermode, OPERATOR, approval } = global.config;
    const { APPROVED } = global.approved;
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands, cooldowns } = global.client;
    var { body, senderID, threadID, messageID, isGroup } = event;
    senderID = String(senderID);
    threadID = String(threadID);
    const threadSetting = threadData.get(threadID) || {};
    const args = (body || "").trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    var command = commands.get(commandName);
    const send = global.send;
    const replyAD = "mode - only bot admin can use bot";
    const notApproved = `this box is not approved.\nuse "${PREFIX}request" to send a approval request from bot operators`;

    // ==== BOT ON/OFF STATUS READ ====
    const botStatusData = await readBotStatus();
    const botIsOn = botStatusData.status === "on";

    // --- Bot OFF হলে শুধু -boton এবং -botoff কমান্ড কাজ করবে ---
    if (!botIsOn) {
      if (commandName !== `${PREFIX}boton` && commandName !== `${PREFIX}botoff`) {
        return;
      }
    }

    // ==== লিংক প্রটেকশন ফিচার ====
    if (isGroup) {
      let warnData = loadWarnData();
      if (warnData.status === "true" && containsGroupLink(body)) {
        try {
          // মেসেজ ডিলিট করো
          await api.unsendMessage(messageID);

          // warn সংখ্যা আপডেট করো
          if (!warnData.warns[threadID]) warnData.warns[threadID] = {};
          if (!warnData.warns[threadID][senderID]) warnData.warns[threadID][senderID] = 0;
          warnData.warns[threadID][senderID] += 1;

          const warnCount = warnData.warns[threadID][senderID];

          // warnData.json এ লিখে রাখো
          saveWarnData(warnData);

          // warn অনুযায়ী রিপ্লাই ও কিক করো
          if (warnCount === 1) {
            return api.sendMessage(`⚠️ সতর্কতা #১: আপনি এই গ্রুপে অন্য গ্রুপের লিংক শেয়ার করতে পারবেন না। দয়া করে বিরত থাকুন।`, threadID);
          } else if (warnCount === 2) {
            return api.sendMessage(`⚠️ সতর্কতা #২: আপনি আবারো অন্য গ্রুপের লিংক শেয়ার করেছেন। এটি শেষ সতর্কতা।`, threadID);
          } else if (warnCount >= 3) {
            await api.sendMessage(`❌ আপনি ৩ বার গ্রুপ লিংক শেয়ার করার জন্য গ্রুপ থেকে বের করে দেওয়া হল।`, threadID);
            await api.removeUserFromGroup(senderID, threadID);
            warnData.warns[threadID][senderID] = 0;
            saveWarnData(warnData);
            return;
          }
        } catch (e) {
          logger.err("Link protection error: " + e);
        }
      }

      // -togglelinkprotection কমান্ড হ্যান্ডলিং
      if (body && body.toLowerCase() === `${PREFIX}togglelinkprotection`) {
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          const isAdmin = threadInfo.adminIDs.some((admin) => admin.id == senderID);
          if (!isAdmin) {
            return api.sendMessage("এই কমান্ডটি শুধুমাত্র গ্রুপ অ্যাডমিনরা ব্যবহার করতে পারবেন।", threadID);
          }

          warnData.status = warnData.status === "true" ? "false" : "true";
          saveWarnData(warnData);
          return api.sendMessage(
            `লিংক প্রোটেকশন সিস্টেম ${warnData.status === "true" ? "চালু" : "বন্ধ"} করা হয়েছে।`,
            threadID
          );
        } catch (e) {
          logger.err("Failed to toggle link protection: " + e);
          return api.sendMessage("গ্রুপের তথ্য আনতে সমস্যা হয়েছে।", threadID);
        }
      }
    }

    // ==== BOT ON/OFF COMMANDS HANDLE ====
    if (commandName === `${PREFIX}boton` || commandName === `${PREFIX}botoff`) {
      if (!ADMINBOT.includes(senderID) && !OWNER.includes(senderID) && !OPERATOR.includes(senderID)) {
        return api.sendMessage("Only bot admins can use this command.", threadID, messageID);
      }
      if (commandName === `${PREFIX}boton`) {
        await writeBotStatus("on");
        return api.sendMessage("Bot is now ON ✅", threadID, messageID);
      } else if (commandName === `${PREFIX}botoff`) {
        await writeBotStatus("off");
        return api.sendMessage("Bot is now OFF ❌", threadID, messageID);
      }
    }

    // ---- Approval request handling ----
    if (typeof body === "string" && body.startsWith(`${PREFIX}request`) && approval) {
      if (APPROVED.includes(threadID)) {
        return api.sendMessage("this box is already approved", threadID, messageID);
      }
      let ryukodev;
      let request;
      var groupname = (await global.data.threadInfo.get(threadID).threadName) || "name does not exist";
      ryukodev = `group name : ${groupname}\ngroup id : ${threadID}`;
      request = `${groupname} group is requesting for approval`;
      try {
        send("box approval request", request + "\n\n" + ryukodev);
        api.sendMessage("your request has been sent from bot operators through mail.", threadID, messageID);
      } catch (error) {
        logger.err(error);
      }
    }

    // Approval চেক
    if (
      command &&
      command.config.name.toLowerCase() === commandName.toLowerCase() &&
      !APPROVED.includes(threadID) &&
      !OPERATOR.includes(senderID) &&
      !OWNER.includes(senderID) &&
      !ADMINBOT.includes(senderID) &&
      approval
    ) {
      return api.sendMessage(notApproved, threadID, async (err, info) => {
        await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      });
    }
    if (
      typeof body === "string" &&
      body.startsWith(PREFIX) &&
      !APPROVED.includes(threadID) &&
      !OPERATOR.includes(senderID) &&
      !OWNER.includes(senderID) &&
      !ADMINBOT.includes(senderID) &&
      approval
    ) {
      return api.sendMessage(notApproved, threadID, async (err, info) => {
        await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
        return api.unsendMessage(info.messageID);
      });
    }

    // adminOnly চেক
    if (
      command &&
      command.config.name.toLowerCase() === commandName.toLowerCase() &&
      !ADMINBOT.includes(senderID) &&
      !OPERATOR.includes(senderID) &&
      adminOnly &&
      senderID !== api.getCurrentUserID()
    ) {
      return api.sendMessage(replyAD, threadID, messageID);
    }
    if (
      typeof body === "string" &&
      body.startsWith(PREFIX) &&
      !ADMINBOT.includes(senderID) &&
      adminOnly &&
      senderID !== api.getCurrentUserID()
    ) {
      return api.sendMessage(replyAD, threadID, messageID);
    }

    // banned user/thread চেক
    if (
      (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox == ![] && senderID == threadID)) &&
      !ADMINBOT.includes(senderID.toString()) &&
      !OWNER.includes(senderID.toString()) &&
      !OPERATOR.includes(senderID.toString())
    ) {
      if (command && command.config.name.toLowerCase() === commandName.toLowerCase() && userBanned.has(senderID)) {
        const { reason, dateAdded } = userBanned.get(senderID) || {};
        return api.sendMessage(
          `you're unable to use bot\nreason : ${reason}\ndate banned : ${dateAdded}`,
          threadID,
          async (err, info) => {
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          },
          messageID
        );
      } else if (command && command.config.name.toLowerCase() === commandName.toLowerCase() && threadBanned.has(threadID)) {
        const { reason, dateAdded } = threadBanned.get(threadID) || {};
        return api.sendMessage(
          global.getText("handleCommand", "threadBanned", reason, dateAdded),
          threadID,
          async (err, info) => {
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          },
          messageID
        );
      }
      if (typeof body === "string" && body.startsWith(PREFIX) && userBanned.has(senderID)) {
        const { reason, dateAdded } = userBanned.get(senderID) || {};
        return api.sendMessage(
          `you're unable to use bot\nreason : ${reason}\ndate banned : ${dateAdded}`,
          threadID,
          async (err, info) => {
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          },
          messageID
        );
      } else if (typeof body === "string" && body.startsWith(PREFIX) && threadBanned.has(threadID)) {
        const { reason, dateAdded } = threadBanned.get(threadID) || {};
        return api.sendMessage(
          global.getText("handleCommand", "threadBanned", reason, dateAdded),
          threadID,
          async (err, info) => {
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          },
          messageID
        );
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
          return api.sendMessage(
            global.getText("handleCommand", "commandNotExist", checker.bestMatch.target),
            threadID,
            messageID
          );
        }
      }
    }

    // command banned check
    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!ADMINBOT.includes(senderID) && !OPERATOR.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [];
        const banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name)) {
          return api.sendMessage(
            global.getText("handleCommand", "commandThreadBanned", command.config.name),
            threadID,
            async (err, info) => {
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          );
        }
        if (banUsers.includes(command.config.name)) {
          return api.sendMessage(
            global.getText("handleCommand", "commandUserBanned", command.config.name),
            threadID,
            async (err, info) => {
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          );
        }
      }
    }

    // premium user check
    const premium = global.config.premium;
    const premiumlists = global.premium.PREMIUMUSERS;
    if (premium && command && command.config && command.config.premium && !premiumlists.includes(senderID)) {
      return api.sendMessage(
        `the command you used is only for premium users. If you want to use it, you can contact the admins and operators of the bot or you can type ${PREFIX}requestpremium.`,
        event.threadID,
        async (err, eventt) => {
          if (err) return;
          await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
          return api.unsendMessage(eventt.messageID);
        },
        event.messageID
      );
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
      if (typeof command.config.prefix === "undefined") {
        api.sendMessage(global.getText("handleCommand", "noPrefix", command.config.name), event.threadID, event.messageID);
        return;
      }
    }

    // NSFW category check
    if (
      command &&
      command.config &&
      command.config.category &&
      command.config.category.toLowerCase() === "nsfw" &&
      !global.data.threadAllowNSFW.includes(threadID) &&
      !ADMINBOT.includes(senderID)
    ) {
      return api.sendMessage(
        global.getText("handleCommand", "threadNotAllowNSFW"),
        threadID,
        async (err, info) => {
          await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
          return api.unsendMessage(info.messageID);
        },
        messageID
      );
    }

    // thread info load
    var threadInfo2;
    if (event.isGroup) {
      try {
        threadInfo2 = threadInfo.get(threadID) || (await Threads.getInfo(threadID));
        if (Object.keys(threadInfo2).length === 0) throw new Error();
      } catch (err) {
        logger(global.getText("handleCommand", "cantGetInfoThread", "error"));
      }
    }

    // permission calculation
    var permssion = 0;
    var threadInfoo = threadInfo.get(threadID) || (await Threads.getInfo(threadID));
    const Find = threadInfoo.adminIDs.find((el) => el.id == senderID);
    const ryuko = !OPERATOR.includes(senderID);
    if (OPERATOR.includes(senderID.toString())) permssion = 3;
    else if (OWNER.includes(senderID.toString())) permssion = 4;
    else if (ADMINBOT.includes(senderID.toString())) permssion = 2;
    else if (!ADMINBOT.includes(senderID) && ryuko && Find) permssion = 1;

    // permission check
    const requiredPermission = command && command.config && typeof command.config.permission === "number" ? command.config.permission : 0;
    if (command && command.config && requiredPermission > permssion) {
      return api.sendMessage(
        global.getText("handleCommand", "permissionNotEnough", command.config.name),
        event.threadID,
        event.messageID
      );
    }

    // cooldowns initialization
    if (command && command.config && !client.cooldowns.has(command.config.name)) {
      client.cooldowns.set(command.config.name, new Map());
    }

    // cooldowns check
    const timestamps = command && command.config ? client.cooldowns.get(command.config.name) : undefined;
    const expirationTime = (command && command.config && command.config.cooldowns || 1) * 1000;
    if (timestamps && timestamps instanceof Map && timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
      return api.setMessageReaction("🕚", event.messageID, (err) => (err ? logger("An error occurred while executing setMessageReaction", 2) : ""), true);
    }

    // getText helper
    var getText2;
    if (command && command.languages && typeof command.languages === "object" && command.languages.hasOwnProperty(global.config.language)) {
      getText2 = (...values) => {
        var lang = command.languages[global.config.language][values[0]] || "";
        for (var i = values.length; i > 0; i--) {
          const expReg = RegExp("%" + i, "g");
          lang = lang.replace(expReg, values[i]);
        }
        return lang;
      };
    } else getText2 = () => {};

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
        getText: getText2,
      };

      if (command && typeof command.run === "function") {
        command.run(Obj);
        timestamps.set(senderID, dateNow);

        if (developermode == true) {
          logger(
            global.getText("handleCommand", "executeCommand", time, commandName, senderID, threadID, args.join(" "), Date.now() - dateNow) + "\n",
            "command"
          );
        }

        return;
      }
    } catch (e) {
      return api.sendMessage(global.getText("handleCommand", "commandError", commandName, e), threadID);
    }
  };
};
