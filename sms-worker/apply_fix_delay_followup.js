const fs = require('fs');
let content = fs.readFileSync('receiver.js', 'utf8');

const targetIntercept = `        const delaySession = await getDelaySession(normalizedPhone, workerId);
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
          );

          await clearDelaySession(normalizedPhone, workerId);

          await db.execute(
            \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
             VALUES (?, ?, ?, NOW())\`,
            [normalizedPhone, sms.text, 'DELAY_REASON']
          );

          await queueAutoReply(normalizedPhone, \`Reason recorded. Thank you.\\n\\nNaitala ang dahilan. Salamat.\`, workerId);
          await deleteSMS(sms.index).catch(() => { });
          continue;
        }`;

const replacementIntercept = `        const delaySession = await getDelaySession(normalizedPhone, workerId);
        if (delaySession) {
          const numReply = sms.text.trim();
          
          if (numReply === '1') {
            const delayReason = 'Matinding Init';
            console.log(\`[Receiver] 📝 Delay reason received from \${workerName}: "\${delayReason}"\`);
            await db.execute(
              \`UPDATE alerts SET delay_reason = ? WHERE type = 'DELAY' AND worker_id = ? AND delay_reason IS NULL ORDER BY created_at DESC LIMIT 1\`,
              [delayReason, workerId]
            );
            await clearDelaySession(normalizedPhone, workerId);
            await db.execute(
              \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, ?, NOW())\`,
              [normalizedPhone, numReply, 'DELAY_REASON']
            );
            const msg1 = "Naitala na ang iyong dahilan ng pagka-delay: Matinding Init.\\n\\nPaalala:\\n1.1 Iwasan ang pagtatrabaho sa oras ng matinding init kung maaari.\\n1.2 Dagdagan ang irigasyon kung kinakailangan.\\n1.3 Regular na subaybayan ang soil moisture at kalagayan ng irigasyon.";
            await queueAutoReply(normalizedPhone, msg1, workerId);
            await deleteSMS(sms.index).catch(() => { });
            continue;
          } else if (numReply === '2') {
            const delayReason = 'Malakas na Ulan at Posibleng Pagbaha';
            console.log(\`[Receiver] 📝 Delay reason received from \${workerName}: "\${delayReason}"\`);
            await db.execute(
              \`UPDATE alerts SET delay_reason = ? WHERE type = 'DELAY' AND worker_id = ? AND delay_reason IS NULL ORDER BY created_at DESC LIMIT 1\`,
              [delayReason, workerId]
            );
            await clearDelaySession(normalizedPhone, workerId);
            await db.execute(
              \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, ?, NOW())\`,
              [normalizedPhone, numReply, 'DELAY_REASON']
            );
            const msg2 = "Naitala na ang iyong dahilan ng pagka-delay: Malakas na Ulan at Posibleng Pagbaha.\\n\\nPaalala:\\n2.1 Itigil muna ang mga gawain sa irigasyon kung kinakailangan.\\n2.2 Maging alerto sa posibleng pagbaha o waterlogging.\\n2.3 Regular na suriin ang drainage system at kondisyon ng sakahan.";
            await queueAutoReply(normalizedPhone, msg2, workerId);
            await deleteSMS(sms.index).catch(() => { });
            continue;
          } else if (numReply === '3') {
            const delayReason = 'Wala sa Pagpipilian';
            console.log(\`[Receiver] 📝 Delay reason received from \${workerName}: "\${delayReason}"\`);
            await db.execute(
              \`UPDATE alerts SET delay_reason = ? WHERE type = 'DELAY' AND worker_id = ? AND delay_reason IS NULL ORDER BY created_at DESC LIMIT 1\`,
              [delayReason, workerId]
            );
            // DO NOT clear delaySession so we can capture their exact reason
            await db.execute(
              \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, ?, NOW())\`,
              [normalizedPhone, numReply, 'DELAY_REASON']
            );
            const msg3 = "Wala sa mga pagpipilian ang iyong dahilan ng pagka-delay. Pakilagay ang eksaktong dahilan ng delay.";
            await queueAutoReply(normalizedPhone, msg3, workerId);
            await deleteSMS(sms.index).catch(() => { });
            continue;
          } else {
            // It's either an invalid menu reply or their exact custom reason
            const cleanText = sms.text.replace(/[^a-zA-Z0-9]/g, '');
            if (cleanText.length < 4) {
              console.log(\`[Receiver] ⚠️  Invalid delay reason from \${workerName}\`);
              await queueAutoReply(normalizedPhone, \`AniAlerto: Invalid reply. Please reply with 1, 2, or 3, or provide a valid reason.\\n\\nMangyaring sumagot ng 1, 2, o 3 lamang.\`, workerId);
              await deleteSMS(sms.index).catch(() => { });
              continue;
            }
            // It's their exact reason!
            console.log(\`[Receiver] 📝 Exact delay reason received from \${workerName}: "\${sms.text}"\`);
            await db.execute(
              \`UPDATE alerts SET delay_reason = ? WHERE type = 'DELAY' AND worker_id = ? AND (delay_reason IS NULL OR delay_reason = 'Wala sa Pagpipilian') ORDER BY created_at DESC LIMIT 1\`,
              [sms.text, workerId]
            );
            await clearDelaySession(normalizedPhone, workerId);
            await db.execute(
              \`INSERT IGNORE INTO inbound_messages (phone, message, command, received_at) VALUES (?, ?, ?, NOW())\`,
              [normalizedPhone, sms.text, 'DELAY_REASON']
            );
            await queueAutoReply(normalizedPhone, \`Reason recorded. Thank you.\\n\\nNaitala ang dahilan. Salamat.\`, workerId);
            await deleteSMS(sms.index).catch(() => { });
            continue;
          }
        }`;

content = content.replace(targetIntercept, replacementIntercept);
fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Updated DELAY follow-up messages successfully!");
