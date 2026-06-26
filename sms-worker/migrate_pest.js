const mysql = require('mysql2/promise');

async function migrate() {
  console.log("Starting Pest Workflow Migration...");

  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'anialerto'
  });

  try {
    // 1. Modify pest_alerts table
    console.log("Modifying pest_alerts table...");
    await conn.execute(`ALTER TABLE pest_alerts MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Open'`);
    
    // Add columns if they don't exist
    try { await conn.execute(`ALTER TABLE pest_alerts ADD COLUMN pest_type_id INT NULL`); } catch(e) {}
    try { await conn.execute(`ALTER TABLE pest_alerts ADD COLUMN advisory_sent TEXT NULL`); } catch(e) {}
    try { await conn.execute(`ALTER TABLE pest_alerts ADD COLUMN completed_at DATETIME NULL`); } catch(e) {}

    // 2. Create pest_advisories table
    console.log("Creating pest_advisories table...");
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS pest_advisories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        option_number INT UNIQUE,
        pest_name VARCHAR(100) NOT NULL,
        advisory_en TEXT NOT NULL,
        advisory_tl TEXT NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 3. Pre-populate pest_advisories
    console.log("Pre-populating pest_advisories...");
    const defaultPests = [
      {
        num: 1,
        name: 'Harabas (Fall Armyworm)',
        en: "Harabas reported.\n\nActions:\n• Inspect at least 50 plants.\n• Look for egg clusters and leaf damage.\n• If infestation is low, use biological control (Bt).\n• If severe, apply targeted spray into the whorl (afternoon/evening).\n• Notify Farm Head immediately if spreading.\n\nReply DONE when finished.",
        tl: "Harabas ang naiulat.\n\nMga dapat gawin:\n• Suriin ang hindi bababa sa 50 halaman sa apektadong bahagi.\n• Hanapin ang mga kumpol ng itlog at pinsala sa dahon o whorl.\n• Kung kakaunti pa, magsagawa ng biological control (Bt).\n• Kung malawak ang pinsala, magsagawa ng targeted spraying sa loob ng whorl (hapon/gabi).\n• Ipaalam agad sa Farm Head kung mabilis lumalawak.\n\nI-reply ang DONE kapag natapos."
      },
      {
        num: 2,
        name: 'Uod sa Tangkay (Asian Corn Borer)',
        en: "Uod sa Tangkay reported.\n\nActions:\n• Check under leaves for egg masses.\n• Remove and destroy eggs immediately.\n• Apply Trichogramma cards if available.\n• Check stalks for tunneling.\n• Mark affected plants for monitoring.\n• Notify Farm Head if the number increases.\n\nReply DONE when finished.",
        tl: "Uod sa Tangkay ang naiulat.\n\nMga dapat gawin:\n• Suriin ang ilalim ng dahon para sa itlog.\n• Alisin at durugin agad ang mga nakitang egg masses.\n• Maglagay ng Trichogramma cards kung available.\n• Suriin ang mga tangkay para sa senyales ng pagbubutas (tunneling).\n• Markahan ang apektadong halaman para sa monitoring.\n• Ipaalam sa Farm Head kung dumarami ang apektado.\n\nI-reply ang DONE kapag natapos."
      },
      {
        num: 3,
        name: 'Langaw-langaw (Corn Seedling Maggot)',
        en: "Langaw-langaw reported.\n\nActions:\n• Check young plants for deadheart (drying central leaf).\n• Count and mark affected seedlings.\n• Remove weeds around the field that harbor pests.\n• Observe if the number of affected plants rises.\n• If severe, notify Farm Head immediately for possible replanting.\n\nReply DONE when finished.",
        tl: "Langaw-langaw ang naiulat.\n\nMga dapat gawin:\n• Suriin ang mga batang halaman para sa sintomas ng deadheart o pagkatuyo ng gitnang dahon.\n• Bilangin at markahan ang apektadong punla.\n• Alisin ang mga damo sa paligid ng taniman.\n• Obserbahan kung tumataas ang bilang ng apektado.\n• Kung malawak na ang pinsala, iulat agad sa Farm Head para sa posibleng replanting.\n\nI-reply ang DONE kapag natapos."
      },
      {
        num: 4,
        name: 'Kuto-kuto (Corn Aphids)',
        en: "Kuto-kuto reported.\n\nActions:\n• Check under leaves and tassels for aphid colonies.\n• Look for honeydew or sooty mold.\n• For small infestations, apply botanical spray (e.g. kakawate extract).\n• Continue observing aphid population.\n• If widespread, notify Farm Head immediately for intervention.\n\nReply DONE when finished.",
        tl: "Kuto-kuto ang naiulat.\n\nMga dapat gawin:\n• Suriin ang ilalim ng mga dahon at tassels para sa aphid colonies.\n• Tingnan kung may honeydew o maitim na amag sa dahon.\n• Para sa maliit na infestation, magsagawa ng botanical spray tulad ng kakawate extract.\n• Patuloy na obserbahan ang pagdami ng aphids.\n• Kung laganap na ang infestation, iulat sa Farm Head para sa intervention.\n\nI-reply ang DONE kapag natapos."
      }
    ];

    for (let p of defaultPests) {
      await conn.execute(`
        INSERT INTO pest_advisories (option_number, pest_name, advisory_en, advisory_tl)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        pest_name = VALUES(pest_name),
        advisory_en = VALUES(advisory_en),
        advisory_tl = VALUES(advisory_tl)
      `, [p.num, p.name, p.en, p.tl]);
    }

    console.log("Migration completed successfully!");

  } catch (err) {
    console.error("Migration Failed:", err);
  } finally {
    await conn.end();
  }
}

migrate();
