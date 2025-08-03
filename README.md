# AI Travel Guide

An AI-driven travel guide web application that asks "Who you are?" and "Where to?", then returns ten personality-matched places to visit using Anthropic's Claude API.

## Features

- **Personality Quiz**: 5-question personality assessment with sliders, radio buttons, and text input
- **Destination Input**: Simple text input for city or country
- **AI Recommendations**: Streams 10 personalized travel recommendations from Claude
- **Mobile-First Design**: Responsive UI built with Tailwind CSS
- **Real-time Streaming**: Recommendations appear as they're generated

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript 5**
- **Tailwind CSS 3**
- **Anthropic Claude API**
- **Vercel Edge Functions**

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd travel-guide
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Add your Anthropic API key to `.env.local`:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Complete the Personality Quiz**: Answer 5 questions about your travel preferences
2. **Enter Destination**: Type a city or country you want to visit
3. **Get Recommendations**: Click "Generate Recommendations" to receive 10 personalized places

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Main page component
├── components/
│   ├── PersonalityQuiz.tsx   # Personality assessment
│   ├── DestinationInput.tsx  # Destination input
│   └── PlaceCard.tsx         # Individual place display
├── lib/
│   └── claude.ts             # Claude API client
└── pages/api/
    └── recommend.ts          # API route for recommendations
```

## API Endpoints

### POST /api/recommend

Generates travel recommendations based on personality and destination.

**Request Body:**
```json
{
  "answers": [
    {"questionId": 1, "value": 4},
    {"questionId": 2, "value": "Active"},
    ...
  ],
  "place": "Tokyo, Japan"
}
```

**Response:** Streams NDJSON with place objects:
```json
{"name": "Place Name", "city": "City", "country": "Country", "description": "...", "idealFor": "..."}
```

## Deployment

The app is configured for deployment on Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Future Enhancements

- Mapbox integration for interactive maps
- User authentication and saved preferences
- Caching layer for recommendations
- A/B testing with PostHog
- Database integration with Supabase

## License

MIT