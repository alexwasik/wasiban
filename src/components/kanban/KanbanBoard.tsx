'use client';

import { useState, useMemo } from 'react';
import { Button, Input, Select } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PriorityIcon, PRIORITY_OPTIONS } from '@/components/ui/PriorityIcon';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useAlert } from '@/contexts/AlertContext';
import type { BoardWithRelations } from '@/lib/db/boards';

type BoardData = NonNullable<
  Awaited<ReturnType<typeof import('@/lib/db/boards').getBoardById>>
>;

interface KanbanBoardProps {
  initialData: BoardData;
}

export function KanbanBoard({ initialData }: KanbanBoardProps) {
  const [board, setBoard] = useState(initialData);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [activeCard, setActiveCard] = useState<any>(null);
  const [activeColumn, setActiveColumn] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [newlyCreatedCardId, setNewlyCreatedCardId] = useState<string | null>(
    null
  );
  const { showAlert } = useAlert();

  const filteredBoard = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query && !priorityFilter) return board;
    return {
      ...board,
      columns: board.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => {
          const matchesSearch =
            !query ||
            card.title.toLowerCase().includes(query) ||
            (card.description &&
              card.description.toLowerCase().includes(query));
          const matchesPriority =
            !priorityFilter || card.priority === priorityFilter;
          return matchesSearch && matchesPriority;
        }),
      })),
    };
  }, [board, searchQuery, priorityFilter]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 1,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const refreshBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${board.id}`);
      if (response.ok) {
        const data = await response.json();
        setBoard(data);
      }
    } catch (error) {
      console.error('Error refreshing board:', error);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) {
      showAlert('error', 'Please enter a column name');
      return;
    }

    try {
      const response = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColumnName, boardId: board.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create column');
      }

      showAlert('success', 'Column created!');
      setNewColumnName('');
      setIsAddingColumn(false);
      refreshBoard();
    } catch (error) {
      console.error('Error creating column:', error);
      showAlert('error', 'Failed to create column');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeType = active.data.current?.type;

    if (activeType === 'card') {
      const card = active.data.current?.card;
      setActiveCard(card);
    } else if (activeType === 'column') {
      const column = active.data.current?.column;
      setActiveColumn(column);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType !== 'card') return;

    const activeCardId = active.id as string;
    let overColumnId: string;
    let overCardIndex = -1;

    if (overType === 'column') {
      overColumnId = over.id as string;
    } else if (overType === 'card') {
      overColumnId = over.data.current?.card.columnId;
      // Find the index of the card we're hovering over
      const overColumn = board.columns.find((col) => col.id === overColumnId);
      if (overColumn) {
        overCardIndex = overColumn.cards.findIndex((c) => c.id === over.id);
      }
    } else {
      return;
    }

    setBoard((prevBoard) => {
      const sourceColumn = prevBoard.columns.find((col) =>
        col.cards.some((c) => c.id === activeCardId)
      );
      if (!sourceColumn) return prevBoard;

      const activeCardData = sourceColumn.cards.find(
        (c) => c.id === activeCardId
      );
      if (!activeCardData) return prevBoard;

      const isSameColumn = sourceColumn.id === overColumnId;
      if (isSameColumn && overType === 'column') return prevBoard;

      const newColumns = prevBoard.columns.map((col) => {
        if (isSameColumn && col.id === overColumnId) {
          // Reorder within the same column
          const oldIndex = col.cards.findIndex((c) => c.id === activeCardId);
          const newIndex =
            overCardIndex >= 0 ? overCardIndex : col.cards.length - 1;
          if (oldIndex === newIndex) return col;
          return { ...col, cards: arrayMove(col.cards, oldIndex, newIndex) };
        }

        // Moving across columns: remove from source
        if (col.id === sourceColumn.id) {
          return {
            ...col,
            cards: col.cards.filter((c) => c.id !== activeCardId),
          };
        }

        // Moving across columns: add to target
        if (col.id === overColumnId) {
          const updatedCard = { ...activeCardData, columnId: overColumnId };
          const newCards = [...col.cards];
          if (overCardIndex >= 0) {
            newCards.splice(overCardIndex, 0, updatedCard);
          } else {
            newCards.push(updatedCard);
          }
          return { ...col, cards: newCards };
        }

        return col;
      });

      return { ...prevBoard, columns: newColumns };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCard(null);
    setActiveColumn(null);

    if (!over) return;

    const activeType = active.data.current?.type;

    // Handle card drop - persist the order from handleDragOver to the database
    if (activeType === 'card') {
      const activeCardId = active.id as string;

      // Find which column the card is now in (after handleDragOver updated state)
      const targetColumn = board.columns.find((col) =>
        col.cards.some((c) => c.id === activeCardId)
      );

      if (targetColumn) {
        try {
          // Update all card positions in the target column based on array order
          await Promise.all(
            targetColumn.cards.map((card, index) =>
              fetch(`/api/cards/${card.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  columnId: targetColumn.id,
                  position: index * 1000,
                }),
              })
            )
          );
          refreshBoard();
        } catch (error) {
          console.error('Error updating card:', error);
          showAlert('error', 'Failed to move card');
          refreshBoard();
        }
      }
    }

    // Handle column reordering
    const overType = over.data.current?.type;
    if (
      activeType === 'column' &&
      overType === 'column' &&
      active.id !== over.id
    ) {
      const oldIndex = board.columns.findIndex((col) => col.id === active.id);
      const newIndex = board.columns.findIndex((col) => col.id === over.id);

      const newColumns = arrayMove(board.columns, oldIndex, newIndex);

      setBoard({ ...board, columns: newColumns });

      // Update positions in database
      try {
        await Promise.all(
          newColumns.map((col, index) =>
            fetch(`/api/columns/${col.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ position: index }),
            })
          )
        );
      } catch (error) {
        console.error('Error updating column positions:', error);
        showAlert('error', 'Failed to reorder columns');
      }
    }
  };

  const columnIds = filteredBoard.columns.map((col) => col.id);

  return (
    <>
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <Input
          placeholder='Search cards...'
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
          style={{ maxWidth: '300px' }}
        />
        <Select
          placeholder='Priority'
          allowClear
          style={{ width: '160px' }}
          value={priorityFilter}
          onChange={(val) => setPriorityFilter(val ?? null)}
          options={PRIORITY_OPTIONS.map((opt) => ({
            value: opt.value,
            label: (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <PriorityIcon priority={opt.value} />
                {opt.label}
              </span>
            ),
          }))}
        />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          <div
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '16px',
            }}
          >
            {filteredBoard.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                boardId={board.id}
                onRefresh={refreshBoard}
                newlyCreatedCardId={newlyCreatedCardId}
                onNewCardOpened={() => setNewlyCreatedCardId(null)}
                onCardCreated={setNewlyCreatedCardId}
              />
            ))}

            <div style={{ minWidth: '300px' }}>
              {isAddingColumn ? (
                <div
                  style={{
                    background: '#f5f5f5',
                    padding: '16px',
                    borderRadius: '8px',
                  }}
                >
                  <Input
                    placeholder='Enter column name'
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onPressEnter={handleAddColumn}
                    autoFocus
                    style={{ marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      type='primary'
                      size='small'
                      onClick={handleAddColumn}
                    >
                      Add
                    </Button>
                    <Button
                      size='small'
                      onClick={() => {
                        setIsAddingColumn(false);
                        setNewColumnName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type='dashed'
                  icon={<PlusOutlined />}
                  onClick={() => setIsAddingColumn(true)}
                  style={{ width: '100%', height: '50px' }}
                >
                  Add Column
                </Button>
              )}
            </div>
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCard && (
            <KanbanCard
              card={activeCard}
              boardId={board.id}
              onRefresh={refreshBoard}
            />
          )}
          {activeColumn && (
            <KanbanColumn
              column={activeColumn}
              boardId={board.id}
              onRefresh={refreshBoard}
            />
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}
