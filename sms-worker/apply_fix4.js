const fs = require('fs');
let content = fs.readFileSync('receiver.js', 'utf8');

const target = `VALUES (NULL, ?, ?, ?, 'Queued', 1, NOW())`;
const replacement = `VALUES (NULL, ?, ?, ?, 'Queued', 0, NOW())`;

content = content.replace(target, replacement);

const targetLog = `// Queue an auto-reply SMS via sms_queue (skip_log=1 → sender will NOT create an sms_logs row)`;
const replacementLog = `// Queue an auto-reply SMS via sms_queue (skip_log=0 → sender WILL create an sms_logs row)`;

content = content.replace(targetLog, replacementLog);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Updated skip_log to 0!");
