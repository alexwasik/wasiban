import { NextResponse } from "next/server";
import { createCard } from "@/lib/db/cards";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get("priority");
    const boardId = searchParams.get("boardId");

    const where: Record<string, unknown> = {};
    if (priority) where.priority = priority;
    if (boardId) {
      where.column = { board: { id: boardId } };
    }

    const cards = await prisma.card.findMany({
      where,
      include: {
        labels: { include: { label: true } },
        column: { select: { id: true, name: true, boardId: true } },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, columnId, description, dueDate, priority } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Card title is required" },
        { status: 400 }
      );
    }

    if (!columnId || typeof columnId !== "string") {
      return NextResponse.json(
        { error: "Column ID is required" },
        { status: 400 }
      );
    }

    const card = await createCard({
      title,
      columnId,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority: priority || undefined,
    });
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
