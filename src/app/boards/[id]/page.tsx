import { notFound } from 'next/navigation';
import { getBoardById } from '@/lib/db/boards';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
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
      <KanbanBoard initialData={board} />
    </div>
  );
}
