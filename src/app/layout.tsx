import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Travel Guide Bot',
  description:
    'Telegram-бот с платными PDF-гайдами по путешествиям, превью и быстрой оплатой через Tribute.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
