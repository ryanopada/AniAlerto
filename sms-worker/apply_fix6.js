const fs = require('fs');
let content = fs.readFileSync('receiver.js', 'utf8');

// 1. Fix Invalid Reply Messages
content = content.replace(
  "'Invalid reply. Please reply with 1, 2, 3, or 4 for Irrigation help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, o 4 para sa Patubig.'",
  "'Invalid reply. Please reply with 1, 2, or 3 for Irrigation help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, o 3 para sa Patubig.'"
);

content = content.replace(
  "'Invalid reply. Please reply with 1, 2, 3, 4, or 5 for Fertilizer help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, 4, o 5 para sa Abono.'",
  "'Invalid reply. Please reply with 1, 2, 3, or 4 for Fertilizer help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, o 4 para sa Abono.'"
);

content = content.replace(
  "'Invalid reply. Please reply with 1, 2, 3, 4, or 5 for Pesticide help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, 4, o 5 para sa Pesticide.'",
  "'Invalid reply. Please reply with 1, 2, 3, or 4 for Pesticide help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, o 4 para sa Pesticide.'"
);

content = content.replace(
  "'Invalid reply. Please reply with 1, 2, 3, 4, or 5 for Harvest help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, 4, o 5 para sa Pag-aani.'",
  "'Invalid reply. Please reply with 1, 2, 3, or 4 for Harvest help.\\n\\nHindi wastong sagot. Sumagot ng 1, 2, 3, o 4 para sa Pag-aani.'"
);

// 2. Fix finishHelpReply to send MORE_HELP_MENU instead of clearing session
const targetFinish = `  // Clear the help session
  await clearHelpSession(phone, workerId);

  console.log(\`[Receiver] 🆘 Help sub-reply processed: \${workerName} → \${helpType.label}\`);`;

const replaceFinish = `  // Transition to MORE_HELP_PROMPT
  await db.execute(
    \`UPDATE help_sessions SET step='MORE_HELP_PROMPT', created_at=NOW() WHERE phone=? OR \${phoneMatchExpr('phone')} = ? ORDER BY created_at DESC LIMIT 1\`,
    [phone, phoneKey(phone)]
  );
  await queueAutoReply(phone, MORE_HELP_MENU, workerId);

  console.log(\`[Receiver] 🆘 Help sub-reply processed: \${workerName} → \${helpType.label} (Prompting MORE_HELP)\`);`;

content = content.replace(targetFinish, replaceFinish);

// 3. Fix the duplicate session declaration at line 1009
const targetDupSession = `        }
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session && session.step === 'OTHER_HELP_DESC') {`;

const replaceDupSession = `        }
        if (session && session.step === 'OTHER_HELP_DESC') {`;

content = content.replace(targetDupSession, replaceDupSession);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Applied all requested fixes!");
