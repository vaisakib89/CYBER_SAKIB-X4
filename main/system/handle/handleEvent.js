module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../catalogs/IMRANC.js");
    const moment = require("moment");
    return function ({ event }) {
        const timeStart = Date.now();
        const time = moment.tz("Asia/Dhaka").format("HH:MM:ss L");
        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { allowInbox } = global.ryuko;
        const { developermode, approval, PREFIX } = global.config;
        const { APPROVED } = global.approved;
        var { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);
        const notApproved = `this box is not approved.\nuse "${PREFIX}request" to send a approval request from bot operators`;

        // Check if thread is approved
        if (!APPROVED.includes(threadID) && approval) {
            return api.sendMessage(notApproved, threadID, async (err, info) => {
                if (err) {
                    return logger.error(`can't send the message`);
                }
                await new Promise(resolve => setTimeout(resolve, 5 * 1000));
                return api.unsendMessage(info.messageID);
            });
        }

        // Check if user or thread is banned, or inbox is disabled
        if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox === false && senderID == threadID)) {
            return;
        }

        // Handle events
        for (const [key, value] of events.entries()) {
            if (value.config.eventType.indexOf(event.logMessageType) !== -1) {
                const eventRun = events.get(key);
                try {
                    const Obj = {
                        api,
                        event,
                        models,
                        Users,
                        Threads,
                        Currencies
                    };
                    eventRun.run(Obj);
                    if (developermode === true) {
                        logger(global.getText('handleEvent', 'executeEvent', time, eventRun.config.name, threadID, Date.now() - timeStart) + '\n', 'event');
                    }
                } catch (error) {
                    logger(global.getText('handleEvent', 'eventError', eventRun.config.name, JSON.stringify(error)), "error");
                }
            }
        }

        // Mention Reply Integration
        try {
            const mentionReply = require("./command/mentionReply.js"); // Ensure correct path
            mentionReply.run({ api, event });
        } catch (e) {
            console.log("Mention reply error: ", e);
        }

        return;
    };
};
