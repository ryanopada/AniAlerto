/**
 * AniAlerto Modem Diagnostic Tool
 * Run: node test-modem.js
 *
 * This script directly talks to the modem and prints every step.
 * Use this to diagnose receive problems WITHOUT starting the full worker.
 */

require('dotenv').config();
const { SerialPort } = require('serialport');

const COM_PORT  = process.env.COM_PORT  || 'COM7';
const BAUD_RATE = parseInt(process.env.BAUD_RATE) || 9600;

let port;

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function sendRaw(cmd, waitMs = 5000) {
  return new Promise((resolve) => {
    let response = '';
    let timer;

    const onData = (data) => {
      const chunk = data.toString();
      response += chunk;
      process.stdout.write(chunk); // Show raw output live
      if (response.includes('\nOK') || response.includes('\nERROR') || response.includes('>')) {
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
  console.log('=================================================');
  console.log('   AniAlerto Modem Diagnostic');
  console.log(`   Port: ${COM_PORT}  Baud: ${BAUD_RATE}`);
  console.log('=================================================\n');

  port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE, autoOpen: false });

  await new Promise((resolve, reject) => {
    port.open((err) => {
      if (err) { reject(err); return; }
      console.log(`✅ Port ${COM_PORT} opened.\n`);
      resolve();
    });
  });

  await delay(1000);

  // Step 1: Basic AT handshake
  console.log('\n--- Step 1: AT handshake ---');
  const at = await sendRaw('AT');
  if (!at.includes('OK')) {
    console.error('❌ Modem not responding! Check COM port and baud rate.');
    port.close(); return;
  }
  console.log('✅ Modem alive.');

  // Step 2: Set text mode
  console.log('\n--- Step 2: Text mode (AT+CMGF=1) ---');
  await sendRaw('AT+CMGF=1');

  // Step 3: Set receive mode
  console.log('\n--- Step 3: Receive mode (AT+CNMI=2,2,0,0,0) ---');
  const cnmi = await sendRaw('AT+CNMI=2,2,0,0,0');
  if (!cnmi.includes('OK')) {
    console.warn('⚠️  CNMI failed — try AT+CNMI=1,2,0,0,0 as fallback');
    await sendRaw('AT+CNMI=1,2,0,0,0');
  }

  // Step 4: Check signal strength
  console.log('\n--- Step 4: Signal strength (AT+CSQ) ---');
  const csq = await sendRaw('AT+CSQ', 3000);
  const csqMatch = csq.match(/\+CSQ:\s*(\d+)/);
  if (csqMatch) {
    const rssi = parseInt(csqMatch[1]);
    const dbm = rssi === 99 ? 'No signal' : `${-113 + rssi * 2} dBm`;
    console.log(`📶 Signal: RSSI=${rssi} (${dbm})`);
    if (rssi < 5) console.warn('⚠️  Very weak signal — messages may not be received!');
  }

  // Step 5: Check SIM card
  console.log('\n--- Step 5: SIM status (AT+CPIN?) ---');
  const cpin = await sendRaw('AT+CPIN?', 3000);
  if (cpin.includes('READY')) {
    console.log('✅ SIM card ready.');
  } else {
    console.error('❌ SIM card not ready:', cpin);
    console.error('   Insert a valid SIM card and try again.');
    port.close(); return;
  }

  // Step 6: Network registration
  console.log('\n--- Step 6: Network registration (AT+CREG?) ---');
  const creg = await sendRaw('AT+CREG?', 3000);
  if (creg.includes(',1') || creg.includes(',5')) {
    console.log('✅ Registered on network.');
  } else {
    console.warn('⚠️  Not registered:', creg);
  }

  // Step 7: Read all stored SMS
  console.log('\n--- Step 7: Read all SMS from SIM (AT+CMGL="ALL") ---');
  const cmgl = await sendRaw('AT+CMGL="ALL"', 10000);

  if (cmgl.includes('+CMGL:')) {
    const count = (cmgl.match(/\+CMGL:/g) || []).length;
    console.log(`\n📬 Found ${count} message(s) on SIM/modem.`);
  } else {
    console.log('\n📭 No messages stored on modem. Send a test SMS to the modem SIM number and wait for the next poll cycle.');
  }

  console.log('\n=================================================');
  console.log('   Diagnostic complete. Leaving port open for');
  console.log('   5 seconds to watch for live +CMTI events...');
  console.log('=================================================\n');

  // Step 8: Listen for live incoming +CMTI notifications
  port.on('data', (data) => {
    const txt = data.toString();
    if (txt.includes('+CMTI:')) {
      console.log(`\n🔔 LIVE INCOMING MESSAGE DETECTED: ${txt.trim()}`);
      console.log('   ✅ Receive is working! The modem is delivering +CMTI notifications.');
    }
  });

  await delay(5000);
  port.close();
  console.log('\n✅ Done. Port closed.');
}

run().catch(err => {
  console.error('FATAL:', err.message);
  if (port && port.isOpen) port.close();
  process.exit(1);
});
