const fs = require('fs');

let content = fs.readFileSync('receiver.js', 'utf8');

const targetEN = `'6 - Equipment and Safety';`;
const newEN = `'6 - Equipment and Safety\\n' +\n  '7 - Other (Wala sa pagpipilian)';`;

const targetTL = `'6 - Kagamitan';`;
const newTL = `'6 - Kagamitan\\n' +\n  '7 - Wala sa pagpipilian';\n\nconst MORE_HELP_MENU =\n  'Need any other help? 1 - Yes, 2 - No\\n\\nKailangan mo pa ba ng ibang tulong? 1 - Oo, 2 - Hindi';`;

content = content.replace(targetEN, newEN);
content = content.replace(targetTL, newTL);

const interceptRegex = /const helpNum2 = sms\.text\.trim\(\);\n      if \(command === null && \!\(\/\^\[1\-7\]\$\/\.test\(helpNum2\)\)\) \{/;

const interceptNew = `const textMsg = sms.text.trim();
      if (command === null && !(/^[1-7]$/.test(textMsg))) {
        const session = await getHelpSession(normalizedPhone, workerId);
        
        // MORE_HELP_PROMPT explicit "Yes" / "No" support (non-numeric fallback)
        if (session && session.step === 'MORE_HELP_PROMPT') {
          if (textMsg.toUpperCase() === 'YES') {
            await db.execute(\`UPDATE help_sessions SET step='MAIN_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
            await queueAutoReply(normalizedPhone, HELP_MENU_EN, workerId);
            await queueAutoReply(normalizedPhone, HELP_MENU_TL, workerId);
            await db.execute(
              \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, 'HELP_MORE:YES', NOW())\`,
              [normalizedPhone, textMsg]
            );
            await deleteSMS(sms.index).catch(() => {});
            continue;
          } else if (textMsg.toUpperCase() === 'NO') {
            await clearHelpSession(normalizedPhone, workerId);
            await queueAutoReply(normalizedPhone, "Thank you! Goodbye.\\n\\nSalamat. Mag-ingat lagi!", workerId);
            await db.execute(
              \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, 'HELP_MORE:NO', NOW())\`,
              [normalizedPhone, textMsg]
            );
            await deleteSMS(sms.index).catch(() => {});
            continue;
          } else {
            await queueAutoReply(normalizedPhone, "Invalid reply. Please reply with 1 (Yes) or 2 (No).\\n\\nHindi wastong sagot. Sumagot ng 1 (Oo) o 2 (Hindi).", workerId);
            await deleteSMS(sms.index).catch(() => {});
            continue;
          }
        }`;

content = content.replace(interceptRegex, interceptNew);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Fixed receiver.js!");
