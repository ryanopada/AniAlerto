const mysql = require('mysql2/promise');

async function run() {
  const db = await mysql.createConnection({
    host: '148.222.53.111',
    user: 'u268935662_anialerto123',
    password: 'AniAlerto123',
    database: 'u268935662_AniAlerto'
  });

  console.log('Connected to database.');

  await db.query('ALTER TABLE farm_batches MODIFY COLUMN status VARCHAR(50)');
  console.log('Changed column to VARCHAR');

  const [res] = await db.query("UPDATE farm_batches SET status = 'Healthy' WHERE status IN ('Active', 'Planning', '')");
  console.log('Updated ' + res.affectedRows + ' rows to Healthy');

  await db.query("ALTER TABLE farm_batches MODIFY COLUMN status ENUM('Healthy', 'Pest-Infested', 'Heat-Stressed', 'Water-Logged', 'Delayed', 'Harvested') DEFAULT 'Healthy'");
  console.log('Successfully altered farm_batches status ENUM');

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
