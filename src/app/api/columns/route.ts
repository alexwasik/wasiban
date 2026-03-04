import { NextResponse } from "next/server";
import { createColumn } from "@/lib/db/columns";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, boardId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Column name is required" },
        { status: 400 }
      );
    }

    if (!boardId || typeof boardId !== "string") {
      return NextResponse.json(
        { error: "Board ID is required" },
        { status: 400 }
      );
    }

    const column = await createColumn({ name, boardId });
    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json(
      { error: "Failed to create column" },
      { status: 500 }
    );
  }
}
