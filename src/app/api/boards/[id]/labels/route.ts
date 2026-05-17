import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getBoardLabels, createLabel, getOrCreateDefaultLabels } from "@/lib/db/labels";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const labels = await getOrCreateDefaultLabels(id);
    return NextResponse.json(labels);
  } catch (error) {
    console.error("Error fetching labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch labels" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;
    const body = await request.json();
    const { name, color } = body;

    const label = await createLabel({
      name,
      color,
      boardId,
    });

    return NextResponse.json(label);
  } catch (error) {
    console.error("Error creating label:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A label with that name already exists on this board" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create label" },
      { status: 500 }
    );
  }
}
