const fs = require('fs');
let content = fs.readFileSync('receiver.js', 'utf8');

// The goal is to replace clearHelpSession with an UPDATE to MORE_HELP_PROMPT
// and queue the MORE_HELP_MENU message.

content = content.replace(
  /await clearHelpSession\(phone, workerId\);\s+console\.log\(`\[Receiver\] 🆘 Help sub-reply processed: \${workerName} → \${helpType\.label}`\);/g,
  `// Transition to MORE_HELP_PROMPT
  await db.execute(
    \`UPDATE help_sessions SET step='MORE_HELP_PROMPT', created_at=NOW() WHERE (phone=? OR \${phoneMatchExpr('phone')} = ?) AND worker_id=? ORDER BY created_at DESC LIMIT 1\`,
    [phone, phoneKey(phone), workerId]
  );
  await queueAutoReply(phone, MORE_HELP_MENU, workerId);

  console.log(\`[Receiver] 🆘 Help sub-reply processed: \${workerName} → \${helpType.label} (Prompting MORE_HELP)\`);`
);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Applied MORE_HELP_MENU logic to finishHelpReply!");
