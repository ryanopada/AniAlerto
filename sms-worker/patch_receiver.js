const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'receiver.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update HELP_MENU
const menuRegex = /const HELP_MENU =[\s\S]*?'6 - Kagamitan';/;
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
content = content.replace(menuRegex, menuNew);

// 2. Update handlePest
const handlePestRegex = /async function handlePest\(workerId, workerName, phone\) \{[\s\S]*?\n\}/;
const handlePestNew = `async function handlePest(workerId, workerName, phone) {
  const task = await getTaskContext(workerId);

  const [recentPest] = await db.execute(
    \`SELECT id FROM pest_alerts
     WHERE worker_id = ?
       AND reported_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
     LIMIT 1\`,
    [workerId]
  );
  if (recentPest.length > 0) {
    console.log(\`[Receiver] ⚠️  PEST already logged for \${workerName} (\${phone}) — skipping duplicate\`);
    return;
  }

  if (task) {
    await logWorkerAnalytics(workerId, task.id, 'PEST');
    await db.execute(
      \`UPDATE scheduled_tasks SET status='Pest Detected', updated_at=NOW() WHERE id=?\`,
      [task.id]
    );
    console.log(\`[Receiver] 🐛 Task \${task.id} → Pest Detected\`);
  }

  // Create pest incident
  await db.execute(
    \`INSERT INTO pest_alerts (worker_id, phone, batch_id, task_id, status, reported_at)
     VALUES (?, ?, ?, ?, 'Pending Pest Identification', NOW())\`,
    [workerId, phone, task ? task.batch_id : null, task ? task.id : null]
  );

  const batchInfo = task && task.batch_name ? \` in \${task.batch_name}\` : '';
  const alertMsg = \`PEST report from \${workerName} (\${phone})\${batchInfo}. Pending pest identification.\`;
  await createAlert('PEST', workerId, workerName, phone, task ? task.id : null, alertMsg);

  const adminPhone = await getAdminPhone();
  if (adminPhone) {
    await queueAutoReply(
      adminPhone,
      \`AniAlerto: \${workerName} reported PEST\${batchInfo}. Waiting for pest identification. Phone: \${phone}.\`,
      null
    );
  }

  // Fetch active pest advisories to construct the menu
  const [advisories] = await db.execute(\`SELECT option_number, pest_name FROM pest_advisories WHERE is_active = 1 ORDER BY option_number ASC\`);
  
  let menuEN = "Pest report received.\\nAnong uri ng peste ang nakita?\\n\\n";
  
  let options = "";
  advisories.forEach(adv => {
    options += \`\${adv.option_number} - \${adv.pest_name.split(' (')[0]}\\n\`;
  });
  
  const pestMenu = menuEN + options + "\\nI-reply lamang ang tamang numero.";

  await queueAutoReply(phone, pestMenu, workerId);
  
  await clearHelpSession(phone, workerId);
  await clearDelaySession(phone, workerId);
  
  console.log(\`[Receiver] 🐛 Pest incident logged for \${workerName}\${batchInfo}. Menu sent.\`);
}

async function handlePestReply(number, workerId, workerName, phone, pestAlertId) {
  const [advisories] = await db.execute(\`SELECT id, pest_name, advisory_en, advisory_tl FROM pest_advisories WHERE option_number = ? AND is_active = 1\`, [number]);
  
  if (advisories.length === 0) {
    await queueAutoReply(phone, 'Invalid reply. Please reply with a valid number from the choices.\\n\\nHindi wastong sagot. Sumagot ng tamang numero mula sa pagpipilian.', workerId);
    return;
  }
  
  const advisory = advisories[0];
  const combinedAdvisory = \`\${advisory.advisory_en}\\n\\n\${advisory.advisory_tl}\`;

  await db.execute(
    \`UPDATE pest_alerts SET status='Identified', pest_type_id=?, advisory_sent=? WHERE id=?\`,
    [advisory.id, combinedAdvisory, pestAlertId]
  );
  
  await queueAutoReply(phone, combinedAdvisory, workerId);
  
  const adminPhone = await getAdminPhone();
  if (adminPhone) {
    await queueAutoReply(
      adminPhone,
      \`AniAlerto: \${workerName} identified pest as \${advisory.pest_name}. Advisory sent.\`,
      null
    );
  }
  
  try {
    await db.execute(
      \`UPDATE alerts SET message = CONCAT(message, '\\nIdentified as: ', ?) WHERE type='PEST' AND worker_id=? AND is_read=0 ORDER BY created_at DESC LIMIT 1\`,
      [advisory.pest_name, workerId]
    );
  } catch(e) {}

  console.log(\`[Receiver] 🐛 Pest identified by \${workerName} as \${advisory.pest_name}\`);
}`;
content = content.replace(handlePestRegex, handlePestNew);

// 3. Update handleDone
const handleDoneRegex = /async function handleDone\(workerId, workerName, phone\) \{[\s\S]*?const task = await getTaskContext\(workerId\);/;
const handleDoneNew = `async function handleDone(workerId, workerName, phone) {
  // First, check if there's an identified pest alert awaiting DONE
  const [openPest] = await db.execute(
    \`SELECT id FROM pest_alerts WHERE worker_id = ? AND status = 'Identified' ORDER BY reported_at DESC LIMIT 1\`,
    [workerId]
  );

  if (openPest.length > 0) {
    const pestAlertId = openPest[0].id;
    await db.execute(\`UPDATE pest_alerts SET status = 'Completed', completed_at = NOW() WHERE id = ?\`, [pestAlertId]);
    console.log(\`[Receiver] ✅ Pest incident \${pestAlertId} → Completed by \${workerName}\`);
    
    // Notify admin
    const adminPhone = await getAdminPhone();
    if (adminPhone) {
      await queueAutoReply(
        adminPhone,
        \`AniAlerto: \${workerName} completed the pest management protocol.\`,
        null
      );
    }
    await queueAutoReply(phone, AUTO_REPLIES.DONE, workerId);
    
    // Update alert in dashboard
    try {
      await db.execute(\`UPDATE alerts SET done_reply = ?, message = CONCAT(message, ' (Completed)') WHERE type='PEST' AND worker_id=? AND is_read=0\`, [workerName, workerId]);
    } catch(e) {}
    
    return;
  }

  const task = await getTaskContext(workerId);`;
content = content.replace(handleDoneRegex, handleDoneNew);

// 4. Update handleHelpReply to support 7
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

// 5. Update processIncoming polling loop block
const processLoopRegex = /\/\/ ── Help session intercept: reply 1-6 while awaiting menu selection ─────[\s\S]*?\/\/ ── Gate 2: Deduplication guard ───────────────────────────────────────/;

const processLoopNew = `// ── Pest session intercept ──────────────────────────────────────────────
      const [pestSessions] = await db.execute(
        \`SELECT id FROM pest_alerts WHERE worker_id = ? AND status = 'Pending Pest Identification' ORDER BY reported_at DESC LIMIT 1\`,
        [workerId]
      );
      if (pestSessions.length > 0) {
        const pestAlertId = pestSessions[0].id;
        const cleanNum = sms.text.replace(/[^0-9]/g, '');
        if (cleanNum && cleanNum.length < 3) {
           await db.execute(
             \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
              VALUES (?, ?, ?, NOW())\`,
             [normalizedPhone, sms.text, \`PEST_REPLY:\${cleanNum}\`]
           );
           await handlePestReply(cleanNum, workerId, workerName, normalizedPhone, pestAlertId);
           await deleteSMS(sms.index).catch(() => {});
           continue;
        }
      }

      // ── Help description intercept (for option 7) ──────────────────────────
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

      // ── Help session intercept: reply 1-7 while awaiting menu selection ─────
      const helpNum = sms.text.trim();
      if (/^[1-7]$/.test(helpNum)) {
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session) {
          console.log(\`[Receiver] 🆘 Help sub-reply from \${workerName}: "\${helpNum}"\`);
          await db.execute(
            \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
             VALUES (?, ?, ?, NOW())\`,
            [normalizedPhone, sms.text, \`HELP:\${helpNum}\`]
          );
          await handleHelpReply(helpNum, workerId, workerName, normalizedPhone, session);
          await deleteSMS(sms.index).catch(() => {});
          continue;
        }
      }

      // ── Delay session intercept ─────────────────────────────────────────────
      if (command === null) {
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session) {
          console.log(\`[Receiver] ⚠️  Invalid help menu reply from \${workerName}: "\${sms.text}"\`);
          await queueAutoReply(normalizedPhone, HELP_INVALID_REPLY, workerId);
          await deleteSMS(sms.index).catch(() => {});
          continue;
        }

        const delaySession = await getDelaySession(normalizedPhone, workerId);
        if (delaySession) {
          const cleanText = sms.text.replace(/[^a-zA-Z0-9]/g, '');
          if (cleanText.length < 4) {
            console.log(\`[Receiver] ⚠️  Invalid delay reason from \${workerName}\`);
            await queueAutoReply(normalizedPhone, \`AniAlerto: Please provide a valid reason for delay (at least 4 letters/numbers).\\n\\nMangyaring magbigay ng malinaw na dahilan ng pagka-delay.\`, workerId);
            await deleteSMS(sms.index).catch(() => {});
            continue;
          }

          console.log(\`[Receiver] 📝 Delay reason received from \${workerName}: "\${sms.text}"\`);
          // Store reason in the database
          await db.execute(
            \`UPDATE alerts SET delay_reason = ? 
             WHERE type = 'DELAY' AND worker_id = ? AND delay_reason IS NULL
             ORDER BY created_at DESC LIMIT 1\`,
             [sms.text, workerId]
          );

          await clearDelaySession(normalizedPhone, workerId);
          
          await db.execute(
            \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
             VALUES (?, ?, ?, NOW())\`,
            [normalizedPhone, sms.text, 'DELAY_REASON']
          );
          
          await queueAutoReply(normalizedPhone, \`Reason recorded. Thank you.\\n\\nNaitala ang dahilan. Salamat.\`, workerId);
          await deleteSMS(sms.index).catch(() => {});
          continue;
        }

        // No active session — normal invalid reply
        console.log(\`[Receiver] ⚠️  Invalid reply from \${workerName}: "\${sms.text}"\`);
        await db.execute(
          \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
           VALUES (?, ?, NULL, NOW())\`,
          [normalizedPhone, sms.text]
        );
        await queueAutoReply(normalizedPhone, AUTO_REPLIES.INVALID, workerId);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      // ── Gate 2: Deduplication guard ───────────────────────────────────────`;

content = content.replace(processLoopRegex, processLoopNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched receiver.js");
