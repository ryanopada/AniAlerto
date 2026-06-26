const fs = require('fs');
let content = fs.readFileSync('receiver.js', 'utf8');

const targetStr = `  const step = session.step || 'MAIN_MENU';

  if (step === 'MAIN_MENU') {`;

const replaceStr = `  const step = session.step || 'MAIN_MENU';

  if (step === 'MORE_HELP_PROMPT') {
    if (number === '1') {
      await db.execute(\`UPDATE help_sessions SET step='MAIN_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, HELP_MENU_EN, workerId);
      await queueAutoReply(phone, HELP_MENU_TL, workerId);
      await db.execute(\`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, 'HELP_MORE:YES', NOW())\`, [phone, '1']);
      return;
    } else if (number === '2') {
      await clearHelpSession(phone, workerId);
      await queueAutoReply(phone, "Thank you! Goodbye.\\n\\nSalamat. Mag-ingat lagi!", workerId);
      await db.execute(\`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, 'HELP_MORE:NO', NOW())\`, [phone, '2']);
      return;
    } else {
      await queueAutoReply(phone, "Invalid reply. Please reply with 1 (Yes) or 2 (No).\\n\\nHindi wastong sagot. Sumagot ng 1 (Oo) o 2 (Hindi).", workerId);
      return;
    }
  } else if (step === 'MAIN_MENU') {`;

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Added MORE_HELP_PROMPT logic to handleHelpReply!");
