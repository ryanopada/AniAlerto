const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'receiver.js');
let content = fs.readFileSync(filePath, 'utf8');

// I will find the exact index of `if (workerRows.length === 0) {`
const searchStart = "      if (workerRows.length === 0) {";
const searchEnd = "          const cleanText = sms.text.replace(/[^a-zA-Z0-9]/g, '');";

const startIndex = content.indexOf(searchStart);
const endIndex = content.indexOf(searchEnd, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find the target block");
  process.exit(1);
}

const replacement = `      if (workerRows.length === 0) {
        console.log(\`[Receiver] 🚫 Unregistered: \${normalizedPhone} — purging\`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      const workerId   = workerRows[0].id;
      const workerName = workerRows[0].name;
      console.log(\`[Receiver] 👤 Verified: \${workerName} (\${normalizedPhone})\`);

      // ── Help session intercept: reply 1-7 while awaiting menu selection ─────
      const helpNum = sms.text.trim();
      let session = null;
      let sessionFetched = false;

      // ── Pest menu intercept ────────────────────────────────────────────────
      const [pestSessions] = await db.execute(
        \`SELECT id FROM pest_alerts WHERE worker_id = ? AND status = 'Pending Pest Identification' ORDER BY reported_at DESC LIMIT 1\`,
        [workerId]
      );
      if (pestSessions.length > 0) {
        const pestAlertId = pestSessions[0].id;
        const cleanNum = sms.text.replace(/[^0-9]/g, '');
        if (cleanNum && cleanNum.length < 3) {
           await handlePestReply(cleanNum, workerId, workerName, normalizedPhone, pestAlertId);
           await deleteSMS(sms.index).catch(() => {});
           continue;
        }
      }

      if (command === null || /^[1-7]$/.test(helpNum)) {
        session = await getHelpSession(normalizedPhone, workerId);
        sessionFetched = true;
        
        if (session && session.step === 'OTHER_HELP_DESC') {
`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed receiver.js successfully!");
