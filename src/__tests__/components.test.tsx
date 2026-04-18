import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import TelegramLanding from '@/components/landing/TelegramLanding';

describe('telegram landing', () => {
  it('describes a single-guide checkout without preview copy', () => {
    render(<TelegramLanding />);

    expect(screen.getByText('Оплачиваете и получаете PDF')).toBeInTheDocument();
    expect(screen.getByText('1 гайд = 1 платеж')).toBeInTheDocument();
    expect(screen.queryByText('Смотрите превью')).not.toBeInTheDocument();
  });
});
