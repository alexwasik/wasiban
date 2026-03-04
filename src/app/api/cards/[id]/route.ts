import { NextResponse } from 'next/server';
import { getCardById, updateCard, deleteCard } from '@/lib/db/cards';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const card = await getCardById(id);

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      statusUpdate,
      dueDate,
      position,
      columnId,
      priority,
    } = body;

    const card = await updateCard(id, {
      title,
      description: description !== undefined ? description : undefined,
      statusUpdate: statusUpdate !== undefined ? statusUpdate : undefined,
      dueDate:
        dueDate !== undefined
          ? dueDate
            ? new Date(dueDate)
            : null
          : undefined,
      position,
      columnId,
      priority: priority !== undefined ? priority : undefined,
    });
    return NextResponse.json(card);
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteCard(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}
