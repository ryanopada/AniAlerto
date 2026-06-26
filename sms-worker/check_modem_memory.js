const { SerialPort } = require('serialport');
const COM_PORT = 'COM6';
const BAUD_RATE = 9600;

const port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE });

let buffer = '';

port.on('open', () => {
  console.log(`✅ Connected on ${COM_PORT}`);
  
  // 1. Reset modem
  port.write('AT\r');
  
  setTimeout(() => {
    // 2. Set Text Mode
    port.write('AT+CMGF=1\r');
  }, 1000);

  setTimeout(() => {
    // 3. Check memory status
    port.write('AT+CPMS?\r');
  }, 2000);

  setTimeout(() => {
    // 4. Force read all
    port.write('AT+CMGL="ALL"\r');
  }, 3000);

  setTimeout(() => {
    console.log("\n=== MODEM RESPONSE ===");
    console.log(buffer);
    process.exit(0);
  }, 8000);
});

port.on('data', (data) => {
  buffer += data.toString();
});

port.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
