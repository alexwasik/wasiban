import { NextResponse } from "next/server";
import { getBoards, createBoard } from "@/lib/db/boards";

export async function GET() {
  try {
    const boards = await getBoards();
    return NextResponse.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Board name is required" },
        { status: 400 }
      );
    }

    const board = await createBoard({ name, description, color });
    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 }
    );
  }
}
