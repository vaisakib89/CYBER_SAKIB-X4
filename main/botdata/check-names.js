// main/botdata/check-names.js
const fs = require('fs');
const path = require('path');

// Required names that must exist in your command files
const REQUIRED_NAMES = ["SAKIB", "Sakib", "sakib", "♕ 𝐒𝐀𝐊𝐈𝐁 ♕"];

// Default commands path
const DEFAULT_COMMANDS_PATH = path.join(__dirname, '../../scripts/commands');

// Environment variable দ্বারা override করা যাবে
const COMMANDS_PATH = process.env.CHECK_COMMANDS_PATH
  ? path.resolve(process.env.CHECK_COMMANDS_PATH)
  : DEFAULT_COMMANDS_PATH;

// সব JS ফাইল recursively নেয়ার ফাংশন
function getAllJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const ent of entries) {
    const fullPath = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files = files.concat(getAllJsFiles(fullPath));
    } else if (ent.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

try {
  if (!fs.existsSync(COMMANDS_PATH)) {
    console.error(`\n[CHECKNAME ERROR] commands path পাওয়া গেল না: "${COMMANDS_PATH}"`);
    console.error('CHECK_COMMANDS_PATH env দিয়ে path ঠিক করে দিতে পারো।');
    process.exit(1);
  }

  const jsFiles = getAllJsFiles(COMMANDS_PATH);
  if (jsFiles.length === 0) {
    console.error(`\n[CHECKNAME ERROR] "${COMMANDS_PATH}" মধ্যে কোন .js ফাইল পাওয়া যায়নি।`);
    process.exit(1);
  }

  // সব ফাইল একত্রিত করে একটি স্ট্রিংতে রাখি
  let combined = jsFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

  // নাম check
  const missing = [];
  const foundIn = {};

  REQUIRED_NAMES.forEach(name => {
    const matches = jsFiles.filter(f => fs.readFileSync(f, 'utf8').includes(name));
    if (matches.length === 0) {
      missing.push(name);
    } else {
      foundIn[name] = matches.slice(0, 5); // প্রথম ৫টি উদাহরণ দেখানো
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
  Object.keys(foundIn).forEach(name => {
    console.log(` * ${name} -> examples (${foundIn[name].length}):`);
    foundIn[name].forEach(f => console.log(`     - ${path.relative(process.cwd(), f)}`));
  });
  console.log('');

} catch (err) {
  console.error('\n[CHECKNAME EXCEPTION] ', err);
  process.exit(1);
}
