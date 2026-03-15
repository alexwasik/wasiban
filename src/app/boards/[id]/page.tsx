import { notFound } from 'next/navigation';
import { getBoardById } from '@/lib/db/boards';
import { KanbanBoardClient } from '@/components/kanban/KanbanBoardClient';
import { BoardHeader } from '@/components/boards/BoardHeader';

export const dynamic = 'force-dynamic';

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await getBoardById(id);

  if (!board) {
    notFound();
  }

  return (
    <div>
      <BoardHeader name={board.name} description={board.description} />
      <KanbanBoardClient initialData={board} />
    </div>
  );
}
