const fs = require("fs");
const path = require("path");

module.exports = function ({ api, models, Users, Threads, Currencies }) {
  const stringSimilarity = require("string-similarity"),
    escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    logger = require("../../catalogs/IMRANC.js");
  const axios = require("axios");
  const moment = require("moment-timezone");

  // Path to botStatus.json
  const botStatusPath = path.resolve(__dirname, "../../../data/botStatus.json");

  // 3-step delay helper function
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Async function to read bot status with 3-step delay
  async function readBotStatus() {
    try {
      await delay(300); // 300ms delay
      if (!fs.existsSync(botStatusPath)) {
        return { status: "on" }; // Default to "on" if file doesn't exist
      }
      const data = fs.readFileSync(botStatusPath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      logger.err("Failed to read bot status: " + e);
      return { status: "on" };
    }
  }

  // Async function to write bot status with 3-step delay
  async function writeBotStatus(status) {
    try {
      await delay(300); // 300ms delay
      fs.writeFileSync(botStatusPath, JSON.stringify({ status: status }, null, 2));
    } catch (e) {
      logger.err("Failed to write bot status: " + e);
    }
  }

  return async function ({ event }) {
    try {
      const dateNow = Date.now();
      const time = moment.tz("Asia/Dhaka").format("HH:MM:ss DD/MM/YYYY");
      const { allowInbox, adminOnly, keyAdminOnly } = global.ryuko || {};
      const { PREFIX = "-", ADMINBOT = [], OWNER = [], developermode = false, OPERATOR = [], approval = false } = global.config || {};
      const { APPROVED = [], PREMIUMUSERS = [] } = global.approved || {};
      const { userBanned = new Map(), threadBanned = new Map(), threadInfo = new Map(), threadData = new Map(), commandBanned = new Map() } = global.data || {};
      const { commands = new Map(), cooldowns = new Map() } = global.client || {};
      const premium = global.config?.premium || false;

      const { body, senderID, threadID, messageID } = event;
      if (!body) return;

      // Convert senderID and threadID to strings
      const sSenderID = String(senderID);
      const sThreadID = String(threadID);

      // ==========================
      // 🔥 Mention Reply System 🔥
      // ==========================
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        return api.sendMessage("😎 কারে মেনশন দিছো ভাই?", sThreadID, messageID);
      }

      if (body.toLowerCase().includes("shakib")) {
        return api.sendMessage("👀 কিরে আমাকে ডাকলি নাকি? 😏", sThreadID, messageID);
      }

      // ==========================
      // 🔥 Bot Status Check 🔥
      // ==========================
      const botStatusData = await readBotStatus();
      const botIsOn = botStatusData.status === "on";

      // If bot is OFF, only allow -boton and -botoff commands
      if (!botIsOn) {
        if (body.toLowerCase() !== `${PREFIX}boton` && body.toLowerCase() !== `${PREFIX}botoff`) {
          return;
        }
      }

      const args = body.trim().split(/ +/);
      const commandName = args.shift()?.toLowerCase();
      let command = commands.get(commandName);

      // ==========================
      // 🔥 Dynamic Command Loading 🔥
      // ==========================
      if (!command && body.startsWith(PREFIX)) {
        const commandPath = path.join(__dirname, "../../scripts/commands", `${commandName}.js`);
        if (fs.existsSync(commandPath)) {
          try {
            command = require(commandPath);
          } catch (err) {
            logger.err(`Failed to load command ${commandName}: ${err}`);
          }
        }
      }

      // ==========================
      // 🔥 Bot ON/OFF Commands 🔥
      // ==========================
      if (body.toLowerCase() === `${PREFIX}boton` || body.toLowerCase() === `${PREFIX}botoff`) {
        if (!ADMINBOT.includes(sSenderID) && !OWNER.includes(sSenderID) && !OPERATOR.includes(sSenderID)) {
          return api.sendMessage("Only bot admins can use this command.", sThreadID, messageID);
        }
        if (body.toLowerCase() === `${PREFIX}boton`) {
          await writeBotStatus("on");
          return api.sendMessage("Bot is now ON ✅", sThreadID, messageID);
        } else if (body.toLowerCase() === `${PREFIX}botoff`) {
          await writeBotStatus("off");
          return api.sendMessage("Bot is now OFF ❌", sThreadID, messageID);
        }
      }

      // ==========================
      // 🔥 Approval Request Handling 🔥
      // ==========================
      if (typeof body === "string" && body.startsWith(`${PREFIX}request`) && approval) {
        if (APPROVED.includes(sThreadID)) {
          return api.sendMessage("This box is already approved", sThreadID, messageID);
        }
        let ryukodev;
        let request;
        const groupname = (await threadInfo.get(sThreadID)?.threadName) || "name does not exist";
        ryukodev = `group name: ${groupname}\ngroup id: ${sThreadID}`;
        request = `${groupname} group is requesting for approval`;
        try {
          global.send("box approval request", request + "\n\n" + ryukodev);
          api.sendMessage("Your request has been sent to bot operators through mail.", sThreadID, messageID);
        } catch (error) {
          logger.err(error);
        }
        return;
      }

      // ==========================
      // 🔥 Approval Check 🔥
      // ==========================
      if (command && approval && !APPROVED.includes(sThreadID) && !OPERATOR.includes(sSenderID) && !OWNER.includes(sSenderID) && !ADMINBOT.includes(sSenderID)) {
        return api.sendMessage(
          `This box is not approved.\nUse "${PREFIX}request" to send an approval request from bot operators`,
          sThreadID,
          async (err, info) => {
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }
        );
      }
      if (typeof body === "string" && body.startsWith(PREFIX) && approval && !APPROVED.includes(sThreadID) && !OPERATOR.includes(sSenderID) && !OWNER.includes(sSenderID) && !ADMINBOT.includes(sSenderID)) {
        return api.sendMessage(
          `This box is not approved.\nUse "${PREFIX}request" to send an approval request from bot operators`,
          sThreadID,
          async (err, info) => {
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          }
        );
      }

      // ==========================
      // 🔥 Admin Only Check 🔥
      // ==========================
      if (command && adminOnly && !ADMINBOT.includes(sSenderID) && !OPERATOR.includes(sSenderID) && sSenderID !== api.getCurrentUserID()) {
        return api.sendMessage("Mode - only bot admin can use bot", sThreadID, messageID);
      }
      if (typeof body === "string" && body.startsWith(PREFIX) && adminOnly && !ADMINBOT.includes(sSenderID) && sSenderID !== api.getCurrentUserID()) {
        return api.sendMessage("Mode - only bot admin can use bot", sThreadID, messageID);
      }

      // ==========================
      // 🔥 Banned User/Thread Check 🔥
      // ==========================
      if ((userBanned.has(sSenderID) || threadBanned.has(sThreadID) || (allowInbox === false && sSenderID === sThreadID)) && !ADMINBOT.includes(sSenderID) && !OWNER.includes(sSenderID) && !OPERATOR.includes(sSenderID)) {
        if (userBanned.has(sSenderID)) {
          const { reason, dateAdded } = userBanned.get(sSenderID) || {};
          return api.sendMessage(
            `You're unable to use bot\nReason: ${reason}\nDate banned: ${dateAdded}`,
            sThreadID,
            async (err, info) => {
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          );
        }
        if (threadBanned.has(sThreadID)) {
          const { reason, dateAdded } = threadBanned.get(sThreadID) || {};
          return api.sendMessage(
            `Thread banned\nReason: ${reason}\nDate banned: ${dateAdded}`,
            sThreadID,
            async (err, info) => {
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            },
            messageID
          );
        }
      }

      // ==========================
      // 🔥 Command Similarity Check 🔥
      // ==========================
      if (body.startsWith(PREFIX) && !command) {
        const allCommandName = Array.from(commands.keys());
        const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
        if (checker.bestMatch.rating >= 0.5) {
          command = commands.get(checker.bestMatch.target);
        } else {
          return api.sendMessage(
            `Command "${commandName}" does not exist. Did you mean "${checker.bestMatch.target}"?`,
            sThreadID,
            messageID
          );
        }
      }

      // ==========================
      // 🔥 Command Banned Check 🔥
      // ==========================
      if (command && (commandBanned.get(sThreadID) || commandBanned.get(sSenderID))) {
        if (!ADMINBOT.includes(sSenderID) && !OPERATOR.includes(sSenderID)) {
          const banThreads = commandBanned.get(sThreadID) || [];
          const banUsers = commandBanned.get(sSenderID) || [];
          if (banThreads.includes(command.config?.name)) {
            return api.sendMessage(
              `Command ${command.config.name} is banned in this thread`,
              sThreadID,
              async (err, info) => {
                await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
                return api.unsendMessage(info.messageID);
              },
              messageID
            );
          }
          if (banUsers.includes(command.config?.name)) {
            return api.sendMessage(
              `Command ${command.config.name} is banned for this user`,
              sThreadID,
              async (err, info) => {
                await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
                return api.unsendMessage(info.messageID);
              },
              messageID
            );
          }
        }
      }

      // ==========================
      // 🔥 Premium User Check 🔥
      // ==========================
      if (premium && command && command.config?.premium && !PREMIUMUSERS.includes(sSenderID)) {
        return api.sendMessage(
          `The command you used is only for premium users. Contact admins or use ${PREFIX}requestpremium.`,
          sThreadID,
          async (err, info) => {
            if (!err) {
              await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
              return api.unsendMessage(info.messageID);
            }
          },
          messageID
        );
      }

      // ==========================
      // 🔥 Prefix Check 🔥
      // ==========================
      if (command && command.config) {
        if (command.config.prefix === false && commandName.toLowerCase() !== command.config.name.toLowerCase()) {
          return api.sendMessage(`Command must be used without prefix: ${command.config.name}`, sThreadID, messageID);
        }
        if (command.config.prefix === true && !body.startsWith(PREFIX)) {
          return;
        }
        if (typeof command.config.prefix === "undefined") {
          return api.sendMessage(`No prefix configuration for ${command.config.name}`, sThreadID, messageID);
        }
      }

      // ==========================
      // 🔥 NSFW Category Check 🔥
      // ==========================
      if (command && command.config?.category?.toLowerCase() === "nsfw" && !global.data.threadAllowNSFW.includes(sThreadID) && !ADMINBOT.includes(sSenderID)) {
        return api.sendMessage(
          "NSFW commands are not allowed in this thread",
          sThreadID,
          async (err, info) => {
            await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
            return api.unsendMessage(info.messageID);
          },
          messageID
        );
      }

      // ==========================
      // 🔥 Thread Info Load 🔥
      // ==========================
      let threadInfo2;
      if (event.isGroup) {
        try {
          threadInfo2 = threadInfo.get(sThreadID) || (await Threads.getInfo(sThreadID));
          if (Object.keys(threadInfo2).length === 0) throw new Error();
        } catch (err) {
          logger.err("Failed to get thread info: " + err);
        }
      }

      // ==========================
      // 🔥 Permission Calculation 🔥
      // ==========================
      let permssion = 0;
      const threadInfoo = threadInfo.get(sThreadID) || (await Threads.getInfo(sThreadID));
      const Find = threadInfoo.adminIDs?.find((el) => el.id === sSenderID);
      if (OPERATOR.includes(sSenderID)) permssion = 3;
      else if (OWNER.includes(sSenderID)) permssion = 4;
      else if (ADMINBOT.includes(sSenderID)) permssion = 2;
      else if (Find && !ADMINBOT.includes(sSenderID) && !OPERATOR.includes(sSenderID)) permssion = 1;

      // Permission check
      const requiredPermission = command && command.config && typeof command.config.permission === "number" ? command.config.permission : 0;
      if (command && requiredPermission > permssion) {
        return api.sendMessage(`You don't have enough permissions to use ${command.config.name}`, sThreadID, messageID);
      }

      // ==========================
      // 🔥 Cooldowns Check 🔥
      // ==========================
      if (command && command.config) {
        if (!cooldowns.has(command.config.name)) {
          cooldowns.set(command.config.name, new Map());
        }
        const timestamps = cooldowns.get(command.config.name);
        const expirationTime = (command.config.cooldowns || 1) * 1000;
        if (timestamps.has(sSenderID) && dateNow < timestamps.get(sSenderID) + expirationTime) {
          return api.setMessageReaction("🕚", messageID, (err) => (err ? logger.err("Error setting reaction: " + err) : ""), true);
        }
      }

      // ==========================
      // 🔥 getText Helper 🔥
      // ==========================
      let getText2;
      if (command && command.languages && typeof command.languages === "object" && command.languages.hasOwnProperty(global.config.language)) {
        getText2 = (...values) => {
          let lang = command.languages[global.config.language][values[0]] || "";
          for (let i = values.length; i > 0; i--) {
            const expReg = RegExp("%" + i, "g");
            lang = lang.replace(expReg, values[i]);
          }
          return lang;
        };
      } else {
        getText2 = () => {};
      }

      // ==========================
      // 🔥 Execute Command 🔥
      // ==========================
      if (command && typeof command.run === "function") {
        const Obj = {
          api,
          event,
          args,
          models,
          Users,
          Threads,
          Currencies,
          permssion,
          getText: getText2,
        };

        command.run(Obj);
        if (command.config) {
          cooldowns.get(command.config.name).set(sSenderID, dateNow);
        }

        if (developermode) {
          logger(
            `Executing command ${commandName} by ${sSenderID} in ${sThreadID} at ${time} with args: ${args.join(" ")} (took ${Date.now() - dateNow}ms)\n`,
            "command"
          );
        }
      }
    } catch (e) {
      logger.err(`Error executing command ${event.body?.split(/ +/)[0] || "unknown"}: ${e}`);
      return api.sendMessage(`Error executing command: ${e.message}`, event.threadID, event.messageID);
    }
  };
};
