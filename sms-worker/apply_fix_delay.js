const fs = require('fs');

let content = fs.readFileSync('receiver.js', 'utf8');

// 1. Update the DELAY prompt in handleDelay
const targetDelayPrompt = `  // Instead of auto-reminders, we immediately ask the worker for the reason for delay.
  const reasonPromptEN = \`AniAlerto: Reason for delay?\`;
  const reasonPromptTL = \`AniAlerto: Dahilan ng pagka-delay?\`;

  await createDelaySession(phone, workerId);
  await queueAutoReply(phone, reasonPromptEN, workerId);
  await queueAutoReply(phone, reasonPromptTL, workerId);`;

const replacementDelayPrompt = `  // Instead of auto-reminders, we immediately ask the worker for the reason for delay.
  const reasonPrompt = 'AniAlerto: Pakilagay ang dahilan ng pagka-delay:\\n\\n' +
    '1 - Matinding Init (Heat Index >= 38C)\\n' +
    '2 - Malakas na Ulan at Posibleng Pagbaha (Heavy Rainfall)\\n' +
    '3 - Wala sa Pagpipilian\\n\\n' +
    'I-reply lamang ang numero ng iyong sagot.';

  await createDelaySession(phone, workerId);
  await queueAutoReply(phone, reasonPrompt, workerId);`;

content = content.replace(targetDelayPrompt, replacementDelayPrompt);


// 2. Update the DELAY session intercept to accept 1, 2, 3
const targetDelayIntercept = `        const delaySession = await getDelaySession(normalizedPhone, workerId);
        if (delaySession) {
          const cleanText = sms.text.replace(/[^a-zA-Z0-9]/g, '');
          if (cleanText.length < 4) {
            console.log(\`[Receiver] ⚠️  Invalid delay reason from \${workerName}\`);
            await queueAutoReply(normalizedPhone, \`AniAlerto: Please provide a valid reason for delay (at least 4 letters/numbers).\\n\\nMangyaring magbigay ng malinaw na dahilan ng pagka-delay.\`, workerId);
            await deleteSMS(sms.index).catch(() => { });
            continue;
          }

          console.log(\`[Receiver] 📝 Delay reason received from \${workerName}: "\${sms.text}"\`);
          // Store reason in the database
          await db.execute(
            \`UPDATE alerts SET delay_reason = ? 
             WHERE type = 'DELAY' AND worker_id = ? AND delay_reason IS NULL
             ORDER BY created_at DESC LIMIT 1\`,
            [sms.text, workerId]
          );`;

const replacementDelayIntercept = `        const delaySession = await getDelaySession(normalizedPhone, workerId);
        if (delaySession) {
          const numReply = sms.text.trim();
          let delayReason = '';
          
          if (numReply === '1') {
            delayReason = 'Matinding Init';
          } else if (numReply === '2') {
            delayReason = 'Malakas na Ulan at Posibleng Pagbaha';
          } else if (numReply === '3') {
            delayReason = 'Wala sa Pagpipilian';
          } else {
            console.log(\`[Receiver] ⚠️  Invalid delay reason from \${workerName}\`);
            await queueAutoReply(normalizedPhone, \`AniAlerto: Invalid reply. Please reply with 1, 2, or 3.\\n\\nMangyaring sumagot ng 1, 2, o 3 lamang.\`, workerId);
            await deleteSMS(sms.index).catch(() => { });
            continue;
          }

          console.log(\`[Receiver] 📝 Delay reason received from \${workerName}: "\${delayReason}"\`);
          // Store reason in the database
          await db.execute(
            \`UPDATE alerts SET delay_reason = ? 
             WHERE type = 'DELAY' AND worker_id = ? AND delay_reason IS NULL
             ORDER BY created_at DESC LIMIT 1\`,
            [delayReason, workerId]
          );`;

content = content.replace(targetDelayIntercept, replacementDelayIntercept);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Updated DELAY workflow!");
