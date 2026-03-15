'use client';

import dynamic from 'next/dynamic';

export const KanbanBoardClient = dynamic(
  () => import('./KanbanBoard').then((m) => m.KanbanBoard),
  { ssr: false }
);
