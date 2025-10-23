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

// project root থেকে scripts/commands ফোল্ডার খুঁজবে
const projectRoot = process.cwd();
const searchDir = path.join(projectRoot, 'scripts', 'commands');

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
  console.error(`⛔️ কোনো .js স্ক্রিপ্ট ফাইল পাওয়া যায়নি: ${searchDir}`);
  process.exit(1);
}

const contents = allFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n\n/* file boundary */\n\n');

const missing = allowedNames.filter(name => !contents.includes(name));

if (missing.length > 0) {
  console.error('⛔️ Build failed — এই অনুমোদিত নাম/ফরম্যাট(গুলো) নেই:');
  missing.forEach(m => console.error(' - ' + m));
  process.exit(1);
}

console.log('✅ Name check OK — সব অনুমোদিত নাম ফাইলগুলোর মধ্যে আছে।');
process.exit(0);
