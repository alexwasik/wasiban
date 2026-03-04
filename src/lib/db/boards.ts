import { prisma } from '../prisma';
import type { Board } from '@prisma/client';

export type BoardWithRelations = Board & {
  _count?: {
    columns: number;
  };
};

export async function getBoards(): Promise<BoardWithRelations[]> {
  return await prisma.board.findMany({
    orderBy: {
      position: 'asc',
    },
    include: {
      _count: {
        select: { columns: true },
      },
    },
  });
}

export async function getBoardById(id: string) {
  return await prisma.board.findUnique({
    where: { id },
    include: {
      columns: {
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
              checklistItems: {
                orderBy: { position: 'asc' },
              },
            },
          },
        },
      },
      labels: true,
    },
  });
}

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Blocked', 'Completed'];
const DEFAULT_LABELS = [
  { name: 'Bug', color: 'red' },
  { name: 'Feature', color: 'blue' },
  { name: "Won't Fix", color: 'volcano' },
  { name: 'Backlog', color: 'default' },
];

export async function createBoard(data: {
  name: string;
  description?: string;
  color?: string;
}) {
  const maxPosition = await prisma.board.findFirst({
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  return await prisma.board.create({
    data: {
      ...data,
      position: (maxPosition?.position ?? 0) + 1000,
      columns: {
        create: DEFAULT_COLUMNS.map((name, index) => ({
          name,
          position: index * 1000,
        })),
      },
      labels: {
        create: DEFAULT_LABELS.map((label) => ({
          name: label.name,
          color: label.color,
        })),
      },
    },
  });
}

export async function updateBoard(
  id: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
  }
) {
  return await prisma.board.update({
    where: { id },
    data,
  });
}

export async function deleteBoard(id: string) {
  return await prisma.board.delete({
    where: { id },
  });
}
