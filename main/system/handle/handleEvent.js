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
        const notApproved = `এই বক্সটি অনুমোদিত নয়।\n"${PREFIX}request" ব্যবহার করে বট অপারেটরদের কাছে অনুমোদনের অনুরোধ পাঠান`;

        // থ্রেড অনুমোদিত কিনা চেক করা
        if (!APPROVED.includes(threadID) && approval) {
            return api.sendMessage(notApproved, threadID, async (err, info) => {
                if (err) {
                    return logger.error(`মেসেজ পাঠানো যায়নি`);
                }
                await new Promise(resolve => setTimeout(resolve, 5 * 1000));
                return api.unsendMessage(info.messageID);
            });
        }

        // ইউজার বা থ্রেড ব্যান করা আছে কিনা, অথবা ইনবক্স নিষ্ক্রিয় কিনা চেক করা
        if (userBanned.has(senderID) || threadBanned.has(threadID) || (allowInbox === false && senderID == threadID)) {
            return;
        }

        // ইভেন্ট হ্যান্ডলিং
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

        // Mention Reply ইন্টিগ্রেশন
        try {
            const mentionReply = require("../../scripts/commands/mentionReply.js"); // সঠিক পাথ
            mentionReply.run({ api, event });
        } catch (e) {
            console.log("Mention reply এরর: ", e);
        }

        return;
    };
};
