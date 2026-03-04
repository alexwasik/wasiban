'use client';

import { Card, Dropdown, Typography, theme as antTheme } from 'antd';
import { MoreOutlined, FolderOutlined } from '@ant-design/icons';
import Link from 'next/link';
import type { MenuProps } from 'antd';
import type { BoardWithRelations } from '@/lib/db/boards';

const { Title, Text } = Typography;

interface BoardCardProps {
  board: BoardWithRelations;
  onEdit: (board: BoardWithRelations) => void;
  onDelete: (id: string) => void;
}

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  const { token } = antTheme.useToken();
  const items: MenuProps['items'] = [
    {
      key: 'edit',
      label: 'Edit',
      onClick: (e) => {
        e.domEvent.stopPropagation();
        e.domEvent.preventDefault();
        onEdit(board);
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        e.domEvent.preventDefault();
        onDelete(board.id);
      },
    },
  ];

  return (
    <Card
      hoverable
      style={{
        height: '100%',
        backgroundColor: board.color || token.colorBgContainer,
        overflow: 'hidden',
      }}
      extra={
        <Dropdown menu={{ items }} trigger={['click']}>
          <MoreOutlined
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            style={{ fontSize: '18px' }}
          />
        </Dropdown>
      }
    >
      <Link
        href={`/boards/${board.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FolderOutlined
            style={{ fontSize: '32px', color: token.colorPrimary }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <Title
              level={4}
              style={{
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {board.name}
            </Title>
            {board.description && (
              <Text type='secondary' ellipsis>
                {board.description}
              </Text>
            )}
            <div>
              <Text type='secondary' style={{ fontSize: '12px' }}>
                {board._count?.columns ?? 0} columns
              </Text>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
