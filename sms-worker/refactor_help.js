const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'receiver.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Define MORE_HELP_MENU constant and append to HELP_MENU block
const helpMenuRegex = /const HELP_MENU =[\s\S]*?'7 - Wala sa pagpipilian';/;
const moreHelpMenuStr = `\n\nconst MORE_HELP_MENU =
  'AniAlerto: Need any other help? Reply with the number:\\n' +
  '1 - Yes\\n' +
  '2 - No\\n\\n' +
  'Kailangan mo pa ba ng ibang tulong? Sumagot gamit ang numero:\\n' +
  '1 - Oo\\n' +
  '2 - Hindi';`;
// Inject MORE_HELP_MENU right after HELP_MENU
content = content.replace(helpMenuRegex, (match) => match + moreHelpMenuStr);

// 2. Remove "Problems" from IRRIGATION_MENU
const irrMenuOld = `'3 - Scheduling\\n' +
  '4 - Problems\\n\\n' +
  'Anong tulong ang kailangan mo sa Patubig? Sumagot gamit ang numero:\\n' +
  '1 - Pinagmumulan ng tubig\\n' +
  '2 - Saklaw ng tubig\\n' +
  '3 - Iskedyul\\n' +
  '4 - Problema';`;
const irrMenuNew = `'3 - Scheduling\\n\\n' +
  'Anong tulong ang kailangan mo sa Patubig? Sumagot gamit ang numero:\\n' +
  '1 - Pinagmumulan ng tubig\\n' +
  '2 - Saklaw ng tubig\\n' +
  '3 - Iskedyul';`;
content = content.replace(irrMenuOld, irrMenuNew);

// 3. Remove "Problems" from FERTILIZER_MENU
const fertMenuOld = `'4 - Timing\\n' +
  '5 - Problems\\n\\n' +
  'Anong tulong ang kailangan mo sa Abono? Sumagot gamit ang numero:\\n' +
  '1 - Uri\\n' +
  '2 - Dami\\n' +
  '3 - Paraan ng Pag-aaplay\\n' +
  '4 - Oras ng Pag-aaplay\\n' +
  '5 - Problema';`;
const fertMenuNew = `'4 - Timing\\n\\n' +
  'Anong tulong ang kailangan mo sa Abono? Sumagot gamit ang numero:\\n' +
  '1 - Uri\\n' +
  '2 - Dami\\n' +
  '3 - Paraan ng Pag-aaplay\\n' +
  '4 - Oras ng Pag-aaplay';`;
content = content.replace(fertMenuOld, fertMenuNew);

// 4. Remove "Problems" from PESTICIDE_MENU
const pestMenuOld = `'4 - Timing\\n' +
  '5 - Problems\\n\\n' +
  'Anong tulong ang kailangan mo sa Pesticide Spray / Pest Control? Sumagot gamit ang numero:\\n' +
  '1 - Pagkilala sa peste\\n' +
  '2 - Paraan ng Pag-spray\\n' +
  '3 - Pag-iingat at Kaligtasan\\n' +
  '4 - Oras ng Pag-spray\\n' +
  '5 - Problema';`;
const pestMenuNew = `'4 - Timing\\n\\n' +
  'Anong tulong ang kailangan mo sa Pesticide Spray / Pest Control? Sumagot gamit ang numero:\\n' +
  '1 - Pagkilala sa peste\\n' +
  '2 - Paraan ng Pag-spray\\n' +
  '3 - Pag-iingat at Kaligtasan\\n' +
  '4 - Oras ng Pag-spray';`;
content = content.replace(pestMenuOld, pestMenuNew);

// 5. Remove "Problems" from HARVEST_MENU
const harvMenuOld = `'4 - Storage / Drying\\n' +
  '5 - Problems\\n\\n' +
  'Anong tulong ang kailangan mo sa Pag-aani? Sumagot gamit ang numero:\\n' +
  '1 - Pag-check ng pagkahinog\\n' +
  '2 - Mga gamit\\n' +
  '3 - Pag-aani\\n' +
  '4 - Pag-iimbak / Pagpatuyo\\n' +
  '5 - Problema';`;
const harvMenuNew = `'4 - Storage / Drying\\n\\n' +
  'Anong tulong ang kailangan mo sa Pag-aani? Sumagot gamit ang numero:\\n' +
  '1 - Pag-check ng pagkahinog\\n' +
  '2 - Mga gamit\\n' +
  '3 - Pag-aani\\n' +
  '4 - Pag-iimbak / Pagpatuyo';`;
content = content.replace(harvMenuOld, harvMenuNew);

// 6. Update IRRIGATION_TYPES (remove '4')
const irrTypesRegex = /  '4': \{\n    label: 'Irrigation - Problems',\n    msg:[\s\S]*?  \},\n\};\n\nconst FERTILIZER_TYPES/;
content = content.replace(irrTypesRegex, '};\n\nconst FERTILIZER_TYPES');

// 7. Update FERTILIZER_TYPES (remove '5')
const fertTypesRegex = /  '5': \{\n    label: 'Fertilizer - Problems',\n    msg:[\s\S]*?  \},\n\};\n\nconst PESTICIDE_TYPES/;
content = content.replace(fertTypesRegex, '};\n\nconst PESTICIDE_TYPES');

// 8. Update PESTICIDE_TYPES (remove '5')
const pestTypesRegex = /  '5': \{\n    label: 'Pesticide - Problems',\n    msg:[\s\S]*?  \},\n\};\n\nconst HARVEST_TYPES/;
content = content.replace(pestTypesRegex, '};\n\nconst HARVEST_TYPES');

// 9. Update HARVEST_TYPES (remove '5')
const harvTypesRegex = /  '5': \{\n    label: 'Harvest - Problems',\n    msg:[\s\S]*?  \},\n\};\n\nconst FIELD_PREP_TYPES/;
content = content.replace(harvTypesRegex, '};\n\nconst FIELD_PREP_TYPES');

// 10. Update handleHelpReply to reflect correct lengths, and add MORE_HELP_PROMPT logic
const handleHelpReplyRegex = /async function handleHelpReply\(number, workerId, workerName, phone, session\) \{[\s\S]*?\} else if \(step === 'EQUIPMENT_MENU'\) \{[\s\S]*?\}\n\}/;

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
  } else if (step === 'MORE_HELP_PROMPT') {
    if (number === '1') {
      await db.execute(\`UPDATE help_sessions SET step='MAIN_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, HELP_MENU, workerId);
      console.log(\`[Receiver] 🆘 Help Loop: \${workerName} requested more help, sent MAIN_MENU\`);
      return;
    } else if (number === '2') {
      await clearHelpSession(phone, workerId);
      await queueAutoReply(phone, 'Help session ended. / Tapos na ang help session.', workerId);
      console.log(\`[Receiver] 🆘 Help Loop: \${workerName} ended the session\`);
      return;
    } else {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1 for Yes, or 2 for No.\\n\\nHindi wastong sagot. Sumagot ng 1 para sa Oo, o 2 para sa Hindi.', workerId);
      return;
    }
  } else if (step === 'IRRIGATION_MENU') {
    const helpType = IRRIGATION_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, or 3 for Irrigation help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, o 3 para sa Patubig.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone, session);
  } else if (step === 'FERTILIZER_MENU') {
    const helpType = FERTILIZER_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, 3, or 4 for Fertilizer help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, o 4 para sa Abono.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone, session);
  } else if (step === 'PESTICIDE_MENU') {
    const helpType = PESTICIDE_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, 3, or 4 for Pesticide help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, o 4 para sa Pesticide.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone, session);
  } else if (step === 'HARVEST_MENU') {
    const helpType = HARVEST_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, 3, or 4 for Harvest help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, o 4 para sa Pag-aani.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone, session);
  } else if (step === 'FIELD_PREP_MENU') {
    const helpType = FIELD_PREP_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, or 3 for Field Preparation help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, o 3 para sa Paghahanda ng Lupa.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone, session);
  } else if (step === 'EQUIPMENT_MENU') {
    const helpType = EQUIPMENT_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, or 3 for Equipment & Safety help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, o 3 para sa Equipment & Safety.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone, session);
  }
}`;

content = content.replace(handleHelpReplyRegex, handleHelpReplyNew);

// 11. Update finishHelpReply to trigger MORE_HELP_PROMPT instead of closing
const finishHelpReplyOld = `  // Clear the help session
  await clearHelpSession(phone, workerId);

  console.log(\`[Receiver] 🆘 Help sub-reply processed: \${workerName} → \${helpType.label}\`);
}`;
const finishHelpReplyNew = `  // Ask if they need more help
  await db.execute(\`UPDATE help_sessions SET step='MORE_HELP_PROMPT', created_at=NOW() WHERE phone=? AND worker_id=?\`, [phone, workerId]);
  await queueAutoReply(phone, MORE_HELP_MENU, workerId);

  console.log(\`[Receiver] 🆘 Help sub-reply processed: \${workerName} → \${helpType.label}. Prompting for more help.\`);
}`;
content = content.replace(finishHelpReplyOld, finishHelpReplyNew);

// 12. Update the Option 7 intercept loop in processIncoming
const option7InterceptOld = `          await clearHelpSession(normalizedPhone, workerId);
          await queueAutoReply(normalizedPhone, 'Help description recorded. The admin has been notified.\\n\\nNaitala ang iyong kailangan. Inabisuhan na ang admin.', workerId);`;

const option7InterceptNew = `          await db.execute(\`UPDATE help_sessions SET step='MORE_HELP_PROMPT', created_at=NOW() WHERE id=?\`, [session.id]);
          await queueAutoReply(normalizedPhone, 'Help description recorded. The admin has been notified.\\n\\nNaitala ang iyong kailangan. Inabisuhan na ang admin.', workerId);
          await queueAutoReply(normalizedPhone, MORE_HELP_MENU, workerId);`;
content = content.replace(option7InterceptOld, option7InterceptNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully refactored Help workflow.");
