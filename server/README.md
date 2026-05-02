# AniAlerto API Server

Backend API for the AniAlerto Farm Management System.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Copy the `.env.example` from the root directory and create `.env` in the server folder:

```bash
cp ../.env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anialerto
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=false

NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 3. Setup Database

```bash
# Create database and run schema
npm run db:setup

# Load sample data (optional)
npm run db:seed

# Or do both at once
npm run db:reset
```

### 4. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Farm Batches
- `GET /api/batches` - Get all batches
- `GET /api/batches/:id` - Get single batch
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch
- `POST /api/batches/:batchId/workers/:workerId` - Assign worker to batch
- `DELETE /api/batches/:batchId/workers/:workerId` - Remove worker from batch

### Workers
- `GET /api/workers` - Get all workers
- `GET /api/workers/:id` - Get single worker
- `POST /api/workers` - Create new worker
- `PUT /api/workers/:id` - Update worker
- `DELETE /api/workers/:id` - Delete worker

### Message Templates
- `GET /api/messages/templates` - Get all templates
- `GET /api/messages/templates/:id` - Get single template
- `POST /api/messages/templates` - Create new template
- `PUT /api/messages/templates/:id` - Update template
- `DELETE /api/messages/templates/:id` - Delete template

### SMS Messages
- `GET /api/messages/sms` - Get all SMS messages
  - Query params: `status`, `startDate`, `endDate`

### Command Responses
- `GET /api/responses` - Get all command responses
- `GET /api/responses/:id` - Get single command response
- `POST /api/responses` - Create new command response
- `PUT /api/responses/:id` - Update command response
- `DELETE /api/responses/:id` - Delete command response

### Reports
- `GET /api/reports/messages` - Message report
- `GET /api/reports/tasks` - Task completion report
- `GET /api/reports/workers` - Worker performance report
- `GET /api/reports/batches` - Batch activity report
- `GET /api/reports/stats` - Dashboard statistics

## Request/Response Examples

### Create Batch

```bash
POST /api/batches
Content-Type: application/json

{
  "name": "Field E - Summer Crop",
  "location": "Field E",
  "plantingDate": "2026-05-15",
  "area": "3.5 ha",
  "variety": "Pioneer 30G40",
  "status": "Planning",
  "notes": "Summer planting trial"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "BR-2026-005",
    "name": "Field E - Summer Crop",
    "location": "Field E",
    "plantingDate": "2026-05-15",
    "area": "3.5 ha",
    "variety": "Pioneer 30G40",
    "status": "Planning",
    "notes": "Summer planting trial",
    "workers": []
  }
}
```

### Create Worker

```bash
POST /api/workers
Content-Type: application/json

{
  "name": "Roberto Cruz",
  "phone": "+639123456789",
  "role": "Field Worker",
  "status": "Active",
  "dateHired": "2026-05-01",
  "address": "Brgy. San Juan, Cabanatuan City",
  "emergencyContact": "Maria Cruz",
  "emergencyPhone": "+639987654321"
}
```

### Create Message Template

```bash
POST /api/messages/templates
Content-Type: application/json

{
  "name": "Harvest Reminder",
  "category": "Harvest",
  "message": "Time to harvest! Check moisture levels. Reply DONE when ready.",
  "daysAfterPlanting": 105,
  "active": true,
  "expectedResponses": ["DONE", "DELAY"]
}
```

## Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

## Development

### File Structure
```
server/
├── db/
│   └── connection.js      # Database connection
├── routes/
│   ├── batches.js         # Batch endpoints
│   ├── workers.js         # Worker endpoints
│   ├── messages.js        # Message endpoints
│   ├── responses.js       # Command response endpoints
│   └── reports.js         # Report endpoints
├── index.js               # Main server file
├── package.json
└── README.md
```

### Adding New Endpoints

1. Create route file in `routes/`
2. Import and use in `index.js`
3. Follow existing patterns for consistency

## Testing

Test the API using curl or Postman:

```bash
# Health check
curl http://localhost:5000/api/health

# Get all batches
curl http://localhost:5000/api/batches

# Create batch
curl -X POST http://localhost:5000/api/batches \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Batch","location":"Field A","plantingDate":"2026-05-01","area":"2.0 ha","variety":"Test Variety"}'
```

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Enable SSL for database (`DB_SSL=require`)
3. Use process manager (PM2)
4. Set up reverse proxy (nginx)
5. Enable HTTPS
6. Configure firewall rules

## Support

For issues or questions, please refer to the main project documentation.
