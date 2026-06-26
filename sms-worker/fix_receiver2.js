const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'receiver.js');
let content = fs.readFileSync(filePath, 'utf8');

const searchStart = "           await handlePestReply(cleanNum, workerId, workerName, normalizedPhone, pestAlertId);";

const replacement = `           await db.execute(
             \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
              VALUES (?, ?, ?, NOW())\`,
             [normalizedPhone, sms.text, \`PEST_REPLY:\${cleanNum}\`]
           );
           await handlePestReply(cleanNum, workerId, workerName, normalizedPhone, pestAlertId);`;

if (content.includes(searchStart) && !content.includes("PEST_REPLY")) {
  content = content.replace(searchStart, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Added inbound message logging for pest replies.");
} else {
  console.log("Not found or already added.");
}
