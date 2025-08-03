import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface Answer {
  questionId: number
  value: string | number
}

export function buildPrompt(answers: Answer[], place: string): string {
  const answersString = answers
    .sort((a, b) => a.questionId - b.questionId)
    .map(answer => {
      const questionText = getQuestionText(answer.questionId)
      return `${questionText} ${answer.value}`
    })
    .join('. ')

  return `You are a travel concierge. The traveler's self-description is:
${answersString}.

They want to visit: ${place}.

Return exactly 10 lesser-known but worthwhile places as JSON:
[
  {
    "name": "",
    "city": "",
    "country": "",
    "description": "",
    "idealFor": ""
  }, ...
]`.trim()
}

function getQuestionText(questionId: number): string {
  const questions = {
    1: "I prefer planned itineraries vs. spontaneous adventures",
    2: "My energy level on trips is usually",
    3: "I value cultural immersion over comfort",
    4: "Crowds drain or energize me",
    5: "Describe a perfect travel day in three words"
  }
  return questions[questionId as keyof typeof questions] || "Question"
}

export async function getRecommendations(answers: Answer[], place: string) {
  try {
    const prompt = buildPrompt(answers, place)
    console.log('Built prompt:', prompt)
    
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    console.log('Claude response:', response.content[0].text)
    return response.content[0].text
  } catch (error) {
    console.error('Error in getRecommendations:', error)
    throw error
  }
} 