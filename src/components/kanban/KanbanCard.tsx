'use client';

import { useState, useEffect } from 'react';
import { App, Card, Tag, theme as antTheme } from 'antd';
import { CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAlert } from '@/contexts/AlertContext';
import { CardDetailDrawer } from './CardDetailDrawer';
import { PriorityIcon } from '@/components/ui/PriorityIcon';
import type { MenuProps } from 'antd';

type CardData = {
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
};

interface KanbanCardProps {
  card: CardData;
  boardId: string;
  onRefresh: () => void;
  autoOpen?: boolean;
  onAutoOpened?: () => void;
}

export function KanbanCard({
  card,
  boardId,
  onRefresh,
  autoOpen,
  onAutoOpened,
}: KanbanCardProps) {
  const { showAlert } = useAlert();
  const { modal } = App.useApp();
  const { token } = antTheme.useToken();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (autoOpen) {
      setDrawerOpen(true);
      onAutoOpened?.();
    }
  }, [autoOpen, onAutoOpened]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Delete Card',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this card?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`/api/cards/${card.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('Failed to delete card');
          }

          showAlert('success', 'Card deleted!');
          onRefresh();
        } catch (error) {
          console.error('Error deleting card:', error);
          showAlert('error', 'Failed to delete card');
        }
      },
    });
  };

  return (
    <>
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card
          size='small'
          hoverable
          style={{ cursor: 'grab' }}
          styles={{ body: { padding: '12px' } }}
          onClick={(e) => {
            e.stopPropagation();
            setDrawerOpen(true);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDelete();
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontWeight: 500 }}>{card.title}</div>

            {card.description && (
              <>
                <div
                  style={{
                    fontSize: '12px',
                    color: token.colorTextSecondary,
                    overflow: 'hidden',
                    maxHeight: expanded ? undefined : '60px',
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {card.description}
                  </ReactMarkdown>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: token.colorPrimary,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                >
                  {expanded ? 'Show less' : '...'}
                </div>
              </>
            )}

            {(card.labels.length > 0 || card.priority) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexWrap: 'wrap',
                }}
              >
                {card.labels.map(({ label }) => (
                  <Tag key={label.id} color={label.color} style={{ margin: 0 }}>
                    {label.name}
                  </Tag>
                ))}
                {card.priority && (
                  <span style={{ marginLeft: 'auto' }}>
                    <PriorityIcon priority={card.priority} showLabel />
                  </span>
                )}
              </div>
            )}

            {card.dueDate && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: token.colorTextSecondary,
                }}
              >
                <CalendarOutlined />
                {new Date(card.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </Card>
      </div>

      <CardDetailDrawer
        card={card}
        boardId={boardId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={onRefresh}
        onDelete={handleDelete}
      />
    </>
  );
}
