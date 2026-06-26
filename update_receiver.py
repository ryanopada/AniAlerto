import sys
import io

with io.open('sms-worker/receiver.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
'''  } else if (step === 'MORE_HELP_PROMPT') {
    if (number === '0') {
      await db.execute(UPDATE help_sessions SET step='MAIN_MENU', created_at=NOW() WHERE (phone=? OR worker_id=?), [phone, workerId || 0]);
      await queueAutoReply(phone, HELP_MENU, workerId);
    } else if (number === '9') {
      await db.execute(DELETE FROM help_sessions WHERE (phone=? OR worker_id=?), [phone, workerId || 0]);
      await queueAutoReply(phone, 'Thank you! Goodbye.\\n\\nSalamat! Paalam.', workerId);
    } else {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 0 (Yes) or 9 (No).\\n\\nHindi wastong sagot. Sumagot ng 0 (Oo) o 9 (Hindi).', workerId);
    }
  }''',
'''  } else if (step === 'MORE_HELP_PROMPT') {
    if (number === '1') {
      await db.execute(UPDATE help_sessions SET step='MAIN_MENU', created_at=NOW() WHERE (phone=? OR worker_id=?), [phone, workerId || 0]);
      await queueAutoReply(phone, HELP_MENU, workerId);
    } else if (number === '2') {
      await db.execute(DELETE FROM help_sessions WHERE (phone=? OR worker_id=?), [phone, workerId || 0]);
      await queueAutoReply(phone, 'Thank you! Goodbye.\\n\\nSalamat! Paalam.', workerId);
    } else {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1 (Yes) or 2 (No).\\n\\nHindi wastong sagot. Sumagot ng 1 (Oo) o 2 (Hindi).', workerId);
    }
  }'''
)

content = content.replace(
'''  await queueAutoReply(phone, 'Need any other help? 0 - Yes, 9 - No\\n\\nKailangan mo pa ba ng ibang tulong? 0 - Oo, 9 - Hindi', workerId);''',
'''  await queueAutoReply(phone, 'Need any other help? 1 - Yes, 2 - No\\n\\nKailangan mo pa ba ng ibang tulong? 1 - Oo, 2 - Hindi', workerId);'''
)

content = content.replace(
'''          await queueAutoReply(normalizedPhone, 'Need any other help? 0 - Yes, 9 - No\\n\\nKailangan mo pa ba ng ibang tulong? 0 - Oo, 9 - Hindi', workerId);''',
'''          await queueAutoReply(normalizedPhone, 'Need any other help? 1 - Yes, 2 - No\\n\\nKailangan mo pa ba ng ibang tulong? 1 - Oo, 2 - Hindi', workerId);'''
)

content = content.replace(
'''        if (helpSession.step === 'MORE_HELP_PROMPT') {
          if (textMsg === '0' || textMsg.toUpperCase() === 'YES') {
            await db.execute(UPDATE help_sessions SET step='MAIN_MENU', created_at=NOW() WHERE id=?, [helpSession.id]);
            await queueAutoReply(normalizedPhone, HELP_MENU, workerId);
            await db.execute(
              INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, 'HELP_MORE:YES', NOW()),
              [normalizedPhone, textMsg]
            );
            await deleteSMS(sms.index).catch(() => {});
            continue;
          } else if (textMsg === '9' || textMsg.toUpperCase() === 'NO') {
            await clearHelpSession(normalizedPhone, workerId);
            await queueAutoReply(normalizedPhone, "Salamat. Mag-ingat lagi! (Thank you. Stay safe!)", workerId);
            await db.execute(
              INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, 'HELP_MORE:NO', NOW()),
              [normalizedPhone, textMsg]
            );
            await deleteSMS(sms.index).catch(() => {});
            continue;
          } else {
            await queueAutoReply(normalizedPhone, "Invalid reply. 0 - Yes, 9 - No\\n\\nHindi wastong sagot. 0 - Oo, 9 - Hindi", workerId);
            await deleteSMS(sms.index).catch(() => {});
            continue;
          }''',
'''        if (helpSession.step === 'MORE_HELP_PROMPT') {
          if (textMsg === '1' || textMsg.toUpperCase() === 'YES') {
            await db.execute(UPDATE help_sessions SET step='MAIN_MENU', created_at=NOW() WHERE id=?, [helpSession.id]);
            await queueAutoReply(normalizedPhone, HELP_MENU, workerId);
            await db.execute(
              INSERT IGNORE INTO inbound_messages (phone, message, command, received_at, modem_timestamp) VALUES (?, ?, 'HELP_MORE:YES', NOW(), ?),
              [normalizedPhone, textMsg, sms.timestamp || null]
            );
            await deleteSMS(sms.index).catch(() => {});
            continue;
          } else if (textMsg === '2' || textMsg.toUpperCase() === 'NO') {
            await clearHelpSession(normalizedPhone, workerId);
            await queueAutoReply(normalizedPhone, "Salamat. Mag-ingat lagi! (Thank you. Stay safe!)", workerId);
            await db.execute(
              INSERT IGNORE INTO inbound_messages (phone, message, command, received_at, modem_timestamp) VALUES (?, ?, 'HELP_MORE:NO', NOW(), ?),
              [normalizedPhone, textMsg, sms.timestamp || null]
            );
            await deleteSMS(sms.index).catch(() => {});
            continue;
          } else {
            await queueAutoReply(normalizedPhone, "Invalid reply. 1 - Yes, 2 - No\\n\\nHindi wastong sagot. 1 - Oo, 2 - Hindi", workerId);
            await deleteSMS(sms.index).catch(() => {});
            continue;
          }'''
)

content = content.replace(
'''            await db.execute(
              INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
               VALUES (?, ?, ?, NOW()),
              [normalizedPhone, textMsg, HELP:]
            );''',
'''            await db.execute(
              INSERT IGNORE INTO inbound_messages (phone, message, command, received_at, modem_timestamp)
               VALUES (?, ?, ?, NOW(), ?),
              [normalizedPhone, textMsg, HELP:, sms.timestamp || null]
            );'''
)

content = content.replace(
'''      const [inboundResult] = await db.execute(
        INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
         VALUES (?, ?, ?, NOW()),
        [normalizedPhone, sms.text, command]
      );''',
'''      const [inboundResult] = await db.execute(
        INSERT IGNORE INTO inbound_messages (phone, message, command, received_at, modem_timestamp)
         VALUES (?, ?, ?, NOW(), ?),
        [normalizedPhone, sms.text, command, sms.timestamp || null]
      );'''
)

content = content.replace(
'''    const sig = ${normalizedPhone}||;
    if (recentModemTimestamps.has(sig)) {
      console.log([Receiver] ??  Network Duplicate — skipping processing, purging ());
      await deleteSMS(sms.index).catch(() => {});
      continue;
    }
    recentModemTimestamps.set(sig, Date.now());''',
'''    const sig = ${normalizedPhone}||;
    if (recentModemTimestamps.has(sig)) {
      console.log([Receiver] ??  Network Duplicate — skipping processing, purging ());
      await deleteSMS(sms.index).catch(() => {});
      continue;
    }
    recentModemTimestamps.set(sig, Date.now());

    // DB deduplication for replays across PM2 restarts (only if timestamp exists)
    if (sms.timestamp) {
      const [dupRows] = await db.execute(
        SELECT id FROM inbound_messages WHERE phone = ? AND modem_timestamp = ? AND message = ? LIMIT 1,
        [normalizedPhone, sms.timestamp, text]
      );
      if (dupRows.length > 0) {
        console.log([Receiver] ??  DB Duplicate caught for  (Modem TS: ) - purging);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }
    }'''
)


with io.open('sms-worker/receiver.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
