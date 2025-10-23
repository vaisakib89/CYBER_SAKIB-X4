// check-names.js
const fs = require('fs');
const path = require('path');

// অনুমোদিত নামগুলো
const allowedNames = [
  'SAKIB',
  'Sakib',
  'sakib',
  '♕ 𝐒𝐀𝐊𝐈𝐁 ♕'
];

// চেক করার ফোল্ডার
const searchDir = path.join(__dirname, '..', 'scripts', 'commands');

// ফোল্ডার ট্রাভার্স করার ফাংশন
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

// সব .js ফাইল পড়া
const allFiles = walkDir(searchDir);

if (allFiles.length === 0) {
  console.error('⛔️ কোনো .js স্ক্রিপ্ট ফাইল পাওয়া যায়নি: scripts/commands ফোল্ডারে।');
  process.exit(1);
}

// সব ফাইলের কনটেন্ট একত্র করা
const contents = allFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n\n/* file boundary */\n\n');

// কনটেন্ট থেকে whitespaces ও newlines রিমুভ এবং lowercase করা
const normalizedContents = contents.replace(/\s+/g, '').toLowerCase();

// missing নাম চেক করা
const missing = allowedNames.filter(name => {
  const normalizedName = name.replace(/\s+/g, '').toLowerCase();
  return !normalizedContents.includes(normalizedName);
});

if (missing.length > 0) {
  console.error('⛔️ Build failed — এই অনুমোদিত নাম/ফরম্যাট(গুলো) নেই:');
  missing.forEach(m => console.error(' - ' + m));
  process.exit(1);
}

console.log('✅ Name check OK — সব অনুমোদিত নাম ফাইলগুলোর মধ্যে আছে।');
process.exit(0);
