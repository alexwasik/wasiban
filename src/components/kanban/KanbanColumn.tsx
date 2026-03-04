'use client';

import { useState } from 'react';
import { App, Card, Typography, Dropdown, Input, Button, Badge } from 'antd';
import {
  MoreOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import { useAlert } from '@/contexts/AlertContext';
import type { MenuProps } from 'antd';
import { theme as antTheme } from 'antd';

const { Title } = Typography;

type Column = {
  id: string;
  name: string;
  position: number;
  cards: Array<{
    id: string;
    title: string;
    description: string | null;
    statusUpdate: string | null;
    position: number;
    dueDate: Date | null;
    priority: string | null;
    labels: Array<{
      label: {
        id: string;
        name: string;
        color: string;
        boardId: string;
      };
    }>;
  }>;
};

interface KanbanColumnProps {
  column: Column;
  boardId: string;
  onRefresh: () => void;
  newlyCreatedCardId?: string | null;
  onNewCardOpened?: () => void;
  onCardCreated?: (cardId: string) => void;
}

export function KanbanColumn({
  column,
  boardId,
  onRefresh,
  newlyCreatedCardId,
  onNewCardOpened,
  onCardCreated,
}: KanbanColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const { showAlert } = useAlert();
  const { modal } = App.useApp();
  const { token } = antTheme.useToken();

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardIds = column.cards.map((card) => card.id);

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) {
      showAlert('error', 'Please enter a card title');
      return;
    }

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCardTitle, columnId: column.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create card');
      }

      const newCard = await response.json();
      showAlert('success', 'Card created!');
      setNewCardTitle('');
      setIsAddingCard(false);
      onCardCreated?.(newCard.id);
      onRefresh();
    } catch (error) {
      console.error('Error creating card:', error);
      showAlert('error', 'Failed to create card');
    }
  };

  const handleDeleteColumn = () => {
    modal.confirm({
      title: 'Delete Column',
      icon: <ExclamationCircleOutlined />,
      content:
        'Are you sure you want to delete this column? All cards will be permanently deleted.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`/api/columns/${column.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete column');
          }

          showAlert('success', 'Column deleted!');
          onRefresh();
        } catch (error) {
          console.error('Error deleting column:', error);
          showAlert('error', 'Failed to delete column');
        }
      },
    });
  };

  const items: MenuProps['items'] = [
    {
      key: 'delete',
      label: 'Delete Column',
      danger: true,
      onClick: handleDeleteColumn,
    },
  ];

  return (
    <div
      ref={setSortableRef}
      style={{ minWidth: '300px', maxWidth: '300px', ...style }}
      {...attributes}
    >
      <Card
        size='small'
        title={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'grab',
              }}
              {...listeners}
            >
              <Title level={5} style={{ margin: 0 }}>
                {column.name}
              </Title>
              <Badge
                count={column.cards.length}
                showZero
                color={token.colorBorderSecondary}
                style={{ color: token.colorTextSecondary }}
              />
            </div>
            <Dropdown menu={{ items }} trigger={['click']}>
              <MoreOutlined style={{ cursor: 'pointer' }} />
            </Dropdown>
          </div>
        }
        style={{ background: token.colorBgLayout }}
        styles={{ body: { padding: '8px' } }}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div
            ref={setDroppableRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minHeight: '200px',
            }}
          >
            {column.cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                boardId={boardId}
                onRefresh={onRefresh}
                autoOpen={card.id === newlyCreatedCardId}
                onAutoOpened={onNewCardOpened}
              />
            ))}

            {isAddingCard ? (
              <div
                style={{
                  padding: '8px',
                  background: token.colorBgContainer,
                  borderRadius: '4px',
                }}
              >
                <Input
                  placeholder='Enter card title'
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onPressEnter={handleAddCard}
                  autoFocus
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button type='primary' size='small' onClick={handleAddCard}>
                    Add
                  </Button>
                  <Button
                    size='small'
                    onClick={() => {
                      setIsAddingCard(false);
                      setNewCardTitle('');
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
                onClick={() => setIsAddingCard(true)}
                style={{ width: '100%' }}
              >
                Add Card
              </Button>
            )}
          </div>
        </SortableContext>
      </Card>
    </div>
  );
}
