# Hotel Biryani Management - Frontend

React + TypeScript frontend for the Hotel Biryani Management System.

## Features

- Recipe selection and ingredient calculation
- Dynamic quantity scaling
- Cost calculation
- Responsive UI design

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **CSS3** for styling

## Development

### Prerequisites
- Node.js (v16+)
- npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend connects to the API server at `http://localhost:5000`

### Environment Variables

Create `.env` file for custom API URL:
```
VITE_API_URL=http://localhost:5000
```

## Project Structure

```
src/
├── components/          # React components
│   └── RecipeSelector.tsx
├── App.tsx             # Main app component
├── App.css             # Global styles
└── main.tsx            # App entry point
```