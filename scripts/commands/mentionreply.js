module.exports.config = {
  name: "mentionreply",
  version: "1.0.0",
  permission: 0,
  credits: "Shakib",
  description: "Reply when someone writes @ in message",
  prefix: false,
  category: "auto",
};

module.exports.run = async function({ api, event }) {
  const { threadID, body } = event;

  if (!body) return;

  // যদি @ থাকে
  if (body.includes("@")) {
    await api.sendMessage("😎 কারে ডাক দিলা? আমি এখানে আছি!", threadID);
  }
};
