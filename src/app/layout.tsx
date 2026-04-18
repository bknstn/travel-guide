import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Travel Guide Bot',
  description:
    'Telegram-бот с платными PDF-гайдами по путешествиям, оплатой через Tribute и доставкой файла прямо в чат.',
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
