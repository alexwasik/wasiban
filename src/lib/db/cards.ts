import { prisma } from '../prisma';

export async function getCardById(id: string) {
  return await prisma.card.findUnique({
    where: { id },
    include: {
      labels: {
        include: {
          label: true,
        },
      },
      checklistItems: {
        orderBy: { position: 'asc' },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createCard(data: {
  title: string;
  columnId: string;
  description?: string;
  dueDate?: Date;
  priority?: string;
}) {
  const maxPosition = await prisma.card.findFirst({
    where: { columnId: data.columnId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  return await prisma.card.create({
    data: {
      ...data,
      position: (maxPosition?.position ?? 0) + 1000,
    },
  });
}

export async function updateCard(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    statusUpdate?: string | null;
    dueDate?: Date | null;
    position?: number;
    columnId?: string;
    priority?: string | null;
  }
) {
  return await prisma.card.update({
    where: { id },
    data,
  });
}

export async function moveCard(id: string, columnId: string, position: number) {
  return await prisma.card.update({
    where: { id },
    data: {
      columnId,
      position,
    },
  });
}

export async function deleteCard(id: string) {
  return await prisma.card.delete({
    where: { id },
  });
}

export async function filterCards(filters: {
  priority?: string;
  boardId?: string;
  columnId?: string;
}) {
  const where: Record<string, unknown> = {};
  if (filters.priority) where.priority = filters.priority;
  if (filters.columnId) where.columnId = filters.columnId;
  if (filters.boardId) where.column = { board: { id: filters.boardId } };

  return await prisma.card.findMany({
    where,
    include: {
      labels: { include: { label: true } },
      column: { select: { id: true, name: true, boardId: true } },
    },
    orderBy: { position: 'asc' },
  });
}
