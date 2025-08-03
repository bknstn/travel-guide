import '@testing-library/jest-dom';

// Basic test to ensure testing setup works
describe('Basic Test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});

// Example component test (uncomment when components are ready for testing)
/*
import PersonalityQuiz from '@/components/PersonalityQuiz'

describe('PersonalityQuiz', () => {
  it('renders personality quiz', () => {
    const mockOnChange = jest.fn()
    render(<PersonalityQuiz onChange={mockOnChange} />)
    
    expect(screen.getByText('Who you are?')).toBeInTheDocument()
  })
})
*/
