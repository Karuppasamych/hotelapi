# Hotel Biryani Management - API

Node.js + Express + TypeScript API for the Hotel Biryani Management System.

## Features

- Recipe management with ingredient scaling
- Dynamic quantity calculation (1kg base to any quantity)
- Cost calculation
- RESTful API endpoints
- TypeScript for type safety

## Tech Stack

- **Node.js** with Express
- **TypeScript** for type safety
- **In-memory storage** (POC - will migrate to PostgreSQL)

## Development

### Prerequisites
- Node.js (v16+)
- npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

### Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests

## API Endpoints

### Recipes
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes/:id/scale` - Scale recipe ingredients
- `POST /api/recipes` - Add new recipe

### Health Check
- `GET /api/health` - API health status

## Sample Usage

**Scale Recipe:**
```bash
POST /api/recipes/1/scale
Content-Type: application/json

{
  "targetQuantity": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Mutton Biryani",
    "target_quantity": 5,
    "scaled_ingredients": [
      {
        "name": "Basmati Rice",
        "quantity": 2.5,
        "unit": "kg",
        "cost_per_unit": 120
      }
    ],
    "total_cost": 1850.00
  }
}
```

## Project Structure

```
src/
├── controllers/        # API controllers
├── models/            # Data models & interfaces
├── routes/            # Express routes
├── services/          # Business logic
├── middleware/        # Express middleware
└── server.ts          # Main server file
```

## Environment Variables

```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```