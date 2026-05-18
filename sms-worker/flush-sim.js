/**
 * flush-sim.js — Delete ALL messages from the modem SIM/memory.
 * Run once to clear spam so the modem can receive new worker replies.
 * Usage: node flush-sim.js
 */
require('dotenv').config();
const { SerialPort } = require('serialport');

const COM_PORT  = process.env.COM_PORT  || 'COM7';
const BAUD_RATE = parseInt(process.env.BAUD_RATE) || 9600;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

let port;

function sendRaw(cmd, waitMs = 5000) {
  return new Promise((resolve) => {
    let response = '';
    let timer;
    const onData = (data) => {
      const chunk = data.toString();
      response += chunk;
      process.stdout.write(chunk);
      if (response.includes('\nOK') || response.includes('\nERROR')) {
        clearTimeout(timer);
        port.removeListener('data', onData);
        resolve(response.trim());
      }
    };
    port.on('data', onData);
    console.log(`\n>>> ${cmd}`);
    port.write(cmd + '\r');
    timer = setTimeout(() => {
      port.removeListener('data', onData);
      resolve(response.trim());
    }, waitMs);
  });
}

async function run() {
  console.log('=== AniAlerto SIM Flush ===');
  console.log(`Port: ${COM_PORT}  Baud: ${BAUD_RATE}\n`);

  port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE, autoOpen: false });

  await new Promise((resolve, reject) => {
    port.open(err => {
      if (err) { reject(err); return; }
      console.log(`✅ Port ${COM_PORT} opened.\n`);
      resolve();
    });
  });

  await delay(1000);

  // Handshake
  await sendRaw('AT');

  // Text mode
  await sendRaw('AT+CMGF=1');

  // Use MT storage (covers SIM + phone memory)
  await sendRaw('AT+CPMS="MT","SM","SM"');

  // Show what's on the modem BEFORE delete
  console.log('\n--- Messages BEFORE flush ---');
  await sendRaw('AT+CMGL="ALL"', 10000);

  // Delete ALL messages (flag 4 = all messages regardless of status)
  console.log('\n--- Deleting ALL messages (AT+CMGD=1,4) ---');
  await sendRaw('AT+CMGD=1,4', 10000);

  // Verify empty
  console.log('\n--- Messages AFTER flush (should be empty) ---');
  const after = await sendRaw('AT+CMGL="ALL"', 10000);

  if (!after.includes('+CMGL:')) {
    console.log('\n✅ SIM is now EMPTY. Modem can receive new messages.');
  } else {
    console.warn('\n⚠️  Some messages still remain — try running again.');
  }

  port.close();
  console.log('\n✅ Done. You can now restart the worker: node index.js');
}

run().catch(err => {
  console.error('FATAL:', err.message);
  if (port && port.isOpen) port.close();
  process.exit(1);
});
