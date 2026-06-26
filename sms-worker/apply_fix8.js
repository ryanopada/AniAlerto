const fs = require('fs');

let content = fs.readFileSync('receiver.js', 'utf8');

// 1. Fix Option 7 logic in handleHelpReply MAIN_MENU
const mainOption6 = `    } else if (number === '6') {
      await db.execute(\`UPDATE help_sessions SET step='EQUIPMENT_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, EQUIPMENT_MENU, workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} advanced to EQUIPMENT_MENU\`);
      return;
    } else {`;

const mainOption7 = `    } else if (number === '6') {
      await db.execute(\`UPDATE help_sessions SET step='EQUIPMENT_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, EQUIPMENT_MENU, workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} advanced to EQUIPMENT_MENU\`);
      return;
    } else if (number === '7') {
      await db.execute(\`UPDATE help_sessions SET step='OTHER_HELP_DESC', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, 'AniAlerto: Please describe the help you need.\\n\\nMangyaring ilarawan ang tulong na kailangan mo.', workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} selected Option 7 (Other)\`);
      return;
    } else {`;

content = content.replace(mainOption6, mainOption7);

// 2. Fix UI updates for Main Menu selections
const stepMainMenuRegex = /if \(step === 'MAIN_MENU'\) \{/g;
const stepMainMenuReplace = `if (step === 'MAIN_MENU') {
    let topicLabel = '';
    if (number === '1') topicLabel = 'Irrigation';
    else if (number === '2') topicLabel = 'Fertilizer';
    else if (number === '3') topicLabel = 'Pesticide Spray';
    else if (number === '4') topicLabel = 'Harvest';
    else if (number === '5') topicLabel = 'Field Preparation';
    else if (number === '6') topicLabel = 'Equipment and Safety';
    else if (number === '7') topicLabel = 'Other';

    if (topicLabel) {
      await db.execute(
        \`UPDATE sms_logs SET response_text = ?, received_at = NOW() WHERE direction = 'Outbound' AND response_text LIKE 'HELP%' AND (worker_id = ? OR phone = ? OR \${phoneMatchExpr('phone')} = ?) ORDER BY created_at DESC LIMIT 1\`,
        [\`HELP: \${topicLabel}\`, workerId, phone, phoneKey(phone)]
      );
    }`;

content = content.replace(stepMainMenuRegex, stepMainMenuReplace);

// 3. Fix finishHelpReply to use LIKE 'HELP%' so it catches 'HELP: Irrigation', etc.
const finishUpdateRegex = /AND response_text = 'HELP'/g;
const finishUpdateReplace = `AND response_text LIKE 'HELP%'`;
content = content.replace(finishUpdateRegex, finishUpdateReplace);

// 4. Update UI for OTHER_HELP_DESC
const otherDescRegex = /await db\.execute\(`UPDATE help_sessions SET step='MORE_HELP_PROMPT', created_at=NOW\(\) WHERE id=\?`, \[session\.id\]\);/g;
const otherDescReplace = `await db.execute(\`UPDATE help_sessions SET step='MORE_HELP_PROMPT', created_at=NOW() WHERE id=?\`, [session.id]);
          await db.execute(
            \`UPDATE sms_logs SET response_text = ?, received_at = NOW() WHERE direction = 'Outbound' AND response_text LIKE 'HELP%' AND (worker_id = ? OR phone = ? OR \${phoneMatchExpr('phone')} = ?) ORDER BY created_at DESC LIMIT 1\`,
            [\`HELP: Other - \${sms.text.substring(0, 50)}\`, workerId, normalizedPhone, phoneKey(normalizedPhone)]
          );`;

content = content.replace(otherDescRegex, otherDescReplace);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Applied UI updates and Option 7 logic!");
