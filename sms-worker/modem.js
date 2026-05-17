const { SerialPort } = require('serialport');

let port = null;
let isConnected = false;
let isBusy = false;
const commandQueue = [];

const COM_PORT  = process.env.COM_PORT  || 'COM7';
const BAUD_RATE = parseInt(process.env.BAUD_RATE) || 9600;

// ─── Connection ───────────────────────────────────────────────────────────────

function connectModem() {
  console.log(`[Modem] Connecting to ${COM_PORT}...`);
  port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE, autoOpen: false });
  port.setMaxListeners(30);

  port.open((err) => {
    if (err) {
      console.log(`[Modem] ⚠️  Cannot open ${COM_PORT}. Retrying in 5s...`);
      isConnected = false;
      setTimeout(connectModem, 5000);
      return;
    }
    isConnected = true;
    console.log(`[Modem] ✅ Connected on ${COM_PORT}`);
  });

  port.on('close', () => {
    console.log('[Modem] ⚠️  Disconnected. Reconnecting in 5s...');
    isConnected = false;
    isBusy = false;
    commandQueue.length = 0;
    setTimeout(connectModem, 5000);
  });

  port.on('error', (err) => {
    console.log('[Modem] ❌ Error:', err.message);
    isConnected = false;
    isBusy = false;
    setTimeout(connectModem, 5000);
  });
}

// ─── Command Queue ────────────────────────────────────────────────────────────

function enqueueCommand(fn) {
  return new Promise((resolve, reject) => {
    commandQueue.push({ fn, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isBusy || commandQueue.length === 0) return;
  isBusy = true;
  const { fn, resolve, reject } = commandQueue.shift();
  try {
    const result = await fn();
    resolve(result);
  } catch (err) {
    reject(err);
  } finally {
    isBusy = false;
    processQueue();
  }
}

// ─── Raw AT Command Sender ────────────────────────────────────────────────────
//
// terminator controls resolution:
//   'ok'     — waits for \nOK or \nERROR  (default, all normal AT commands)
//   'prompt' — waits for '>'              (AT+CMGS="phone", waiting for body prompt)
//   'cmgs'   — waits for +CMGS: or ERROR  (message body + \x1A, NOT '>')
//
// For 'cmgs': sendCommand still appends \r which is required — without \r the
// modem ignores \x1A and shows another '>' prompt instead of sending.

function sendCommand(cmd, timeoutMs = 8000, terminator = 'ok') {
  return new Promise((resolve) => {
    if (!isConnected || !port || !port.isOpen) {
      resolve('ERROR: Modem not connected');
      return;
    }

    let response = '';
    let timer;

    const onData = (data) => {
      response += data.toString();
      let done = false;

      if (terminator === 'prompt') {
        // Resolve only on SMS body prompt
        if (response.includes('>')) done = true;
      } else if (terminator === 'cmgs') {
        // Resolve on send success/failure — NOT on '>'
        // Without this, the modem echo of '>' would resolve early
        if (
          response.includes('+CMGS:')     ||
          response.includes('+CMS ERROR') ||
          response.includes('\nERROR')
        ) done = true;
      } else {
        // Default: normal AT command
        if (
          response.includes('\nOK')       ||
          response.includes('\nERROR')    ||
          response.includes('+CMS ERROR') ||
          response.includes('+CME ERROR')
        ) done = true;
      }

      if (done) {
        clearTimeout(timer);
        port.removeListener('data', onData);
        resolve(response.trim());
      }
    };

    port.on('data', onData);
    port.write(cmd + '\r');   // \r is ALWAYS appended — required for \x1A to work

    timer = setTimeout(() => {
      port.removeListener('data', onData);
      resolve(response.trim());
    }, timeoutMs);
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function initModem() {
  // Flush any stuck SMS entry state from previous crash (ESC cancels '>' prompt)
  if (port && port.isOpen) {
    port.write('\x1B\r');
    await new Promise(r => setTimeout(r, 600));
  }

  const r1 = await enqueueCommand(() => sendCommand('AT', 3000, 'ok'));
  console.log('[Modem] AT:', r1.includes('OK') ? 'OK' : r1);

  // Disable echo so the modem doesn't echo our commands into parse output
  await enqueueCommand(() => sendCommand('ATE0', 2000, 'ok'));

  // Text mode
  const r2 = await enqueueCommand(() => sendCommand('AT+CMGF=1', 3000, 'ok'));
  console.log('[Modem] CMGF (text mode):', r2.includes('OK') ? 'OK' : r2);

  // FIX: Use "MT" for reading — MT = combined SIM (SM) + phone (ME) memory.
  // This means AT+CMGL="ALL" finds messages no matter where the modem stored them.
  // "SM" for write and receive means new messages are stored on the SIM card.
  const r3 = await enqueueCommand(() => sendCommand('AT+CPMS="MT","SM","SM"', 3000, 'ok'));
  console.log('[Modem] CPMS storage:', r3.includes('OK') || r3.includes('+CPMS:') ? 'OK' : r3);

  // Read current CPMS state so we can confirm storage slots in the log
  const r3b = await enqueueCommand(() => sendCommand('AT+CPMS?', 3000, 'ok'));
  console.log('[Modem] CPMS status:', r3b.replace(/\r?\n/g, ' ').trim());

  // Store new SMS in memory and notify with +CMTI.
  // CNMI=2,2 routes many modems' incoming SMS directly to serial as +CMT
  // instead of storing it, so the polling loop's AT+CMGL never sees replies.
  const r4 = await enqueueCommand(() => sendCommand('AT+CNMI=2,1,0,0,0', 3000, 'ok'));
  console.log('[Modem] CNMI (receive mode):', r4.includes('OK') ? 'OK' : r4);

  console.log('[Modem] ✅ Initialized. Ready to send and receive.');
}

function sendSMS(phone, message) {
  return enqueueCommand(async () => {
    if (!isConnected) throw new Error('Modem not connected');

    // Prefix every outgoing message so workers see "AniAlerto" as the source.
    const body = `AniAlerto: ${message}`;

    let lastError;
    try {
      // Step 1: Request SMS entry, wait for '>' prompt
      const r1 = await sendCommand(`AT+CMGS="${phone}"`, 5000, 'prompt');
      if (!r1.includes('>')) throw new Error('No SMS prompt. Got: ' + r1);

      // Step 2: Send body + Ctrl+Z. Use 20s timeout — +CMTI notifications from
      // other incoming SMS can delay the +CMGS: ack by several seconds.
      const r2 = await sendCommand(body + '\x1A', 20000, 'cmgs');
      if (!r2.includes('+CMGS:')) throw new Error('Send failed: ' + r2);
      return true;
    } catch (err) {
      lastError = err;
    }

    // ── Modem recovery after failure ────────────────────────────────────────
    // Send ESC to cancel any pending AT+CMGS body-entry state, then wait for
    // the modem to fully settle. Without this, the next AT+CMGL call gets a
    // polluted buffer and returns no messages — causing workers whose replies
    // arrived during the failed send to never be processed.
    if (port && port.isOpen) {
      port.write('\x1B\r');
      await new Promise(r => setTimeout(r, 1200));
    }
    throw lastError;
  });
}


function readAllSMS() {
  return enqueueCommand(async () => {
    if (!isConnected) return [];
    // MT storage covers both SIM (SM) and phone (ME) memory combined,
    // so we find messages regardless of where the modem decided to store them.
    const raw = await sendCommand('AT+CMGL="ALL"', 10000, 'ok');
    if (!raw.includes('+CMGL:')) {
      // Only log this occasionally to avoid log spam (caller logs on interval)
      return [];
    }
    return parseSMSList(raw);
  });
}

function deleteSMS(index) {
  return enqueueCommand(() => {
    if (!isConnected) return Promise.resolve();
    return sendCommand(`AT+CMGD=${index}`, 3000, 'ok');
  });
}

// ─── SMS Parser ───────────────────────────────────────────────────────────────

function decodeUCS2(hex) {
  try {
    let result = '';
    for (let i = 0; i < hex.length; i += 4) {
      result += String.fromCharCode(parseInt(hex.substr(i, 4), 16));
    }
    return result.trim();
  } catch (e) {
    return hex;
  }
}

function isUCS2(text) {
  return /^([0-9A-Fa-f]{4})+$/.test(text.replace(/\s/g, ''));
}

function isShortCode(phone) {
  const clean = phone.replace(/[^0-9]/g, '');
  return clean.length >= 4 && clean.length <= 8
    && !phone.startsWith('+')
    && !/^09\d{9}$/.test(phone);
}

function parseSMSList(raw) {
  const messages = [];
  const lines = raw.split('\n').map(l => l.replace(/\r/g, ''));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handles all common SIM800 header formats — date/time is optional
    const header = line.match(
      /\+CMGL:\s*(\d+)\s*,\s*"[^"]*"\s*,\s*"([^"]*)"\s*(?:,\s*(?:"[^"]*")?\s*(?:,\s*"([^"]*)")?)?/
    );
    if (!header) continue;

    const index = parseInt(header[1]);
    const phone = header[2].trim();
    const timestamp = header[3] ? header[3].trim() : '';

    // Collect body lines until the next header or end of response
    const bodyLines = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith('+CMGL:') && lines[j] !== 'OK') {
      const bl = lines[j].trim();
      if (bl.length > 0) bodyLines.push(bl);
      j++;
    }

    if (bodyLines.length === 0) continue;
    let text = bodyLines.join(' ').trim();

    // Skip Globe/TM operator short codes
    if (isShortCode(phone)) continue;

    // Decode UCS2 hex encoding if needed
    if (isUCS2(text)) {
      text = decodeUCS2(text.replace(/\s/g, ''));
      console.log(`[Modem] 🔤 Decoded UCS2 from ${phone}: "${text}"`);
    }

    messages.push({ index, phone, timestamp, text });
  }

  return messages;
}

function getConnectionStatus() { return isConnected; }

module.exports = { connectModem, initModem, sendSMS, readAllSMS, deleteSMS, getConnectionStatus };
