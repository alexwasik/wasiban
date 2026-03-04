import { prisma } from '../prisma';

export async function getBoardLabels(boardId: string) {
  return prisma.label.findMany({
    where: { boardId },
    orderBy: { name: 'asc' },
  });
}

export async function createLabel(data: {
  name: string;
  color: string;
  boardId: string;
}) {
  return prisma.label.create({
    data,
  });
}

export async function deleteLabel(id: string) {
  return prisma.label.delete({
    where: { id },
  });
}

export async function addLabelToCard(cardId: string, labelId: string) {
  return prisma.cardLabel.create({
    data: {
      cardId,
      labelId,
    },
  });
}

export async function removeLabelFromCard(cardId: string, labelId: string) {
  return prisma.cardLabel.delete({
    where: {
      cardId_labelId: {
        cardId,
        labelId,
      },
    },
  });
}

export async function getOrCreateDefaultLabels(boardId: string) {
  // Check if labels already exist for this board
  const existingLabels = await getBoardLabels(boardId);

  if (existingLabels.length > 0) {
    return existingLabels;
  }

  // Create default labels
  const defaultLabels = [
    { name: 'High Priority', color: '#ff4d4f' },
    { name: 'In Progress', color: '#1890ff' },
    { name: 'Review', color: '#52c41a' },
  ];

  const createdLabels = await Promise.all(
    defaultLabels.map((label) => createLabel({ ...label, boardId }))
  );

  return createdLabels;
}
