import { NextResponse } from "next/server";
import { addLabelToCard, removeLabelFromCard } from "@/lib/db/labels";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const body = await request.json();
    const { labelId } = body;

    await addLabelToCard(cardId, labelId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding label to card:", error);
    return NextResponse.json(
      { error: "Failed to add label to card" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const { searchParams } = new URL(request.url);
    const labelId = searchParams.get("labelId");

    if (!labelId) {
      return NextResponse.json(
        { error: "labelId is required" },
        { status: 400 }
      );
    }

    await removeLabelFromCard(cardId, labelId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing label from card:", error);
    return NextResponse.json(
      { error: "Failed to remove label from card" },
      { status: 500 }
    );
  }
}
