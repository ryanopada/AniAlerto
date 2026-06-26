const fs = require('fs');

let content = fs.readFileSync('receiver.js', 'utf8');

const replacement = `// ─── DB Helpers ───────────────────────────────────────────────────────────────

// Queue an auto-reply SMS via sms_queue (skip_log=0 → sender WILL create an sms_logs row so it appears on dashboard)
async function queueAutoReply(phone, message, workerId = null) {
  try {
    await db.execute(
      \`INSERT INTO sms_queue (task_id, worker_id, phone, message, status, skip_log, created_at)
       VALUES (NULL, ?, ?, ?, 'Queued', 0, NOW())\`,
      [workerId || null, phone, message]
    );
    console.log(\`[Receiver] 📤 Auto-reply queued → \${phone}: "\${message.substring(0, 60)}"\`);
  } catch (err) {
    console.error(\`[Receiver] ❌ queueAutoReply failed: \${err.message}\`);
  }
}

// ─── Help Session Helpers ─────────────────────────────────────────────────────`;

const target = `}

// ─── Help Session Helpers ─────────────────────────────────────────────────────`;

content = content.replace(target, replacement);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Restored queueAutoReply and set skip_log to 0!");
