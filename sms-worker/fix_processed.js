const fs = require('fs');
const file = 'D:\\Download\\ryan code\\ANIALERTO\\sms-worker\\receiver.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /INSERT IGNORE INTO inbound_messages \(phone, message, command, received_at\)\s*VALUES \(\?, \?, \?, NOW\(\)\)/g,
  'INSERT IGNORE INTO inbound_messages (phone, message, command, received_at, processed_at)\n             VALUES (?, ?, ?, NOW(), NOW())'
);
content = content.replace(
  /INSERT IGNORE INTO inbound_messages \(phone, message, command, received_at\)\s*VALUES \(\?, \?, NULL, NOW\(\)\)/g,
  'INSERT IGNORE INTO inbound_messages (phone, message, command, received_at, processed_at)\n             VALUES (?, ?, NULL, NOW(), NOW())'
);

fs.writeFileSync(file, content);
console.log('Replaced successfully');
