require('dotenv').config();
const mysql = require('mysql2/promise');
const receiver = require('./receiver');
const modem = require('./modem');

// Mock modem read/delete to simulate incoming messages while hardware is offline
modem.readAllSMS = async () => {
  return [
    { index: 999, phone: '+639171329989', timestamp: '', text: 'DONE' },
    { index: 998, phone: '+639682186081', timestamp: '', text: 'DONE' },
    { index: 997, phone: '+639688700922', timestamp: '', text: 'DONE' }
  ];
};
modem.deleteSMS = async () => {};

// We have to mock the modem's readAllSMS in the receiver module directly
// because receiver.js requires it internally
const path = require('path');
const receiverModule = require.cache[require.resolve('./receiver')];
// No need to hack the require cache, we can just replace it in the modem export!
// Wait, receiver.js does: const { readAllSMS, deleteSMS } = require('./modem');
// So it grabbed the original references at require time. We must reload receiver after mocking!

async function run() {
  const db = await mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASS, database: process.env.DB_NAME,
    timezone: '+08:00'
  });
  db.on('connection', c => c.query("SET time_zone = '+08:00'"));
  
  // Call processIncoming directly with the mocked messages
  const mockMessages = [
    { index: 999, phone: '+639171329989', timestamp: '', text: 'DONE' },
    { index: 998, phone: '+639682186081', timestamp: '', text: 'DONE' },
    { index: 997, phone: '+639688700922', timestamp: '', text: 'DONE' }
  ];
  
  receiver.setDB(db);
  console.log("Simulating incoming SMS replies...");
  await receiver.processIncoming(mockMessages);
  console.log("Simulation complete!");
  
  await db.end();
}
run();
