# Server Integration Guide

This guide explains how to integrate the frontend with the backend API.

## Prerequisites

1. PostgreSQL database setup (see `/database/README.md`)
2. Node.js and npm installed
3. Backend API running on port 5000

## Quick Start

### 1. Setup Backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp ../.env.example .env

# Edit .env with your database credentials
nano .env

# Setup database
npm run db:setup
npm run db:seed

# Start the server
npm run dev
```

The API will be available at `http://localhost:5000`

### 2. Configure Frontend

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

For production, use your actual API URL:
```env
VITE_API_URL=https://api.anialerto.com/api
```

### 3. Update Components to Use API

The API service is available at `/src/services/api.ts`. Here's how to use it in your components:

#### Example: BatchManagement Component

```typescript
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const response = await api.getBatches();
      setBatches(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading batches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (formData) => {
    try {
      const response = await api.createBatch(formData);
      await loadBatches();
      return response.data;
    } catch (err) {
      console.error('Error creating batch:', err);
      throw err;
    }
  };

  const handleUpdateBatch = async (id, formData) => {
    try {
      await api.updateBatch(id, formData);
      await loadBatches();
    } catch (err) {
      console.error('Error updating batch:', err);
      throw err;
    }
  };

  const handleDeleteBatch = async (id) => {
    if (confirm('Are you sure?')) {
      try {
        await api.deleteBatch(id);
        await loadBatches();
      } catch (err) {
        console.error('Error deleting batch:', err);
        alert('Failed to delete batch');
      }
    }
  };

}
```

## API Integration Examples

### Create Batch

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await api.createBatch({
      name: formData.name,
      location: formData.location,
      plantingDate: formData.plantingDate,
      area: formData.area,
      variety: formData.variety,
      status: formData.status,
      notes: formData.notes
    });
    
    console.log('Batch created:', response.data);
    setIsDialogOpen(false);
  } catch (error) {
    console.error('Failed to create batch:', error);
    alert('Error creating batch');
  }
};
```

### Create Worker

```typescript
const handleCreateWorker = async () => {
  try {
    const response = await api.createWorker({
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      status: formData.status,
      dateHired: formData.dateHired,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone
    });
    
    console.log('Worker created:', response.data);
  } catch (error) {
    console.error('Failed to create worker:', error);
  }
};
```

### Create Message Template

```typescript
const handleCreateTemplate = async () => {
  try {
    const response = await api.createMessageTemplate({
      name: formData.name,
      category: formData.category,
      message: formData.message,
      daysAfterPlanting: formData.daysAfterPlanting,
      active: formData.active,
      expectedResponses: formData.expectedResponses
    });
    
    console.log('Template created:', response.data);
  } catch (error) {
    console.error('Failed to create template:', error);
  }
};
```

### Create Command Response

```typescript
const handleAddResponse = async () => {
  try {
    const response = await api.createCommandResponse({
      command: newResponse.command,
      description: newResponse.description,
      color: newResponse.color,
      action: newResponse.action
    });
    
    console.log('Response added:', response.data);
  } catch (error) {
    console.error('Failed to add response:', error);
  }
};
```

### Generate Report

```typescript
const handleGenerateReport = async () => {
  try {
    let data;
    
    if (reportType === 'messages') {
      const response = await api.getMessageReport(dateRange.from, dateRange.to);
      data = response.data;
    } else if (reportType === 'tasks') {
      const response = await api.getTaskReport(dateRange.from, dateRange.to);
      data = response.data;
    } else if (reportType === 'workers') {
      const response = await api.getWorkerReport(dateRange.from, dateRange.to);
      data = response.data;
    } else if (reportType === 'batches') {
      const response = await api.getBatchReport(dateRange.from, dateRange.to);
      data = response.data;
    }
    
    setReportData(data);
  } catch (error) {
    console.error('Failed to generate report:', error);
  }
};
```

## Error Handling

All API calls should include proper error handling:

```typescript
try {
  const response = await api.createBatch(batchData);
} catch (error) {
  if (error.message.includes('duplicate')) {
    alert('A batch with this ID already exists');
  } else if (error.message.includes('network')) {
    alert('Network error. Please check your connection.');
  } else {
    alert('An error occurred. Please try again.');
  }
  console.error('Error:', error);
}
```

## Loading States

Show loading indicators while data is being fetched:

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.getBatches();
      setBatches(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, []);

if (loading) {
  return <div>Loading...</div>;
}
```

## Development vs Production

### Development
- API URL: `http://localhost:5000/api`
- Database: Local PostgreSQL
- CORS: Enabled for localhost:3000

### Production
- API URL: `https://api.anialerto.com/api`
- Database: Production PostgreSQL with SSL
- CORS: Configured for production domain
- Use environment variables for all configuration

## Testing the Integration

1. **Start the backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   npm run dev
   ```

3. **Test each feature:**
   - Create a batch → Check database
   - Create a worker → Check database
   - Create a template → Check database
   - Generate reports → Verify data

4. **Check browser console for errors**

5. **Monitor server logs for API calls**

## Deployment

### Backend Deployment (e.g., Heroku, Railway, Render)

1. Push code to Git repository
2. Configure environment variables
3. Deploy backend service
4. Note the API URL

### Frontend Deployment (e.g., Vercel, Netlify)

1. Set `VITE_API_URL` environment variable
2. Deploy frontend
3. Test integration

## Troubleshooting

### CORS Errors
- Ensure backend CORS is configured for your frontend URL
- Check `CORS_ORIGIN` in backend `.env`

### Connection Refused
- Verify backend is running on correct port
- Check `VITE_API_URL` in frontend `.env`

### Database Errors
- Verify PostgreSQL is running
- Check database credentials in backend `.env`
- Run migrations if needed

### 404 Errors
- Verify API endpoint paths match
- Check network tab in browser DevTools

## Next Steps

1. Update all components to use the API service
2. Add authentication/authorization
3. Implement real-time updates (WebSockets)
4. Add offline support (Service Workers)
5. Implement data caching

## Support

For issues or questions:
- Check server logs: `server/logs/`
- Check browser console
- Verify database connection
- Test API endpoints with curl/Postman
