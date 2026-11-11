import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'CYBERFORGE — Комплектующие для ПК, Конструктор и Расчет FPS в Ташкенте',
  description:
    'Интернет-магазин мощных комплектующих для ПК в Ташкенте. Интерактивный конфигуратор ПК с живой визуализацией сборки корпуса, калькулятор FPS в 20 тяжелых играх, оплата и чеки через Telegram бот в сумах (UZS).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="antialiased selection:bg-cyan-500 selection:text-black">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
