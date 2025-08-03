import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { answers, place } = await request.json();

    console.log('Received request:', { answers, place });

    if (!answers || !place) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    console.log('API key found, proceeding with Claude request');

    try {
      const response = await getRecommendations(answers, place);
      console.log('Claude response received successfully');

      // Parse the response to extract JSON objects
      const jsonMatch = response.match(/\[([\s\S]*)\]/);
      if (jsonMatch) {
        try {
          const places = JSON.parse(jsonMatch[0]);
          return NextResponse.json(places);
        } catch (e) {
          console.error('Failed to parse JSON from Claude response:', e);
          return NextResponse.json(
            { error: 'Failed to parse Claude response' },
            { status: 500 }
          );
        }
      } else {
        console.error('No JSON array found in Claude response');
        return NextResponse.json(
          { error: 'Invalid response format from Claude' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error calling Claude API:', error);
      return NextResponse.json(
        { error: 'Failed to get recommendations from Claude' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in recommend API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
