// main/botdata/check-names.js
const fs = require('fs');
const path = require('path');

// অনুমোদিত নামগুলো
const allowedNames = [
  'SAKIB',
  'Sakib',
  'sakib',
  '♕ 𝐒𝐀𝐊𝐈𝐁 ♕'
];

// প্রকৃত কমান্ড ফোল্ডারের path (project root থেকে)
const searchDir = path.join(__dirname, '..', '..', 'scripts', 'commands');

// ফোল্ডার recursively খুঁজে সব .js ফাইল খুঁজবে
function walkDir(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walkDir(full, filelist);
    } else if (path.extname(full).toLowerCase() === '.js') {
      filelist.push(full);
    }
  }
  return filelist;
}

const allFiles = walkDir(searchDir);

if (allFiles.length === 0) {
  console.error('⛔️ কোনো .js স্ক্রিপ্ট ফাইল পাওয়া যায়নি: scripts/commands ফোল্ডারে।');
  process.exit(1);
}

// সব ফাইলের content একত্রিত করা
const contents = allFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n\n/* file boundary */\n\n');

// অনুমোদিত নাম আছে কি না চেক
const missing = allowedNames.filter(name => !contents.includes(name));

if (missing.length > 0) {
  console.error('⛔️ Build failed — এই অনুমোদিত নাম/ফরম্যাট(গুলো) নেই:');
  missing.forEach(m => console.error(' - ' + m));
  process.exit(1);
}

console.log('✅ Name check OK — সব অনুমোদিত নাম ফাইলগুলোর মধ্যে আছে।');
process.exit(0);
