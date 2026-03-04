import { prisma } from '../prisma';

export async function getColumnsByBoardId(boardId: string) {
  return await prisma.column.findMany({
    where: { boardId },
    orderBy: { position: 'asc' },
    include: {
      cards: {
        orderBy: { position: 'asc' },
        include: {
          labels: {
            include: {
              label: true,
            },
          },
        },
      },
    },
  });
}

export async function createColumn(data: { name: string; boardId: string }) {
  const maxPosition = await prisma.column.findFirst({
    where: { boardId: data.boardId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  return await prisma.column.create({
    data: {
      ...data,
      position: (maxPosition?.position ?? 0) + 1000,
    },
  });
}

export async function updateColumn(
  id: string,
  data: {
    name?: string;
    position?: number;
  }
) {
  return await prisma.column.update({
    where: { id },
    data,
  });
}

export async function deleteColumn(id: string) {
  return await prisma.column.delete({
    where: { id },
  });
}
