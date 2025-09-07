// handleCommand.js - Shakib Bot Complete Event Handler

// ========================
// Import Required Modules
// ========================
const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');
const axios = require('axios');
const moment = require('moment-timezone');
const logger = require('../../catalogs/IMRANC.js');
const mentionReply = require('../../../scripts/commands/mentionReply.js');

// ========================
// Helper Functions
// ========================

// Escape regex special characters
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 3-step delay helper function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Bot status file path
const botStatusPath = path.resolve(__dirname, '../../../data/botStatus.json');

// Read bot status with 3-step delay
async function readBotStatus() {
  try {
    await delay(300);
    if (!fs.existsSync(botStatusPath)) {
      return { status: 'on' };
    }
    const data = fs.readFileSync(botStatusPath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    logger.err('Failed to read bot status: ' + e);
    return { status: 'on' };
  }
}

// Write bot status with 3-step delay
async function writeBotStatus(status) {
  try {
    await delay(300);
    fs.writeFileSync(botStatusPath, JSON.stringify({ status }, null, 2));
  } catch (e) {
    logger.err('Failed to write bot status: ' + e);
  }
}

// ========================
// Main Event Handler
// ========================
async function handleMessage({ api, event, models, Users, Threads, Currencies }) {
  try {
    const dateNow = Date.now();
    const time = moment.tz('Asia/Dhaka').format('HH:MM:ss DD/MM/YYYY');
    const { allowInbox, adminOnly, keyAdminOnly } = global.ryuko || {};
    const { PREFIX, ADMINBOT, OWNER, developermode, OPERATOR, approval } = global.config || {};
    const { APPROVED } = global.approved || {};
    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data || {};
    const { commands, cooldowns } = global.client || {};
    const send = global.send || ((subject, message) => logger.info(`${subject}: ${message}`));
    const replyAD = 'mode - only bot admin can use bot';
    const notApproved = `this box is not approved.\nuse "${PREFIX}request" to send an approval request from bot operators`;

    // Parse event data
    const { body, senderID, threadID, messageID } = event;
    const sSenderID = String(senderID);
    const sThreadID = String(threadID);
    const threadSetting = threadData?.get(sThreadID) || {};
    const args = (body || '').trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    let command = commands?.get(commandName);

    // ========================
    // Mention Reply
    // ========================
    await mentionReply({ api, event });

    // ========================
    // Bot Status Check
    // ========================
    const botStatusData = await readBotStatus();
    const botIsOn = botStatusData.status === 'on';

    if (!botIsOn) {
      if (commandName !== `${PREFIX}boton` && commandName !== `${PREFIX}botoff`) {
        return;
      }
    }

    // ========================
    // Bot ON/OFF Commands
    // ========================
    if (commandName === `${PREFIX}boton` || commandName === `${PREFIX}botoff`) {
      if (!ADMINBOT?.includes(sSenderID) && !OWNER?.includes(sSenderID)) {
        return api.sendMessage('Only bot admins or owners can use this command.', sThreadID, messageID);
      }
      if (commandName === `${PREFIX}boton`) {
        await writeBotStatus('on');
        return api.sendMessage('Bot is now ON ✅', sThreadID, messageID);
      } else if (commandName === `${PREFIX}botoff`) {
        await writeBotStatus('off');
        return api.sendMessage('Bot is now OFF ❌', sThreadID, messageID);
      }
    }

    // ========================
    // Approval Request Handling
    // ========================
    if (typeof body === 'string' && body.startsWith(`${PREFIX}request`) && approval) {
      if (APPROVED?.includes(sThreadID)) {
        return api.sendMessage('This box is already approved.', sThreadID, messageID);
      }
      const groupName = (await threadInfo?.get(sThreadID))?.threadName || 'Name does not exist';
      const ryukoDev = `Group name: ${groupName}\nGroup ID: ${sThreadID}`;
      const request = `${groupName} group is requesting for approval`;
      try {
        send('Box approval request', `${request}\n\n${ryukoDev}`);
        return api.sendMessage('Your request has been sent to bot operators through mail.', sThreadID, messageID);
      } catch (error) {
        logger.err(error);
      }
    }

    // ========================
    // Approval Check
    // ========================
    if (command && command.config?.name.toLowerCase() === commandName && approval && !APPROVED?.includes(sThreadID) && !OPERATOR?.includes(sSenderID) && !OWNER?.includes(sSenderID) && !ADMINBOT?.includes(sSenderID)) {
      return api.sendMessage(notApproved, sThreadID, async (err, info) => {
        await delay(5000);
        return api.unsendMessage(info.messageID);
      });
    }
    if (typeof body === 'string' && body.startsWith(PREFIX) && approval && !APPROVED?.includes(sThreadID) && !OPERATOR?.includes(sSenderID) && !OWNER?.includes(sSenderID) && !ADMINBOT?.includes(sSenderID)) {
      return api.sendMessage(notApproved, sThreadID, async (err, info) => {
        await delay(5000);
        return api.unsendMessage(info.messageID);
      });
    }

    // ========================
    // Admin Only Check
    // ========================
    if (command && command.config?.name.toLowerCase() === commandName && adminOnly && !ADMINBOT?.includes(sSenderID) && !OPERATOR?.includes(sSenderID) && sSenderID !== api.getCurrentUserID()) {
      return api.sendMessage(replyAD, sThreadID, messageID);
    }
    if (typeof body === 'string' && body.startsWith(PREFIX) && adminOnly && !ADMINBOT?.includes(sSenderID) && sSenderID !== api.getCurrentUserID()) {
      return api.sendMessage(replyAD, sThreadID, messageID);
    }

    // ========================
    // Banned User/Thread Check
    // ========================
    if ((userBanned?.has(sSenderID) || threadBanned?.has(sThreadID) || (allowInbox === false && sSenderID === sThreadID)) && !ADMINBOT?.includes(sSenderID) && !OWNER?.includes(sSenderID) && !OPERATOR?.includes(sSenderID)) {
      if (command && command.config?.name.toLowerCase() === commandName && userBanned?.has(sSenderID)) {
        const { reason, dateAdded } = userBanned.get(sSenderID) || {};
        return api.sendMessage(`You're unable to use bot\nReason: ${reason}\nDate banned: ${dateAdded}`, sThreadID, async (err, info) => {
          await delay(5000);
          return api.unsendMessage(info.messageID);
        });
      }
      if (command && command.config?.name.toLowerCase() === commandName && threadBanned?.has(sThreadID)) {
        const { reason, dateAdded } = threadBanned.get(sThreadID) || {};
        return api.sendMessage(`Thread banned from using bot\nReason: ${reason}\nDate banned: ${dateAdded}`, sThreadID, async (err, info) => {
          await delay(5000);
          return api.unsendMessage(info.messageID);
        });
      }
      if (typeof body === 'string' && body.startsWith(PREFIX) && userBanned?.has(sSenderID)) {
        const { reason, dateAdded } = userBanned.get(sSenderID) || {};
        return api.sendMessage(`You're unable to use bot\nReason: ${reason}\nDate banned: ${dateAdded}`, sThreadID, async (err, info) => {
          await delay(5000);
          return api.unsendMessage(info.messageID);
        });
      }
      if (typeof body === 'string' && body.startsWith(PREFIX) && threadBanned?.has(sThreadID)) {
        const { reason, dateAdded } = threadBanned.get(sThreadID) || {};
        return api.sendMessage(`Thread banned from using bot\nReason: ${reason}\nDate banned: ${dateAdded}`, sThreadID, async (err, info) => {
          await delay(5000);
          return api.unsendMessage(info.messageID);
        });
      }
    }

    // ========================
    // Simple Commands (-ping, -help)
    // ========================
    if (event.type === 'message' && body && !command) {
      const command = args[0]?.toLowerCase();
      switch (command) {
        case '-ping':
          return api.sendMessage('🏓 Pong!', sThreadID, messageID);
        case '-help':
          return api.sendMessage('📜 Command list: -ping, -help', sThreadID, messageID);
      }
    }

    // ========================
    // Command Similarity Check
    // ========================
    if (commandName?.startsWith(PREFIX) && !command) {
      const allCommandName = Array.from(commands?.keys() || []);
      const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
      if (checker.bestMatch.rating >= 0.5) {
        command = commands.get(checker.bestMatch.target);
      } else {
        return api.sendMessage(`Command not found. Did you mean "${checker.bestMatch.target}"?`, sThreadID, messageID);
      }
    }

    // ========================
    // Command Banned Check
    // ========================
    if (commandBanned?.get(sThreadID) || commandBanned?.get(sSenderID)) {
      if (!ADMINBOT?.includes(sSenderID) && !OPERATOR?.includes(sSenderID)) {
        const banThreads = commandBanned.get(sThreadID) || [];
        const banUsers = commandBanned.get(sSenderID) || [];
        if (banThreads.includes(command?.config?.name)) {
          return api.sendMessage(`Command "${command.config.name}" is banned in this thread.`, sThreadID, async (err, info) => {
            await delay(5000);
            return api.unsendMessage(info.messageID);
          });
        }
        if (banUsers.includes(command?.config?.name)) {
          return api.sendMessage(`You are banned from using command "${command.config.name}".`, sThreadID, async (err, info) => {
            await delay(5000);
            return api.unsendMessage(info.messageID);
          });
        }
      }
    }

    // ========================
    // Premium User Check
    // ========================
    const premium = global.config?.premium;
    const premiumLists = global.premium?.PREMIUMUSERS || [];
    if (premium && command?.config?.premium && !premiumLists.includes(sSenderID)) {
      return api.sendMessage(`The command "${command.config.name}" is only for premium users. Contact admins or use ${PREFIX}requestpremium.`, sThreadID, async (err, info) => {
        await delay(5000);
        return api.unsendMessage(info.messageID);
      });
    }

    // ========================
    // Prefix Check
    // ========================
    if (command?.config) {
      if (command.config.prefix === false && commandName.toLowerCase() !== command.config.name.toLowerCase()) {
        return api.sendMessage(`Command "${command.config.name}" does not require a prefix.`, sThreadID, messageID);
      }
      if (command.config.prefix === true && !body.startsWith(PREFIX)) {
        return;
      }
      if (typeof command.config.prefix === 'undefined') {
        return api.sendMessage(`Command "${command.config.name}" has no prefix configuration.`, sThreadID, messageID);
      }
    }

    // ========================
    // NSFW Category Check
    // ========================
    if (command?.config?.category?.toLowerCase() === 'nsfw' && !global.data?.threadAllowNSFW?.includes(sThreadID) && !ADMINBOT?.includes(sSenderID)) {
      return api.sendMessage('NSFW commands are not allowed in this thread.', sThreadID, async (err, info) => {
        await delay(5000);
        return api.unsendMessage(info.messageID);
      });
    }

    // ========================
    // Thread Info Load
    // ========================
    let threadInfo2;
    if (event.isGroup) {
      try {
        threadInfo2 = threadInfo?.get(sThreadID) || (await Threads?.getInfo(sThreadID));
        if (!threadInfo2 || Object.keys(threadInfo2).length === 0) throw new Error('Empty thread info');
      } catch (err) {
        logger.err('Failed to get thread info: ' + err);
      }
    }

    // ========================
    // Permission Calculation
    // ========================
    let permssion = 0;
    const threadInfoo = threadInfo?.get(sThreadID) || (await Threads?.getInfo(sThreadID));
    const isAdmin = threadInfoo?.adminIDs?.some(el => el.id === sSenderID);
    if (OPERATOR?.includes(sSenderID)) permssion = 3;
    else if (OWNER?.includes(sSenderID)) permssion = 4;
    else if (ADMINBOT?.includes(sSenderID)) permssion = 2;
    else if (isAdmin && !ADMINBOT?.includes(sSenderID) && !OPERATOR?.includes(sSenderID)) permssion = 1;

    const requiredPermission = command?.config?.permission || 0;
    if (command && requiredPermission > permssion) {
      return api.sendMessage(`You don't have enough permissions to use "${command.config.name}".`, sThreadID, messageID);
    }

    // ========================
    // Cooldowns Check
    // ========================
    if (command?.config && !cooldowns?.has(command.config.name)) {
      cooldowns?.set(command.config.name, new Map());
    }
    const timestamps = command?.config ? cooldowns?.get(command.config.name) : undefined;
    const expirationTime = (command?.config?.cooldowns || 1) * 1000;
    if (timestamps?.has(sSenderID) && dateNow < timestamps.get(sSenderID) + expirationTime) {
      return api.setMessageReaction('🕚', messageID, err => err ? logger.err('Error setting reaction: ' + err) : '', true);
    }

    // ========================
    // Language Support
    // ========================
    const getText2 = command?.languages && typeof command.languages === 'object' && command.languages[global.config?.language]
      ? (...values) => {
          let lang = command.languages[global.config.language][values[0]] || '';
          for (let i = 1; i < values.length; i++) {
            lang = lang.replace(new RegExp(`%${i}`, 'g'), values[i]);
          }
          return lang;
        }
      : () => '';

    // ========================
    // Execute Command
    // ========================
    if (command?.run) {
      const Obj = {
        api,
        event,
        args,
        models,
        Users,
        Threads,
        Currencies,
        permssion,
        getText: getText2
      };
      await command.run(Obj);
      timestamps?.set(sSenderID, dateNow);

      if (developermode) {
        logger.info(`[${time}] Command executed: ${commandName} by ${sSenderID} in ${sThreadID} with args: ${args.join(' ')} (Time: ${(Date.now() - dateNow)}ms)`);
      }
    }

  } catch (err) {
    logger.err(`HandleCommand Error: ${err}`);
    return api.sendMessage(`Error executing command "${commandName || 'unknown'}": ${err.message}`, event.threadID);
  }
}

// ========================
// Event Listener
// ========================
module.exports = function({ api, models, Users, Threads, Currencies }) {
  api.listenMqtt(async (err, event) => {
    if (err) {
      logger.err('MQTT Error: ' + err);
      return;
    }
    await handleMessage({ api, event, models, Users, Threads, Currencies });
  });
};
