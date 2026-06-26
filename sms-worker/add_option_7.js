const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'receiver.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update HELP_MENU string
const menuOld = `const HELP_MENU =
    'AniAlerto: What help do you need? Reply with the number:\\n' +
    '1 - Irrigation\\n' +
    '2 - Fertilizer\\n' +
    '3 - Pesticide Spray\\n' +
    '4 - Harvest\\n' +
    '5 - Field Preparation\\n' +
    '6 - Equipment and Safety\\n\\n' +
    'Anong tulong ang kailangan mo? Sumagot gamit ang numero:\\n' +
    '1 - Patubig\\n' +
    '2 - Abono\\n' +
    '3 - Pesticide Spray\\n' +
    '4 - Pag-aani\\n' +
    '5 - Paghahanda ng Lupa\\n' +
    '6 - Kagamitan';`;

const menuNew = `const HELP_MENU =
    'AniAlerto: What help do you need? Reply with the number:\\n' +
    '1 - Irrigation\\n' +
    '2 - Fertilizer\\n' +
    '3 - Pesticide Spray\\n' +
    '4 - Harvest\\n' +
    '5 - Field Preparation\\n' +
    '6 - Equipment and Safety\\n' +
    '7 - Other (Wala sa pagpipilian)\\n\\n' +
    'Anong tulong ang kailangan mo? Sumagot gamit ang numero:\\n' +
    '1 - Patubig\\n' +
    '2 - Abono\\n' +
    '3 - Pesticide Spray\\n' +
    '4 - Pag-aani\\n' +
    '5 - Paghahanda ng Lupa\\n' +
    '6 - Kagamitan\\n' +
    '7 - Wala sa pagpipilian';`;

content = content.replace(menuOld, menuNew);

// 2. Update regex to intercept 1-7 in processIncoming
content = content.replace('if (/^[1-6]$/.test(helpNum)) {', 'if (/^[1-7]$/.test(helpNum)) {');

// 3. Update handleHelpReply to support 7
const handleHelpReplyRegex = /async function handleHelpReply\(number, workerId, workerName, phone, session\) \{[\s\S]*?else \{\n      await queueAutoReply\(phone, HELP_INVALID_REPLY, workerId\);\n      return;\n    \}\n  \} else if/;

const handleHelpReplyNew = `async function handleHelpReply(number, workerId, workerName, phone, session) {
  const step = session.step || 'MAIN_MENU';

  if (step === 'MAIN_MENU') {
    if (number === '1') {
      await db.execute(\`UPDATE help_sessions SET step='IRRIGATION_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, IRRIGATION_MENU, workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} advanced to IRRIGATION_MENU\`);
      return;
    } else if (number === '2') {
      await db.execute(\`UPDATE help_sessions SET step='FERTILIZER_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, FERTILIZER_MENU, workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} advanced to FERTILIZER_MENU\`);
      return;
    } else if (number === '3') {
      await db.execute(\`UPDATE help_sessions SET step='PESTICIDE_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, PESTICIDE_MENU, workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} advanced to PESTICIDE_MENU\`);
      return;
    } else if (number === '4') {
      await db.execute(\`UPDATE help_sessions SET step='HARVEST_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, HARVEST_MENU, workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} advanced to HARVEST_MENU\`);
      return;
    } else if (number === '5') {
      await db.execute(\`UPDATE help_sessions SET step='FIELD_PREP_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, FIELD_PREP_MENU, workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} advanced to FIELD_PREP_MENU\`);
      return;
    } else if (number === '6') {
      await db.execute(\`UPDATE help_sessions SET step='EQUIPMENT_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, EQUIPMENT_MENU, workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} advanced to EQUIPMENT_MENU\`);
      return;
    } else if (number === '7') {
      await db.execute(\`UPDATE help_sessions SET step='OTHER_HELP_DESC', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, 'AniAlerto: Please describe the assistance you need.\\n\\nMangyaring ilarawan ang tulong na kailangan mo.', workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} selected Other Help (Option 7), awaiting description\`);
      return;
    } else {
      await queueAutoReply(phone, HELP_INVALID_REPLY, workerId);
      return;
    }
  } else if`;

content = content.replace(handleHelpReplyRegex, handleHelpReplyNew);

// 4. Update the logic for receiving the OTHER_HELP_DESC description
const interceptOld = `      // ── Invalid reply while in help or delay session: check sessions ─────────
      if (command === null) {
        // Check for Pest Menu Session first`;

const interceptNew = `      // ── Help description intercept (for option 7) ───────────────────────────
      const helpNum2 = sms.text.trim();
      if (command === null && !(/^[1-7]$/.test(helpNum2))) {
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session && session.step === 'OTHER_HELP_DESC') {
          await db.execute(
            \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
             VALUES (?, ?, ?, NOW())\`,
            [normalizedPhone, sms.text, 'HELP_DESC']
          );
          await clearHelpSession(normalizedPhone, workerId);
          await queueAutoReply(normalizedPhone, 'Help description recorded. The admin has been notified.\\n\\nNaitala ang iyong kailangan. Inabisuhan na ang admin.', workerId);
          await deleteSMS(sms.index).catch(() => {});
          continue;
        }
      }

      // ── Invalid reply while in help or delay session: check sessions ─────────
      if (command === null) {
        // Check for Pest Menu Session first`;

content = content.replace(interceptOld, interceptNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully added Option 7 to receiver.js!");
