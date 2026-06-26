const fs = require('fs');

let content = fs.readFileSync('receiver.js', 'utf8');

const target1 = `    } else {
      await queueAutoReply(phone, HELP_INVALID_REPLY, workerId);
      return;
    }
  } else if (step === 'IRRIGATION_MENU') {`;

const new1 = `    } else if (number === '7') {
      await db.execute(\`UPDATE help_sessions SET step='OTHER_HELP_DESC', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, 'AniAlerto: Please describe the assistance you need.\\n\\nMangyaring ilarawan ang tulong na kailangan mo.', workerId);
      console.log(\`[Receiver] 🆘 Help multi-level: \${workerName} selected Other Help (Option 7), awaiting description\`);
      return;
    } else {
      await queueAutoReply(phone, HELP_INVALID_REPLY, workerId);
      return;
    }
  } else if (step === 'MORE_HELP_PROMPT') {
    if (number === '1' || number.toUpperCase() === 'YES') {
      await db.execute(\`UPDATE help_sessions SET step='MAIN_MENU', created_at=NOW() WHERE id=?\`, [session.id]);
      await queueAutoReply(phone, HELP_MENU_EN, workerId);
      await queueAutoReply(phone, HELP_MENU_TL, workerId);
      console.log(\`[Receiver] 🆘 Help Loop: \${workerName} requested more help, sent MAIN_MENU\`);
      return;
    } else if (number === '2' || number.toUpperCase() === 'NO') {
      await clearHelpSession(phone, workerId);
      await queueAutoReply(phone, 'Thank you! Goodbye.\\n\\nSalamat. Mag-ingat lagi!', workerId);
      console.log(\`[Receiver] 🆘 Help Loop: \${workerName} ended the session\`);
      return;
    } else {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1 (Yes) or 2 (No).\\n\\nHindi wastong sagot. Sumagot ng 1 (Oo) o 2 (Hindi).', workerId);
      return;
    }
  } else if (step === 'IRRIGATION_MENU') {`;

content = content.replace(target1, new1);

const target2 = `async function finishHelpReply(helpType, workerId, workerName, phone) {
  const responseLabel = \`HELP: \${helpType.label}\`;

  // Update the sms_logs row that was stamped 'HELP' to the specific topic
  const [upd] = await db.execute(
    \`UPDATE sms_logs
        SET response_text = ?,
            received_at   = NOW()
      WHERE direction     = 'Outbound'
        AND response_text = 'HELP'
        AND (
          worker_id = ?
          OR phone  = ?
          OR \${phoneMatchExpr('phone')} = ?
        )
      ORDER BY created_at DESC
      LIMIT 1\`,
    [responseLabel, workerId, phone, phoneKey(phone)]
  );
  if (upd.affectedRows > 0) {
    console.log(\`[Receiver] 🔗 sms_logs HELP row → \${responseLabel}\`);
  }

  // Notify admin with the selected topic
  const adminPhone = await getAdminPhone();
  if (adminPhone) {
    await queueAutoReply(
      adminPhone,
      \`AniAlerto: \${workerName} selected HELP topic "\${helpType.label}". Phone: \${phone}.\`,
      null
    );
  }

  // Clear the help session
  await clearHelpSession(phone, workerId);

  console.log(\`[Receiver] 🆘 Help sub-reply processed: \${workerName} → \${helpType.label}\`);
}`;

const new2 = `async function finishHelpReply(helpType, workerId, workerName, phone) {
  const responseLabel = \`HELP: \${helpType.label}\`;

  // Update the sms_logs row that was stamped 'HELP' to the specific topic
  const [upd] = await db.execute(
    \`UPDATE sms_logs
        SET response_text = ?,
            received_at   = NOW()
      WHERE direction     = 'Outbound'
        AND response_text = 'HELP'
        AND (
          worker_id = ?
          OR phone  = ?
          OR \${phoneMatchExpr('phone')} = ?
        )
      ORDER BY created_at DESC
      LIMIT 1\`,
    [responseLabel, workerId, phone, phoneKey(phone)]
  );
  if (upd.affectedRows > 0) {
    console.log(\`[Receiver] 🔗 sms_logs HELP row → \${responseLabel}\`);
  }

  // Notify admin with the selected topic
  const adminPhone = await getAdminPhone();
  if (adminPhone) {
    await queueAutoReply(
      adminPhone,
      \`AniAlerto: \${workerName} selected HELP topic "\${helpType.label}". Phone: \${phone}.\`,
      null
    );
  }

  // Ask if they need more help
  await db.execute(\`UPDATE help_sessions SET step='MORE_HELP_PROMPT', created_at=NOW() WHERE phone=? OR worker_id=?\`, [phone, workerId]);
  await queueAutoReply(phone, MORE_HELP_MENU, workerId);

  console.log(\`[Receiver] 🆘 Help sub-reply processed: \${workerName} → \${helpType.label}. Prompting for more help.\`);
}`;

content = content.replace(target2, new2);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Fixed handleHelpReply and finishHelpReply!");
