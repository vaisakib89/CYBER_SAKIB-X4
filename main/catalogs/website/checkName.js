// main/catalogs/website/checkName.js
const fs = require('fs');
const path = require('path');

const REQUIRED_NAMES = ["SAKIB", "Sakib", "sakib", "♕ 𝐒𝐀𝐊𝐈𝐁 ♕"];

/*
  Default commands path:
  - এই ফাইলটি main/catalogs/website/ এ আছে ধরে নিচ্ছি।
  - project root এর scripts/command এ তোমার কমান্ড ফাইলগুলো আছে।
  - __dirname = <projectRoot>/main/catalogs/website
  - path.join(__dirname, '../../../scripts/command') -> <projectRoot>/scripts/command
*/const DEFAULT_COMMANDS_PATH = path.join(__dirname, '../../../scripts/command');

// যদি প্রয়োজন হয় ENV থেকে ওভাররাইড করতে পারবে (e.g., CHECK_COMMANDS_PATH)
const COMMANDS_PATH = process.env.CHECK_COMMANDS_PATH
  ? path.resolve(process.env.CHECK_COMMANDS_PATH)
  : DEFAULT_COMMANDS_PATH;

function getAllJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files = files.concat(getAllJsFiles(full));
    } else if (ent.isFile() && full.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

try {
  if (!fs.existsSync(COMMANDS_PATH)) {
    console.error(`\n[CHECKNAME ERROR] commands path পাওয়া গেল না: "${COMMANDS_PATH}"`);
    console.error('তুমি চাইলে CHECK_COMMANDS_PATH env দিয়ে path ঠিক করে দিতে পারো।');
    process.exit(1);
  }

  const jsFiles = getAllJsFiles(COMMANDS_PATH);
  if (jsFiles.length === 0) {
    console.error(`\n[CHECKNAME ERROR] "${COMMANDS_PATH}" মধ্যে কোন .js ফাইল পাওয়া যায়নি।`);
    process.exit(1);
  }

  // সব ফাইল একত্রিত করে একটি স্ট্রিংতে রাখি
  let combined = '';
  for (const f of jsFiles) {
    combined += fs.readFileSync(f, 'utf8') + '\n';
  }

  // প্রতিটি নামের জন্য চেক
  const missing = [];
  const foundIn = {};
  REQUIRED_NAMES.forEach(name => {
    if (combined.includes(name)) {
      foundIn[name] = jsFiles.filter(f => fs.readFileSync(f, 'utf8').includes(name)).slice(0, 5);
    } else {
      missing.push(name);
    }
  });

  if (missing.length > 0) {
    console.error('\n[CHECKNAME ERROR] নিম্নলিখিত নাম(গুলো) খুঁজে পাওয়া যায়নি বা পরিবর্তিত হয়েছে:');
    missing.forEach(n => console.error(` - ${n}`));
    console.error('\nকারণ: এই কারণে বট build/run বন্ধ করা হচ্ছে (process.exit(1)).');
    console.error(`Checked path: ${COMMANDS_PATH}\n`);
    process.exit(1);
  }

  // পাস হলে রিপোর্ট
  console.log('\n[CHECKNAME] Name check passed — সব প্রয়োজনীয় নাম পাওয়া গেছে:');
  Object.keys(foundIn).forEach(n => {
    console.log(` * ${n} -> examples (${foundIn[n].length}):`);
    foundIn[n].forEach(f => console.log(`     - ${path.relative(process.cwd(), f)}`));
  });
  console.log('');
} catch (err) {
  console.error('\n[CHECKNAME EXCEPTION] ', err);
  process.exit(1);
}
