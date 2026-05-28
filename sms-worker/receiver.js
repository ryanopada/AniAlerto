const { readAllSMS, deleteSMS } = require('./modem');

// Valid first-level commands
const KNOWN_COMMANDS = ['DONE', 'DELAY', 'HELP', 'PEST'];

// ── Bilingual help menu (workers reply 1-6) ────────────────────────────
const HELP_MENU =
  'AniAlerto: What help do you need? Reply with the number:\n' +
  '1 - Irrigation\n' +
  '2 - Fertilizer\n' +
  '3 - Pesticide Spray\n' +
  '4 - Harvest\n' +
  '5 - Field Preparation\n' +
  '6 - Equipment and Safety\n\n' +
  'Anong tulong ang kailangan mo? Sumagot gamit ang numero:\n' +
  '1 - Patubig\n' +
  '2 - Abono\n' +
  '3 - Pesticide Spray\n' +
  '4 - Pag-aani\n' +
  '5 - Paghahanda ng Lupa\n' +
  '6 - Kagamitan';

const IRRIGATION_MENU =
  'AniAlerto: What exactly do you need help in Irrigation? Reply with the number:\n' +
  '1 - Water Source\n' +
  '2 - Coverage\n' +
  '3 - Scheduling\n' +
  '4 - Problems\n\n' +
  'Anong tulong ang kailangan mo sa Patubig? Sumagot gamit ang numero:\n' +
  '1 - Pinagmumulan ng tubig\n' +
  '2 - Saklaw ng tubig\n' +
  '3 - Iskedyul\n' +
  '4 - Problema';

const FERTILIZER_MENU =
  'AniAlerto: What exactly do you need help in Fertilizer / Abono? Reply with the number:\n' +
  '1 - Type\n' +
  '2 - Amount\n' +
  '3 - Application Method\n' +
  '4 - Timing\n' +
  '5 - Problems\n\n' +
  'Anong tulong ang kailangan mo sa Abono? Sumagot gamit ang numero:\n' +
  '1 - Uri\n' +
  '2 - Dami\n' +
  '3 - Paraan ng Pag-aaplay\n' +
  '4 - Oras ng Pag-aaplay\n' +
  '5 - Problema';

const PESTICIDE_MENU =
  'AniAlerto: What exactly do you need help in Pesticide Spray / Pest Control? Reply with the number:\n' +
  '1 - Pest Identification\n' +
  '2 - Spraying Method\n' +
  '3 - Safety Precautions\n' +
  '4 - Timing\n' +
  '5 - Problems\n\n' +
  'Anong tulong ang kailangan mo sa Pesticide Spray / Pest Control? Sumagot gamit ang numero:\n' +
  '1 - Pagkilala sa peste\n' +
  '2 - Paraan ng Pag-spray\n' +
  '3 - Pag-iingat at Kaligtasan\n' +
  '4 - Oras ng Pag-spray\n' +
  '5 - Problema';

const HARVEST_MENU =
  'AniAlerto: What exactly do you need help in Harvest / Pag-aani? Reply with the number:\n' +
  '1 - Maturity Check\n' +
  '2 - Tools\n' +
  '3 - Collection\n' +
  '4 - Storage / Drying\n' +
  '5 - Problems\n\n' +
  'Anong tulong ang kailangan mo sa Pag-aani? Sumagot gamit ang numero:\n' +
  '1 - Pag-check ng pagkahinog\n' +
  '2 - Mga gamit\n' +
  '3 - Pag-aani\n' +
  '4 - Pag-iimbak / Pagpatuyo\n' +
  '5 - Problema';

const FIELD_PREP_MENU =
  'AniAlerto: What exactly do you need help in Field Preparation & Maintenance? Reply with the number:\n' +
  '1 - Land Preparation\n' +
  '2 - Weed Control\n' +
  '3 - Soil Inspection\n\n' +
  'Anong tulong ang kailangan mo sa Field Preparation & Maintenance? Sumagot gamit ang numero:\n' +
  '1 - Paghahanda ng Lupa\n' +
  '2 - Pagkontrol ng Damo\n' +
  '3 - Pagsusuri ng Lupa';

const EQUIPMENT_MENU =
  'AniAlerto: What exactly do you need help in Equipment & Safety? Reply with the number:\n' +
  '1 - Tool Check\n' +
  '2 - Safety Gear\n' +
  '3 - Maintenance\n\n' +
  'Anong tulong ang kailangan mo sa Equipment & Safety? Sumagot gamit ang numero:\n' +
  '1 - Pagsusuri ng mga Gamit\n' +
  '2 - Kagamitang Panseguridad\n' +
  '3 - Pagpapanatili / Maintenance';

// ── Help sub-type responses (English + blank line + Tagalog) ──────────────
const IRRIGATION_TYPES = {
  '1': {
    label: 'Irrigation - Water Source',
    msg:
      'AniAlerto: Irrigation Help (Water Source):\n' +
      '1.1 Check water availability\n' +
      '1.2 Ensure pump is operational\n' +
      '1.3 Inspect hoses and tubing for leaks or blockages\n\n' +
      'Tulong sa Patubig (Pinagmumulan ng tubig):\n' +
      '1.1 Siguraduhing may sapat na tubig\n' +
      '1.2 Siguraduhing gumagana ang pump\n' +
      '1.3 Suriin ang hoses at tubo para sa tulo o bara',
  },
  '2': {
    label: 'Irrigation - Coverage',
    msg:
      'AniAlerto: Irrigation Help (Coverage):\n' +
      '1.2.1 Ensure water reaches all plants evenly\n' +
      '1.2.2 Check plants at edges for adequate coverage\n' +
      '1.2.3 Adjust flow to avoid overwatering or underwatering\n' +
      '1.2.4 Monitor plant health and soil moisture after irrigation\n\n' +
      'Tulong sa Patubig (Saklaw ng tubig):\n' +
      '1.2.1 Siguraduhing pantay ang pag-abot ng tubig sa lahat ng halaman\n' +
      '1.2.2 Suriin ang mga halaman sa gilid ng taniman para sa sapat na saklaw\n' +
      '1.2.3 I-adjust ang daloy ng tubig upang hindi masobrahan o kulang\n' +
      '1.2.4 Obserbahan ang kalusugan ng halaman at kahalumigmigan ng lupa pagkatapos patubigan',
  },
  '3': {
    label: 'Irrigation - Scheduling',
    msg:
      'AniAlerto: Irrigation Help (Scheduling):\n' +
      '1.3.1 Follow batch-specific irrigation schedule\n' +
      '1.3.2 Adjust schedule based on rainfall or dry spells\n' +
      '1.3.3 Record irrigation date and time for monitoring\n' +
      '1.3.4 Communicate changes to Admin if adjustments are needed\n\n' +
      'Tulong sa Patubig (Iskedyul):\n' +
      '1.3.1 Sundin ang batch-specific na iskedyul ng patubig\n' +
      '1.3.2 I-adjust ang iskedyul batay sa ulan o tagtuyot\n' +
      '1.3.3 I-record ang petsa at oras ng patubig para sa monitoring\n' +
      '1.3.4 Ipaalam sa Admin kung kailangan baguhin ang iskedyul',
  },
  '4': {
    label: 'Irrigation - Problems',
    msg:
      'AniAlerto: Irrigation Help (Problems):\n' +
      '1.4.1 Identify leaks in hoses or pipes\n' +
      '1.4.2 Clear any blockages in tubing or valves\n' +
      '1.4.3 Check pump and water source functionality\n' +
      '1.4.4 Contact Admin if the issue persists or is unresolved\n\n' +
      'Tulong sa Patubig (Problema):\n' +
      '1.4.1 Tukuyin ang mga tulo sa hoses o tubo\n' +
      '1.4.2 Linisin ang anumang bara sa tubo o balbula\n' +
      '1.4.3 Suriin ang pump at pinagmumulan ng tubig\n' +
      '1.4.4 Makipag-ugnayan sa Admin kung hindi maayos ang problema',
  },
};

const FERTILIZER_TYPES = {
  '1': {
    label: 'Fertilizer - Type',
    msg:
      'AniAlerto: Fertilizer Help (Type):\n' +
      '2.1.1 Basal\n' +
      '2.1.2 Side-dressing\n' +
      '2.1.3 Micronutrients\n\n' +
      'Tulong sa Abono - Uri:\n' +
      '2.1.1 Basal\n' +
      '2.1.2 Side-dressing\n' +
      '2.1.3 Micronutrients',
  },
  '2': {
    label: 'Fertilizer - Amount',
    msg:
      'AniAlerto: Fertilizer Help (Amount):\n' +
      '2.2.1 Check batch allocation\n' +
      '2.2.2 Verify weight\n\n' +
      'Tulong sa Abono (Dami):\n' +
      '2.2.1 Suriin ang allocation ng batch\n' +
      '2.2.2 Siguraduhing tama ang timbang',
  },
  '3': {
    label: 'Fertilizer - Application Method',
    msg:
      'AniAlerto: Fertilizer Help (Application Method):\n' +
      '2.3.1 Spread evenly\n' +
      '2.3.2 Follow sprayer instructions\n' +
      '2.3.3 Wear safety gear\n\n' +
      'Tulong sa Abono (Paraan ng Pag-aaplay):\n' +
      '2.3.1 Pantayin ang pagkalat ng abono\n' +
      '2.3.2 Sundin ang instructions ng sprayer\n' +
      '2.3.3 Gumamit ng tamang safety gear',
  },
  '4': {
    label: 'Fertilizer - Timing',
    msg:
      'AniAlerto: Fertilizer Help (Timing):\n' +
      '2.4.1 Abono 1 -> 15 days after Plant Date\n' +
      '2.4.2 Abono 2 -> 40 days after Plant Date\n\n' +
      'Tulong sa Abono (Oras ng Pag-aaplay):\n' +
      '2.4.1 Abono 1 -> 15 araw matapos itanim\n' +
      '2.4.2 Abono 2 -> 40 araw matapos itanim',
  },
  '5': {
    label: 'Fertilizer - Problems',
    msg:
      'AniAlerto: Fertilizer Help (Problems):\n' +
      '2.5.1 Missing materials\n' +
      '2.5.2 Uneven application\n' +
      '2.5.3 Contact Admin\n\n' +
      'Tulong sa Abono (Problema):\n' +
      '2.5.1 Kulang ang materyales\n' +
      '2.5.2 Hindi pantay ang pag-aaplay\n' +
      '2.5.3 Makipag-ugnayan sa Admin',
  },
};

const PESTICIDE_TYPES = {
  '1': {
    label: 'Pesticide - Pest Identification',
    msg:
      'AniAlerto: Pesticide Help - Pest Identification:\n' +
      '3.1.1 Fall armyworm (Uod)\n' +
      '3.1.2 Weeds (Damo)\n' +
      '3.1.3 Others\n\n' +
      'Tulong sa Pesticide Spray / Pest Control - Pagkilala sa peste:\n' +
      '3.1.1 Uod (Fall armyworm)\n' +
      '3.1.2 Damo\n' +
      '3.1.3 Iba pa',
  },
  '2': {
    label: 'Pesticide - Spraying Method',
    msg:
      'AniAlerto: Pesticide Help - Spraying Method:\n' +
      '3.2.1 Dilute pesticide correctly\n' +
      '3.2.2 Spray evenly\n\n' +
      'Tulong sa Pesticide Spray / Pest Control - Paraan ng Pag-spray:\n' +
      '3.2.1 Tunay na ihalo ang pesticide ayon sa label\n' +
      '3.2.2 Siguraduhing pantay ang pag-spray sa lahat ng halaman',
  },
  '3': {
    label: 'Pesticide - Safety Precautions',
    msg:
      'AniAlerto: Pesticide Help - Safety Precautions:\n' +
      '3.3.1 Wear gloves/mask\n' +
      '3.3.2 Avoid wind drift\n\n' +
      'Tulong sa Pesticide Spray / Pest Control - Pag-iingat at Kaligtasan:\n' +
      '3.3.1 Gumamit ng gloves at mask\n' +
      '3.3.2 Iwasang maipadala ang pesticide ng hangin sa ibang lugar',
  },
  '4': {
    label: 'Pesticide - Timing',
    msg:
      'AniAlerto: Pesticide Help - Timing:\n' +
      '3.4.1 Pang-uod -> 15 days after Plant Date\n' +
      '3.4.2 Pang-damo -> 20 days after Plant Date\n\n' +
      'Tulong sa Pesticide Spray / Pest Control - Oras ng Pag-spray:\n' +
      '3.4.1 Pang-uod -> 15 araw matapos itanim\n' +
      '3.4.2 Pang-damo -> 20 araw matapos itanim',
  },
  '5': {
    label: 'Pesticide - Problems',
    msg:
      'AniAlerto: Pesticide Help - Problems:\n' +
      '3.5.1 Spray not reaching plants\n' +
      '3.5.2 Missing PPE\n' +
      '3.5.3 Contact Admin\n\n' +
      'Tulong sa Pesticide Spray / Pest Control - Problema:\n' +
      '3.5.1 Hindi abot ng spray ang halaman\n' +
      '3.5.2 Walang sapat na PPE\n' +
      '3.5.3 Makipag-ugnayan sa Admin',
  },
};

const HARVEST_TYPES = {
  '1': {
    label: 'Harvest - Maturity Check',
    msg:
      'AniAlerto: Harvest Help - Maturity Check:\n' +
      '4.1.1 Kernel black layer formation\n' +
      '4.1.2 Husk color change\n' +
      '4.1.3 Moisture content 20-25%\n\n' +
      'Tulong sa Pag-aani - Pag-check ng pagkahinog:\n' +
      '4.1.1 Pagkakaroon ng black layer sa kernel\n' +
      '4.1.2 Pagbabago ng kulay ng husk\n' +
      '4.1.3 Halumigmig ng butil 20-25%',
  },
  '2': {
    label: 'Harvest - Tools',
    msg:
      'AniAlerto: Harvest Help - Tools:\n' +
      '4.2.1 Sickle\n' +
      '4.2.2 Tarpaulin / Basket\n\n' +
      'Tulong sa Pag-aani - Mga gamit:\n' +
      '4.2.1 Karit\n' +
      '4.2.2 Tarpaulin / Basket',
  },
  '3': {
    label: 'Harvest - Collection',
    msg:
      'AniAlerto: Harvest Help - Collection:\n' +
      '4.3.1 Cut crops carefully\n' +
      '4.3.2 Gather fallen corn\n\n' +
      'Tulong sa Pag-aani - Pag-aani:\n' +
      '4.3.1 Maingat na pagputol ng tanim\n' +
      '4.3.2 Paglikom ng mga nahulog na mais',
  },
  '4': {
    label: 'Harvest - Storage/Drying',
    msg:
      'AniAlerto: Harvest Help - Storage / Drying:\n' +
      '4.4.1 Sun drying\n' +
      '4.4.2 Mechanical dryer\n\n' +
      'Tulong sa Pag-aani - Pag-iimbak / Pagpatuyo:\n' +
      '4.4.1 Patuyuin sa araw\n' +
      '4.4.2 Gumamit ng mechanical dryer',
  },
  '5': {
    label: 'Harvest - Problems',
    msg:
      'AniAlerto: Harvest Help - Problems:\n' +
      '4.5.1 Damaged kernels\n' +
      '4.5.2 Missing tools\n' +
      '4.5.3 Contact Admin\n\n' +
      'Tulong sa Pag-aani - Problema:\n' +
      '4.5.1 Sira o natutulis na butil\n' +
      '4.5.2 Nawawalang kagamitan\n' +
      '4.5.3 Makipag-ugnayan sa Admin',
  },
};

const FIELD_PREP_TYPES = {
  '1': {
    label: 'Field Prep - Land Preparation',
    msg:
      'AniAlerto: Field Preparation Help - Land Preparation:\n' +
      '5.1.1 First plowing (2-3 weeks before Plant Date)\n' +
      '5.1.2 Harrowing (1 week before Plant Date)\n' +
      '5.1.3 Level field\n\n' +
      'Tulong sa Paghahanda ng Lupa:\n' +
      '5.1.1 Unang araro (2-3 linggo bago itanim)\n' +
      '5.1.2 Harrowing / paghasik (1 linggo bago itanim)\n' +
      '5.1.3 Pantayin ang lupa',
  },
  '2': {
    label: 'Field Prep - Weed Control',
    msg:
      'AniAlerto: Field Preparation Help - Weed Control:\n' +
      '5.2.1 Identify common weeds\n' +
      '5.2.2 Remove manually or with herbicide\n\n' +
      'Tulong sa Pagkontrol ng Damo:\n' +
      '5.2.1 Kilalanin ang mga karaniwang damo\n' +
      '5.2.2 Alisin nang manu-mano o gamit ang herbicide',
  },
  '3': {
    label: 'Field Prep - Soil Inspection',
    msg:
      'AniAlerto: Field Preparation Help - Soil Inspection:\n' +
      '5.3.1 Check moisture\n' +
      '5.3.2 Check fertility\n\n' +
      'Tulong sa Pagsusuri ng Lupa:\n' +
      '5.3.1 Suriin ang kahalumigmigan\n' +
      '5.3.2 Suriin ang fertility / sustansya ng lupa',
  },
};

const EQUIPMENT_TYPES = {
  '1': {
    label: 'Equipment - Tool Check',
    msg:
      'AniAlerto: Equipment Help - Tool Check:\n' +
      '6.1.1 Sickles, sprayers, spreaders\n' +
      '6.1.2 Pumps, hoses\n\n' +
      'Tulong sa Equipment & Safety - Pagsusuri ng mga Gamit:\n' +
      '6.1.1 Karit, sprayer, spreader\n' +
      '6.1.2 Pumps, hoses',
  },
  '2': {
    label: 'Equipment - Safety Gear',
    msg:
      'AniAlerto: Equipment Help - Safety Gear:\n' +
      '6.2.1 Gloves\n' +
      '6.2.2 Masks\n' +
      '6.2.3 Boots\n\n' +
      'Tulong sa Equipment & Safety - Kagamitang Panseguridad:\n' +
      '6.2.1 Gloves\n' +
      '6.2.2 Masks\n' +
      '6.2.3 Boots',
  },
  '3': {
    label: 'Equipment - Maintenance',
    msg:
      'AniAlerto: Equipment Help - Maintenance:\n' +
      '6.3.1 Clean and store tools properly\n' +
      '6.3.2 Check pumps and motors\n\n' +
      'Tulong sa Equipment & Safety - Pagpapanatili / Maintenance:\n' +
      '6.3.1 Linisin at itabi nang maayos ang mga gamit\n' +
      '6.3.2 Suriin ang pumps at motors',
  },
};

const HELP_INVALID_REPLY =
  'Invalid reply. Please reply with 1, 2, 3, 4, 5, or 6 according to the help menu.\n\n' +
  'Hindi wastong sagot. Mangyaring sumagot ng 1, 2, 3, 4, 5, o 6 ayon sa help menu.';

// Auto-reply messages (English + blank line + Tagalog)
const AUTO_REPLIES = {
  INVALID:
    'Invalid reply. Please reply only with DONE, DELAY, HELP, or PEST.\n\n' +
    'Hindi wastong sagot. Mangyaring sumagot lamang ng DONE, DELAY, HELP, o PEST.',
  DONE:
    'Task marked as completed. Thank you for the update.\n\n' +
    'Natapos na ang gawain. Salamat sa iyong pag-update.',
  DELAY:
    'Delay recorded. A follow-up reminder will be sent for this task.\n\n' +
    'Naitala ang pagka-delay. Magpapadala ng follow-up reminder para sa gawain na ito.',
  PEST:
    'Pest incident recorded. Inspect the affected area and prepare pesticide spraying according to the crop calendar. Contact admin if needed.\n\n' +
    'Naitala ang insidente ng peste. Suriin ang apektadong lugar at ihanda ang pag-spray ng pestisidyo ayon sa crop calendar. Kontakin ang admin kung kinakailangan.',
};

let db;
function setDB(connection) { db = connection; }

// ─── Phone Utilities ──────────────────────────────────────────────────────────

function phoneDigits(raw) { return String(raw || '').replace(/\D/g, ''); }
function phoneKey(raw)    { return phoneDigits(raw).slice(-10); }

function phoneVariants(raw) {
  const key = phoneKey(raw);
  return key ? [`+63${key}`, `0${key}`] : [];
}

function normalizePhone(raw) {
  const key = phoneKey(raw);
  if (key) return `+63${key}`;
  return String(raw || '').replace(/[\s\-().]/g, '');
}

function phoneMatchExpr(col) {
  return `RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${col}, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), 10)`;
}

function isShortCode(phone) {
  const digits = phone.replace(/[^0-9A-Fa-f@]/g, '');
  return /^[\dA-Fa-f@]{4,20}$/.test(phone) && !/^\+/.test(phone) && !/^09\d{9}$/.test(phone);
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

// Queue an auto-reply SMS via sms_queue (skip_log=1 → sender will NOT create an sms_logs row)
async function queueAutoReply(phone, message, workerId = null) {
  try {
    await db.execute(
      `INSERT INTO sms_queue (task_id, worker_id, phone, message, status, skip_log, created_at)
       VALUES (NULL, ?, ?, ?, 'Queued', 1, NOW())`,
      [workerId || null, phone, message]
    );
    console.log(`[Receiver] 📤 Auto-reply queued → ${phone}: "${message.substring(0, 60)}"`);
  } catch (err) {
    console.error(`[Receiver] ❌ queueAutoReply failed: ${err.message}`);
  }
}

// ─── Help Session Helpers ─────────────────────────────────────────────────────

// Returns session row if worker has an active help session (within 10 min), else null
async function getHelpSession(normalizedPhone, workerId) {
  const key = phoneKey(normalizedPhone);
  const [rows] = await db.execute(
    `SELECT id, step FROM help_sessions
     WHERE (${phoneMatchExpr('phone')} = ? OR phone = ? OR worker_id = ?)
       AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
     ORDER BY created_at DESC LIMIT 1`,
    [key, normalizedPhone, workerId || 0]
  );
  return rows.length ? rows[0] : null;
}

async function createHelpSession(normalizedPhone, workerId, step = 'MAIN_MENU') {
  // Clear stale sessions first
  await clearHelpSession(normalizedPhone, workerId);
  await db.execute(
    `INSERT INTO help_sessions (worker_id, phone, created_at, step) VALUES (?, ?, NOW(), ?)`,
    [workerId || null, normalizedPhone, step]
  );
}

async function clearHelpSession(normalizedPhone, workerId) {
  const key = phoneKey(normalizedPhone);
  await db.execute(
    `DELETE FROM help_sessions
     WHERE ${phoneMatchExpr('phone')} = ? OR phone = ? OR worker_id = ?`,
    [key, normalizedPhone, workerId || 0]
  );
}

// ─── Delay Session Helpers ────────────────────────────────────────────────────
async function getDelaySession(normalizedPhone, workerId) {
  const key = phoneKey(normalizedPhone);
  const [rows] = await db.execute(
    `SELECT id FROM delay_sessions
     WHERE (${phoneMatchExpr('phone')} = ? OR phone = ? OR worker_id = ?)
       AND created_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
     ORDER BY created_at DESC LIMIT 1`,
    [key, normalizedPhone, workerId || 0]
  );
  return rows.length ? rows[0] : null;
}

async function createDelaySession(normalizedPhone, workerId) {
  await clearDelaySession(normalizedPhone, workerId);
  await db.execute(
    `INSERT INTO delay_sessions (worker_id, phone, created_at) VALUES (?, ?, NOW())`,
    [workerId || null, normalizedPhone]
  );
}

async function clearDelaySession(normalizedPhone, workerId) {
  const key = phoneKey(normalizedPhone);
  try {
    await db.execute(
      `DELETE FROM delay_sessions
       WHERE ${phoneMatchExpr('phone')} = ? OR phone = ? OR worker_id = ?`,
      [key, normalizedPhone, workerId || 0]
    );
  } catch (err) {}
}

// Create an admin-facing alert record
async function createAlert(type, workerId, workerName, phone, taskId, message) {
  try {
    await db.execute(
      `INSERT INTO alerts (type, worker_id, worker_name, phone, task_id, message, done_reply, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, 0, NOW())`,
      [type, workerId || null, workerName, phone, taskId || null, message]
    );
    console.log(`[Receiver] 🔔 Alert [${type}]: ${message.substring(0, 60)}`);
  } catch (err) {
    console.error(`[Receiver] ❌ createAlert failed: ${err.message}`);
  }
}

// Fetch admin phone for SMS notifications
async function getAdminPhone() {
  try {
    const [rows] = await db.execute(
      `SELECT phone FROM admins WHERE phone IS NOT NULL AND phone != '' LIMIT 1`
    );
    return rows.length ? rows[0].phone : null;
  } catch {
    return null;
  }
}

// Fetch the latest Pending task for a worker (with template category & batch info)
async function getTaskContext(workerId) {
  const [rows] = await db.execute(
    `SELECT st.id, st.batch_id,
            mt.category, mt.message AS template_message,
            fb.name AS batch_name
     FROM scheduled_tasks st
     JOIN batch_workers bw ON st.batch_id = bw.batch_id
     LEFT JOIN message_templates mt ON st.template_id = mt.id
     LEFT JOIN farm_batches fb ON st.batch_id = fb.id
     WHERE bw.worker_id = ? AND st.status = 'Pending'
     ORDER BY st.due_date DESC
     LIMIT 1`,
    [workerId]
  );
  return rows.length ? rows[0] : null;
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

async function handleDone(workerId, workerName, phone) {
  const task = await getTaskContext(workerId);
  if (task) {
    await db.execute(
      `UPDATE scheduled_tasks
         SET status='Completed', completed_at=NOW(), updated_at=NOW()
       WHERE id=?`,
      [task.id]
    );
    console.log(`[Receiver] ✅ Task ${task.id} → Completed`);
  } else {
    console.log(`[Receiver] ℹ️  No pending task for DONE from ${workerName}`);
  }

  // ★ Update open DELAY alerts: set done_reply + update message (admin must manually dismiss)
  const category  = task?.category  || 'General';
  const batchName = task?.batch_name || '';
  const taskId    = task?.id         || null;
  const doneEN = `Worker ${workerName} replied DONE for ${category} task` +
                 (batchName ? ` in ${batchName}` : '') +
                 (taskId    ? ` (Task #${taskId})` : '') + '.';
  const doneTL = `Sumagot ng DONE si ${workerName} para sa gawain ng ${category}` +
                 (batchName ? ` sa ${batchName}` : '') +
                 (taskId    ? ` (Gawain #${taskId})` : '') + '.';
  const doneMsg = doneEN + '\n\n' + doneTL;
  try {
    if (taskId) {
      const [res] = await db.execute(
        `UPDATE alerts SET done_reply=?, message=?
         WHERE type='DELAY' AND worker_id=? AND task_id=? AND is_read=0`,
        [workerName, doneMsg, workerId, taskId]
      );
      if (res.affectedRows > 0)
        console.log(`[Receiver] 🔔 DELAY alert updated → DONE replied by ${workerName}`);
    } else {
      const [res] = await db.execute(
        `UPDATE alerts SET done_reply=?, message=?
         WHERE type='DELAY' AND (worker_id=? OR phone=? OR ${phoneMatchExpr('phone')}=?) AND is_read=0
         ORDER BY created_at DESC LIMIT 1`,
        [workerName, doneMsg, workerId, phone, phoneKey(phone)]
      );
      if (res.affectedRows > 0)
        console.log(`[Receiver] 🔔 DELAY alert (no task) updated → DONE replied by ${workerName}`);
    }
  } catch (err) {
    console.error(`[Receiver] ❌ Could not update DELAY alerts: ${err.message}`);
  }

  await queueAutoReply(phone, AUTO_REPLIES.DONE, workerId);
}

async function handleDelay(workerId, workerName, phone) {
  const task = await getTaskContext(workerId);

  if (task) {
    await db.execute(
      `UPDATE scheduled_tasks SET status='Delayed', updated_at=NOW() WHERE id=?`,
      [task.id]
    );
    console.log(`[Receiver] ⏰ Task ${task.id} → Delayed`);

    if (task.category === 'Harvest') {
      const adminPhone = await getAdminPhone();
      if (adminPhone) {
        await queueAutoReply(adminPhone,
          `AniAlerto Alert: ${workerName} reported HARVEST DELAY in ${task.batch_name}. Task #${task.id}. Follow up immediately.`,
          null);
      }
    }
  } else {
    console.log(`[Receiver] ℹ️  No pending task for DELAY from ${workerName} — alert still created`);
  }

  // New Enhancement: Delay Reason Workflow
  // Instead of auto-reminders, we immediately ask the worker for the reason for delay.
  const reasonPromptEN = `AniAlerto: Reason for delay?`;
  const reasonPromptTL = `AniAlerto: Dahilan ng pagka-delay?`;
  
  await createDelaySession(phone, workerId);
  await queueAutoReply(phone, reasonPromptEN, workerId);
  await queueAutoReply(phone, reasonPromptTL, workerId);

  // ── Always create dashboard checklist alert ─────────────
  const batchInfo = task?.batch_name ? ` in ${task.batch_name}` : '';
  const taskInfo  = task
    ? ` on ${task.category || 'farming'} task${batchInfo}. Task #${task.id}.`
    : ' (no active task).';
  const alertMsg  = `${workerName} (${phone}) reported DELAY${taskInfo}` +
                    `\n\nNag-ulat ng DELAY si ${workerName} (${phone})${batchInfo}.`;
  await createAlert('DELAY', workerId, workerName, phone, task?.id || null, alertMsg);
}



async function handleHelp(workerId, workerName, phone) {
  // ★ FIX: Guard against double-menu. If a session already exists for this worker,
  // the modem re-delivered the HELP SMS — do NOT resend the menu.
  const existingSession = await getHelpSession(phone, workerId);
  if (existingSession) {
    console.log(`[Receiver] 🆘 Help session already active for ${workerName} — skipping duplicate menu send`);
    return;
  }

  const task = await getTaskContext(workerId);

  // Mark task as NeedsHelp if one exists
  if (task) {
    await db.execute(
      `UPDATE scheduled_tasks SET status='NeedsHelp', updated_at=NOW() WHERE id=?`,
      [task.id]
    );
    console.log(`[Receiver] 🆘 Task ${task.id} → NeedsHelp`);
  }

  // Create help session (worker now awaiting menu selection)
  await createHelpSession(phone, workerId, 'MAIN_MENU');

  // Send the numbered help menu — exactly once
  await queueAutoReply(phone, HELP_MENU, workerId);

  // Notify admin that HELP was triggered
  const batchInfo = task && task.batch_name ? ` in ${task.batch_name}` : '';
  const alertMsg  = `${workerName} (${phone}) requested HELP${batchInfo}. Menu sent — awaiting topic selection.`;
  await createAlert('HELP', workerId, workerName, phone, task ? task.id : null, alertMsg);

  console.log(`[Receiver] 🆘 HELP menu sent to ${workerName} (${phone})`);
}

// ── Multi-level HELP: handle the worker's menu number reply ────────────────
async function handleHelpReply(number, workerId, workerName, phone, session) {
  const step = session.step || 'MAIN_MENU';

  if (step === 'MAIN_MENU') {
    if (number === '1') {
      await db.execute(`UPDATE help_sessions SET step='IRRIGATION_MENU', created_at=NOW() WHERE id=?`, [session.id]);
      await queueAutoReply(phone, IRRIGATION_MENU, workerId);
      console.log(`[Receiver] 🆘 Help multi-level: ${workerName} advanced to IRRIGATION_MENU`);
      return;
    } else if (number === '2') {
      await db.execute(`UPDATE help_sessions SET step='FERTILIZER_MENU', created_at=NOW() WHERE id=?`, [session.id]);
      await queueAutoReply(phone, FERTILIZER_MENU, workerId);
      console.log(`[Receiver] 🆘 Help multi-level: ${workerName} advanced to FERTILIZER_MENU`);
      return;
    } else if (number === '3') {
      await db.execute(`UPDATE help_sessions SET step='PESTICIDE_MENU', created_at=NOW() WHERE id=?`, [session.id]);
      await queueAutoReply(phone, PESTICIDE_MENU, workerId);
      console.log(`[Receiver] 🆘 Help multi-level: ${workerName} advanced to PESTICIDE_MENU`);
      return;
    } else if (number === '4') {
      await db.execute(`UPDATE help_sessions SET step='HARVEST_MENU', created_at=NOW() WHERE id=?`, [session.id]);
      await queueAutoReply(phone, HARVEST_MENU, workerId);
      console.log(`[Receiver] 🆘 Help multi-level: ${workerName} advanced to HARVEST_MENU`);
      return;
    } else if (number === '5') {
      await db.execute(`UPDATE help_sessions SET step='FIELD_PREP_MENU', created_at=NOW() WHERE id=?`, [session.id]);
      await queueAutoReply(phone, FIELD_PREP_MENU, workerId);
      console.log(`[Receiver] 🆘 Help multi-level: ${workerName} advanced to FIELD_PREP_MENU`);
      return;
    } else if (number === '6') {
      await db.execute(`UPDATE help_sessions SET step='EQUIPMENT_MENU', created_at=NOW() WHERE id=?`, [session.id]);
      await queueAutoReply(phone, EQUIPMENT_MENU, workerId);
      console.log(`[Receiver] 🆘 Help multi-level: ${workerName} advanced to EQUIPMENT_MENU`);
      return;
    } else {
      await queueAutoReply(phone, HELP_INVALID_REPLY, workerId);
      return;
    }
  } else if (step === 'IRRIGATION_MENU') {
    const helpType = IRRIGATION_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, 3, or 4 for Irrigation help.\n\nHindi wastong sagot. Sumagot ng 1, 2, 3, o 4 para sa Patubig.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone);
  } else if (step === 'FERTILIZER_MENU') {
    const helpType = FERTILIZER_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, 3, 4, or 5 for Fertilizer help.\n\nHindi wastong sagot. Sumagot ng 1, 2, 3, 4, o 5 para sa Abono.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone);
  } else if (step === 'PESTICIDE_MENU') {
    const helpType = PESTICIDE_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, 3, 4, or 5 for Pesticide help.\n\nHindi wastong sagot. Sumagot ng 1, 2, 3, 4, o 5 para sa Pesticide.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone);
  } else if (step === 'HARVEST_MENU') {
    const helpType = HARVEST_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, 3, 4, or 5 for Harvest help.\n\nHindi wastong sagot. Sumagot ng 1, 2, 3, 4, o 5 para sa Pag-aani.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone);
  } else if (step === 'FIELD_PREP_MENU') {
    const helpType = FIELD_PREP_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, or 3 for Field Preparation help.\n\nHindi wastong sagot. Sumagot ng 1, 2, o 3 para sa Paghahanda ng Lupa.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone);
  } else if (step === 'EQUIPMENT_MENU') {
    const helpType = EQUIPMENT_TYPES[number];
    if (!helpType) {
      await queueAutoReply(phone, 'Invalid reply. Please reply with 1, 2, or 3 for Equipment & Safety help.\n\nHindi wastong sagot. Sumagot ng 1, 2, o 3 para sa Equipment & Safety.', workerId);
      return;
    }
    await queueAutoReply(phone, helpType.msg, workerId);
    await finishHelpReply(helpType, workerId, workerName, phone);
  }
}

async function finishHelpReply(helpType, workerId, workerName, phone) {
  const responseLabel = `HELP: ${helpType.label}`;

  // Update the sms_logs row that was stamped 'HELP' to the specific topic
  const [upd] = await db.execute(
    `UPDATE sms_logs
        SET response_text = ?,
            received_at   = NOW()
      WHERE direction     = 'Outbound'
        AND response_text = 'HELP'
        AND (
          worker_id = ?
          OR phone  = ?
          OR ${phoneMatchExpr('phone')} = ?
        )
      ORDER BY created_at DESC
      LIMIT 1`,
    [responseLabel, workerId, phone, phoneKey(phone)]
  );
  if (upd.affectedRows > 0) {
    console.log(`[Receiver] 🔗 sms_logs HELP row → ${responseLabel}`);
  }

  // Notify admin with the selected topic
  const adminPhone = await getAdminPhone();
  if (adminPhone) {
    await queueAutoReply(
      adminPhone,
      `AniAlerto: ${workerName} selected HELP topic "${helpType.label}". Phone: ${phone}.`,
      null
    );
  }

  // Clear the help session
  await clearHelpSession(phone, workerId);

  console.log(`[Receiver] 🆘 Help sub-reply processed: ${workerName} → ${helpType.label}`);
}

async function handlePest(workerId, workerName, phone) {
  const task = await getTaskContext(workerId);

  // ── Dedup guard: skip if this worker already reported PEST in the last 5 min ──
  // Prevents duplicate guidance when the modem delivers the same SMS twice.
  const [recentPest] = await db.execute(
    `SELECT id FROM pest_alerts
     WHERE worker_id = ?
       AND reported_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
     LIMIT 1`,
    [workerId]
  );
  if (recentPest.length > 0) {
    console.log(`[Receiver] ⚠️  PEST already logged for ${workerName} (${phone}) — skipping duplicate`);
    return;
  }

  // Create pest incident
  await db.execute(
    `INSERT INTO pest_alerts (worker_id, phone, batch_id, task_id, status, reported_at)
     VALUES (?, ?, ?, ?, 'Open', NOW())`,
    [workerId, phone, task ? task.batch_id : null, task ? task.id : null]
  );

  // Admin alert + SMS (only once, only to admin)
  const batchInfo = task && task.batch_name ? ` in ${task.batch_name}` : '';
  const alertMsg = `PEST report from ${workerName} (${phone})${batchInfo}. Urgent inspection required.`;
  await createAlert('PEST', workerId, workerName, phone, task ? task.id : null, alertMsg);

  const adminPhone = await getAdminPhone();
  if (adminPhone) {
    await queueAutoReply(
      adminPhone,
      `AniAlerto URGENT: ${workerName} reported PEST${batchInfo}. Immediate inspection required. Phone: ${phone}.`,
      null
    );
  }

  // Send pest guidance ONLY to the reporting worker
  await queueAutoReply(phone, AUTO_REPLIES.PEST, workerId);
  console.log(`[Receiver] 🐛 Pest incident logged for ${workerName}${batchInfo}`);
  // Note: task status intentionally NOT changed for PEST
}

// ─── Main Polling Handler ─────────────────────────────────────────────────────

async function processIncoming() {
  const messages = await readAllSMS();
  if (messages.length === 0) return;

  console.log(`[Receiver] 📬 Found ${messages.length} message(s) on modem`);

  for (const sms of messages) {
    // ── Auto-purge operator spam ──────────────────────────────────────────────
    if (isShortCode(sms.phone)) {
      console.log(`[Receiver] 🗑️  Spam from ${sms.phone} — purging`);
      await deleteSMS(sms.index).catch(() => {});
      continue;
    }

    const normalizedPhone = normalizePhone(sms.phone);
    const text    = sms.text.toUpperCase().trim();
    const command = KNOWN_COMMANDS.find(c => text.startsWith(c)) || null;

    try {
      // ── Gate 1: Registered-worker check ──────────────────────────────────
      const variants = phoneVariants(normalizedPhone);
      const altPhone = variants[1] || normalizedPhone;
      const key      = phoneKey(normalizedPhone);

      const [workerRows] = await db.execute(
        `SELECT id, name FROM workers
         WHERE status='Active'
           AND (phone=? OR phone=? OR ${phoneMatchExpr('phone')}=?)
         LIMIT 1`,
        [normalizedPhone, altPhone, key]
      );

      if (workerRows.length === 0) {
        console.log(`[Receiver] 🚫 Unregistered: ${normalizedPhone} — purging`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      const workerId   = workerRows[0].id;
      const workerName = workerRows[0].name;
      console.log(`[Receiver] 👤 Verified: ${workerName} (${normalizedPhone})`);

      // ── Help session intercept: reply 1-6 while awaiting menu selection ─────
      const helpNum = sms.text.trim();
      if (/^[1-6]$/.test(helpNum)) {
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session) {
          console.log(`[Receiver] 🆘 Help sub-reply from ${workerName}: "${helpNum}"`);
          await db.execute(
            `INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
             VALUES (?, ?, ?, NOW())`,
            [normalizedPhone, sms.text, `HELP:${helpNum}`]
          );
          await handleHelpReply(helpNum, workerId, workerName, normalizedPhone, session);
          await deleteSMS(sms.index).catch(() => {});
          continue;
        }
      }

      // ── Invalid reply while in help or delay session: check sessions ─────────
      if (command === null) {
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session) {
          console.log(`[Receiver] ⚠️  Invalid help menu reply from ${workerName}: "${sms.text}"`);
          await queueAutoReply(normalizedPhone, HELP_INVALID_REPLY, workerId);
          await deleteSMS(sms.index).catch(() => {});
          continue;
        }

        const delaySession = await getDelaySession(normalizedPhone, workerId);
        if (delaySession) {
          if (!sms.text.trim()) {
            console.log(`[Receiver] ⚠️  Empty delay reason from ${workerName}`);
            await queueAutoReply(normalizedPhone, `AniAlerto: Reason for delay? / Dahilan ng pagka-delay?`, workerId);
            await deleteSMS(sms.index).catch(() => {});
            continue;
          }

          console.log(`[Receiver] 📝 Delay reason received from ${workerName}: "${sms.text}"`);
          // Store reason in the database
          await db.execute(
            `UPDATE alerts SET delay_reason = ? 
             WHERE type = 'DELAY' AND worker_id = ? AND delay_reason IS NULL
             ORDER BY created_at DESC LIMIT 1`,
             [sms.text, workerId]
          );

          await clearDelaySession(normalizedPhone, workerId);
          
          await db.execute(
            `INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
             VALUES (?, ?, ?, NOW())`,
            [normalizedPhone, sms.text, 'DELAY_REASON']
          );
          
          await queueAutoReply(normalizedPhone, `Reason recorded. Thank you.\n\nNaitala ang dahilan. Salamat.`, workerId);
          await deleteSMS(sms.index).catch(() => {});
          continue;
        }

        // No active session — normal invalid reply
        console.log(`[Receiver] ⚠️  Invalid reply from ${workerName}: "${sms.text}"`);
        await db.execute(
          `INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
           VALUES (?, ?, NULL, NOW())`,
          [normalizedPhone, sms.text]
        );
        await queueAutoReply(normalizedPhone, AUTO_REPLIES.INVALID, workerId);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      // ── Gate 2: Deduplication guard ───────────────────────────────────────
      const [existing] = await db.execute(
        `SELECT id FROM inbound_messages
         WHERE (${phoneMatchExpr('phone')}=? OR phone=? OR phone=?)
           AND message=?
           AND received_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
         LIMIT 1`,
        [key, normalizedPhone, altPhone, sms.text]
      );

      if (existing.length > 0) {
        console.log(`[Receiver] ⚠️  Duplicate — skipping insert, purging (${normalizedPhone})`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }

      // ── Store in inbound_messages (audit + dedup only) ────────────────────
      const [inboundResult] = await db.execute(
        `INSERT IGNORE INTO inbound_messages (phone, message, command, received_at)
         VALUES (?, ?, ?, NOW())`,
        [normalizedPhone, sms.text, command]
      );
      if (inboundResult.affectedRows === 0) {
        console.log(`[Receiver] ⚠️  DB unique constraint caught duplicate — purging`);
        await deleteSMS(sms.index).catch(() => {});
        continue;
      }
      console.log(`[Receiver] 📩 ${workerName}: "${sms.text}" → ${command}`);

      // ── Update the matching outbound sms_logs row in-place ────────────────
      // No new Inbound row — the outbound row is mutated to carry the reply.
      const [updateResult] = await db.execute(
        `UPDATE sms_logs
           SET response_text = ?,
               received_at   = NOW(),
               status        = 'Replied'
         WHERE direction  = 'Outbound'
           AND status    != 'Replied'
           AND (
             worker_id = ?
             OR phone  = ?
             OR phone  = ?
             OR ${phoneMatchExpr('phone')} = ?
           )
         ORDER BY created_at DESC
         LIMIT 1`,
        [command, workerId, normalizedPhone, altPhone, key]
      );
      if (updateResult.affectedRows > 0) {
        console.log(`[Receiver] 🔗 Outbound row updated → ${command} (${workerName})`);
      } else {
        console.log(`[Receiver] ℹ️  No pending outbound row found for ${workerName}`);
      }

      // ── Dispatch command handler ──────────────────────────────────────────
      if (command === 'DONE')  await handleDone (workerId, workerName, normalizedPhone);
      if (command === 'DELAY') await handleDelay(workerId, workerName, normalizedPhone);
      if (command === 'HELP')  await handleHelp (workerId, workerName, normalizedPhone);
      if (command === 'PEST')  await handlePest (workerId, workerName, normalizedPhone);

      // ── Mark inbound_messages as processed ───────────────────────────────
      await db.execute(
        `UPDATE inbound_messages SET processed_at=NOW() WHERE id=?`,
        [inboundResult.insertId]
      );

      // ── Delete from modem ─────────────────────────────────────────────────
      try {
        await deleteSMS(sms.index);
      } catch (delErr) {
        console.warn(`[Receiver] ⚠️  deleteSMS failed for index ${sms.index}: ${delErr.message}`);
      }

    } catch (err) {
      console.error(`[Receiver] ❌ DB error for ${normalizedPhone}: ${err.message}`);
    }
  }
}

module.exports = { setDB, processIncoming };
