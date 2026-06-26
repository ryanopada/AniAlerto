const { SerialPort } = require('serialport');
const COM_PORT = 'COM6';
const BAUD_RATE = 9600;

const port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE });

let buffer = '';

port.on('open', () => {
  console.log(`✅ Connected on ${COM_PORT}`);
  
  port.write('AT\r');
  
  setTimeout(() => {
    port.write('AT+CMGF=1\r');
  }, 1000);

  setTimeout(() => {
    // Delete all messages from all storage (1,4 means delete all)
    console.log("Flushing all messages from modem...");
    port.write('AT+CMGD=1,4\r');
  }, 2000);

  setTimeout(() => {
    port.write('AT+CPMS?\r');
  }, 4000);

  setTimeout(() => {
    console.log("\n=== MODEM RESPONSE ===");
    console.log(buffer);
    process.exit(0);
  }, 6000);
});

port.on('data', (data) => {
  buffer += data.toString();
});

port.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
