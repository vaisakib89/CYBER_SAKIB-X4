# 🤖 SAKIB BOT V4

![Sakib Bot Logo](https://github.com/vaisakib89/CYBER_SAKIB-X4/blob/main/20250804_160709.png)

**🌟 Fully Customizable Facebook Messenger Bot**  
**Premium Features • Easy to Use • Built with ❤️ by Sakib Vai**

## 👤 ABOUT ME

- Name: ```SAKIB VAI```</br> 
- Age: ```20```</br>  
- Facebook: [Sakib Vai](https://www.facebook.com/s.a.k.i.b.tsu.863539)</br>

## 🚀 STARTUP

```bash
npm install

node main/catalogs/IMRANA.js

🛠️ CREDITS

Original Base: BotPack by YanMaglinte
Modified By: Sakib Vai & Ryuko</br>
Facebook Client: fca-ws3 by Kenneth Aceberos

✨ FEATURES

✅ Email notifications for box approval (configurable via Config.json)
🔧 Custom console logging (see configs/console.js)
🚫 Spam prevention in ban system
💎 Premium-only commands (enable with premium: true in command config)

⚙️ CONFIGURATION

File	Description

IMRAN.js	Auto restart and pending message handler
config.json	Bot name, prefix, admins, operators, etc.
appstate.json	Facebook login/session state


🔐 BOX APPROVAL SYSTEM

Enable in config.json:

"approval": true

Usage examples:

approve list
approve box 1234567890
approve remove 1234567890

📥 HOW TO GET appstate.json

Use the FBState Exporter extension to export your Facebook login session:

Steps:

1. Download FBState Exporter here


2. Open with Kiwi Browser


3. Load as an Extension


4. Login to Facebook


5. Open the extension and click “Copy fbstate”


6. Paste the copied data into a file named appstate.json



🧠 ADDING A COMMAND

Example command template:

module.exports.config = {
  name: "example",
  version: "1.0.0",
  permission: 0,
  credits: "SAKIB VAI",
  description: "An example command",
  prefix: true,
  category: "utility",
  usages: "example [args]",
  cooldowns: 5,
  premium: false,
  dependencies: {}
};

module.exports.run = async ({ api, event, args }) => {
  api.sendMessage("Hello from example command!", event.threadID);
};

🧩 UPCOMING FEATURES

⏩ Command aliases
🔒 Encrypted state manager
📊 Dashboard system for logs and analytics

📁 RESOURCES

GitHub Repository: Sakib-ai

> 💬 Developed with care by Sakib Vai & Ryuko

Let me know if you want me to help with anything else!

