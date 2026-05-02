# AniAlerto PHP/MySQL Backend Starter

This starter backend matches the AniAlerto thesis scope: PHP API layer, MySQL/MariaDB data layer, cron-based rule scheduler, SMS queue, delivery logs, and structured two-way commands (`DONE`, `DELAY`, `HELP`, `PEST`, `UOD`).

## 1. Setup

1. Create a MySQL database named `anialerto`.
2. Import `database/schema.sql`.
3. Edit `config/config.php` with your database username/password.
4. Put this folder inside your local server, for example:
   - XAMPP: `htdocs/anialerto-backend`
   - Laragon: `www/anialerto-backend`
5. API base URL:
   - `http://localhost/anialerto-backend/public/index.php`

## 2. Default login

- Username: `admin`
- Password: `admin123`

Change this before real deployment.

## 3. Main API routes

Use the base URL plus these routes:

- `POST /auth/login`
- `GET /dashboard`
- `GET|POST /batches`
- `GET|PUT|DELETE /batches/{id}`
- `GET|POST /workers`
- `GET|PUT|DELETE /workers/{id}`
- `GET|POST /templates`
- `GET|PUT|DELETE /templates/{id}`
- `GET|POST /commands`
- `GET /sms-logs`
- `POST /manual-sms`

Example:

```bash
curl http://localhost/anialerto-backend/public/index.php/batches
```

## 4. Scheduler / rule engine

Run this manually first:

```bash
php cron/run_scheduler.php
```

This computes crop day from `planting_date`, checks active message templates, creates scheduled tasks, and queues SMS messages.

Then process queued SMS:

```bash
php cron/process_sms_queue.php
```

By default, this uses `SMS_DRIVER=log`, meaning it will mark messages as sent for testing. To use Gammu command line later, set:

```php
'SMS_DRIVER' => 'gammu_cli'
```

in `config/config.php`, then adjust the command in `src/SmsGateway.php` depending on your modem/Gammu setup.

## 5. Suggested cron entries

Linux example:

```cron
* * * * * /usr/bin/php /path/to/anialerto_backend_starter/cron/run_scheduler.php
* * * * * /usr/bin/php /path/to/anialerto_backend_starter/cron/process_sms_queue.php
* * * * * /usr/bin/php /path/to/anialerto_backend_starter/cron/process_inbox.php
```

For Windows/XAMPP, use Task Scheduler to run the PHP scripts every minute.

## 6. Connecting to the React frontend

Replace the mock `useState([...])` data in these files with `fetch()` calls:

- `BatchManagement.tsx` → `/batches`
- `WorkerManagement.tsx` → `/workers`
- `MessageConfiguration.tsx` → `/templates`
- `SMSMonitoring.tsx` → `/sms-logs` and `/commands`
- `Dashboard.tsx` → `/dashboard`
- `LoginPage.tsx` → `/auth/login`

Example frontend call:

```ts
const API = "http://localhost/anialerto-backend/public/index.php";
const res = await fetch(`${API}/batches`);
const data = await res.json();
```
