import { prisma } from '../prisma';

export async function getCommentsByCardId(cardId: string) {
  return await prisma.comment.findMany({
    where: { cardId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createComment(data: { cardId: string; content: string }) {
  return await prisma.comment.create({
    data,
  });
}

export async function deleteComment(id: string) {
  return await prisma.comment.delete({
    where: { id },
  });
}
