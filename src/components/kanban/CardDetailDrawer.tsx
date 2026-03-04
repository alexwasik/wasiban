'use client';

import { useState, useEffect, useRef, memo } from 'react';
import {
  App,
  Drawer,
  Input,
  Button,
  DatePicker,
  Select,
  Space,
  Divider,
  Typography,
  theme as antTheme,
} from 'antd';
import {
  CalendarOutlined,
  DeleteOutlined,
  SaveOutlined,
  EditOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  BoldOutlined,
  ItalicOutlined,
  FontSizeOutlined,
  CheckSquareOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  SendOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useAlert } from '@/contexts/AlertContext';
import { LabelSelector } from './LabelSelector';
import { PriorityIcon, PRIORITY_OPTIONS } from '@/components/ui/PriorityIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

type Comment = {
  id: string;
  content: string;
  cardId: string;
  createdAt: string;
  updatedAt: string;
};

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

interface CardDetailDrawerProps {
  card: CardData | null;
  boardId: string;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

// ─── Reusable Markdown Editor ────────────────────────────────────────────────

const MarkdownEditor = memo(function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const { token } = antTheme.useToken();
  const [previewMode, setPreviewMode] = useState(false);
  const textAreaRef = useRef<any>(null);

  const getTA = (): HTMLTextAreaElement | null =>
    textAreaRef.current?.resizableTextArea?.textArea ?? null;

  const applyInline = (prefix: string, suffix: string) => {
    const ta = getTA();
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const next =
      value.substring(0, s) +
      prefix +
      value.substring(s, e) +
      suffix +
      value.substring(e);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = s + prefix.length;
      ta.selectionEnd = e + prefix.length;
    }, 0);
  };

  const applyLine = (linePrefix: string) => {
    const ta = getTA();
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const lineEnd = value.indexOf('\n', e);
    const actualEnd = lineEnd === -1 ? value.length : lineEnd;
    const formatted = value
      .substring(lineStart, actualEnd)
      .split('\n')
      .map((l: string) => linePrefix + l)
      .join('\n');
    const next =
      value.substring(0, lineStart) + formatted + value.substring(actualEnd);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = lineStart;
      ta.selectionEnd = lineStart + formatted.length;
    }, 0);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
          minHeight: '24px',
        }}
      >
        {!previewMode ? (
          <Space size={2}>
            <Button
              type='text'
              size='small'
              icon={<BoldOutlined />}
              onClick={() => applyInline('**', '**')}
              title='Bold'
            />
            <Button
              type='text'
              size='small'
              icon={<ItalicOutlined />}
              onClick={() => applyInline('*', '*')}
              title='Italic'
            />
            <Button
              type='text'
              size='small'
              icon={<CodeOutlined />}
              onClick={() => applyInline('`', '`')}
              title='Code'
            />
            <Button
              type='text'
              size='small'
              icon={<FontSizeOutlined />}
              onClick={() => applyLine('### ')}
              title='Heading'
            />
            <Button
              type='text'
              size='small'
              icon={<UnorderedListOutlined />}
              onClick={() => applyLine('- ')}
              title='Bullet list'
            />
            <Button
              type='text'
              size='small'
              icon={<CheckSquareOutlined />}
              onClick={() => applyLine('- [ ] ')}
              title='Checklist'
            />
          </Space>
        ) : (
          <span />
        )}
        <Button
          type='text'
          size='small'
          icon={previewMode ? <EditOutlined /> : <EyeOutlined />}
          onClick={() => setPreviewMode((p) => !p)}
        >
          {previewMode ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {!previewMode ? (
        <TextArea
          ref={textAreaRef}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <div
          style={{
            border: `1px solid ${token.colorBorder}`,
            borderRadius: '6px',
            padding: '12px',
            minHeight: `${rows * 26}px`,
            background: token.colorFillAlter,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {value || '*No content*'}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
});

// ─── Save Button Row ─────────────────────────────────────────────────────────

function SaveRow({
  loading,
  onClick,
  label = 'Save',
  disabled,
}: {
  loading: boolean;
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}
    >
      <Button
        size='small'
        type='primary'
        icon={label === 'Post Comment' ? <SendOutlined /> : <SaveOutlined />}
        loading={loading}
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </Button>
    </div>
  );
}

// ─── Main Drawer ─────────────────────────────────────────────────────────────

export function CardDetailDrawer({
  card,
  boardId,
  open,
  onClose,
  onUpdate,
  onDelete,
}: CardDetailDrawerProps) {
  const { token } = antTheme.useToken();
  const { modal } = App.useApp();
  const { showAlert } = useAlert();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [dueDate, setDueDate] = useState<dayjs.Dayjs | null>(null);
  const [priority, setPriority] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const [savingTitle, setSavingTitle] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    if (card && open) {
      setTitle(card.title);
      setDescription(card.description || '');
      setStatusUpdate(card.statusUpdate || '');
      setDueDate(card.dueDate ? dayjs(card.dueDate) : null);
      setPriority(card.priority || null);
      setNewComment('');
      fetchComments(card.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, open]);

  const fetchComments = async (cardId: string) => {
    try {
      const res = await fetch(`/api/cards/${cardId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const patchCard = async (fields: Record<string, unknown>) => {
    const res = await fetch(`/api/cards/${card!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (!res.ok) throw new Error('Failed to update card');
    onUpdate();
  };

  const handleTitleBlur = async () => {
    if (!card || title.trim() === card.title) return;
    if (!title.trim()) {
      setTitle(card.title);
      return;
    }
    setSavingTitle(true);
    try {
      await patchCard({ title: title.trim() });
      showAlert('success', 'Title saved!');
    } catch {
      showAlert('error', 'Failed to save title');
      setTitle(card.title);
    } finally {
      setSavingTitle(false);
    }
  };

  const handleDueDateChange = async (value: dayjs.Dayjs | null) => {
    setDueDate(value);
    if (!card) return;
    try {
      await patchCard({ dueDate: value ? value.toISOString() : null });
    } catch {
      showAlert('error', 'Failed to save due date');
    }
  };

  const handlePriorityChange = async (value: string | undefined) => {
    const next = value ?? null;
    setPriority(next);
    if (!card) return;
    try {
      await patchCard({ priority: next });
    } catch {
      showAlert('error', 'Failed to save priority');
    }
  };

  const handleSaveDescription = async () => {
    if (!card) return;
    setSavingDesc(true);
    try {
      await patchCard({ description: description || null });
      showAlert('success', 'Description saved!');
    } catch {
      showAlert('error', 'Failed to save description');
    } finally {
      setSavingDesc(false);
    }
  };

  const handleSaveStatusUpdate = async () => {
    if (!card) return;
    setSavingStatus(true);
    try {
      await patchCard({ statusUpdate: statusUpdate || null });
      showAlert('success', 'Status update saved!');
    } catch {
      showAlert('error', 'Failed to save status update');
    } finally {
      setSavingStatus(false);
    }
  };

  const handlePostComment = async () => {
    if (!card || !newComment.trim()) return;
    setSavingComment(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      setNewComment('');
      fetchComments(card.id);
      showAlert('success', 'Comment posted!');
    } catch {
      showAlert('error', 'Failed to post comment');
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!card) return;
    try {
      const res = await fetch(
        `/api/cards/${card.id}/comments?commentId=${commentId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete comment');
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      showAlert('error', 'Failed to delete comment');
    }
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  if (!card) return null;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined />
          <Text strong>Card Details</Text>
        </div>
      }
      placement='right'
      size='large'
      onClose={onClose}
      open={open}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              modal.confirm({
                title: 'Delete Card',
                icon: <ExclamationCircleOutlined />,
                content: 'Are you sure you want to delete this card?',
                okText: 'Delete',
                okType: 'danger',
                onOk: handleDelete,
              })
            }
          >
            Delete Card
          </Button>
        </div>
      }
    >
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <Text
          type='secondary'
          style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}
        >
          Title
        </Text>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onPressEnter={(e) => (e.currentTarget as HTMLInputElement).blur()}
          size='large'
          placeholder='Card title'
          suffix={
            savingTitle ? (
              <SyncOutlined spin style={{ color: token.colorTextSecondary }} />
            ) : undefined
          }
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: '20px' }}>
        <Text
          type='secondary'
          style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}
        >
          Description
        </Text>
        <MarkdownEditor
          value={description}
          onChange={setDescription}
          placeholder='Add a more detailed description... (supports markdown)'
          rows={5}
        />
        <SaveRow loading={savingDesc} onClick={handleSaveDescription} />
      </div>

      {/* Due Date */}
      <div style={{ marginBottom: '20px' }}>
        <Text
          type='secondary'
          style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}
        >
          Due Date
        </Text>
        <DatePicker
          style={{ width: '100%' }}
          format='YYYY-MM-DD'
          placeholder='Select due date'
          value={dueDate}
          onChange={handleDueDateChange}
        />
      </div>

      {/* Priority */}
      <div style={{ marginBottom: '20px' }}>
        <Text
          type='secondary'
          style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}
        >
          Priority
        </Text>
        <Select
          style={{ width: '100%' }}
          placeholder='No priority'
          allowClear
          value={priority ?? undefined}
          onChange={handlePriorityChange}
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

      <Divider />

      {/* Status Update */}
      <div style={{ marginBottom: '20px' }}>
        <Title level={5} style={{ marginBottom: '8px' }}>
          Status Update
        </Title>
        <MarkdownEditor
          value={statusUpdate}
          onChange={setStatusUpdate}
          placeholder='Post a status update... (supports markdown)'
          rows={4}
        />
        <SaveRow loading={savingStatus} onClick={handleSaveStatusUpdate} />
      </div>

      <Divider />

      {/* Labels */}
      <div style={{ marginBottom: '20px' }}>
        <Title level={5} style={{ marginBottom: '12px' }}>
          Labels
        </Title>
        <LabelSelector
          cardId={card.id}
          boardId={boardId}
          selectedLabels={card.labels}
          onUpdate={onUpdate}
        />
      </div>

      <Divider />

      {/* Comments */}
      <div>
        <Title level={5} style={{ marginBottom: '8px' }}>
          Comments
        </Title>
        <MarkdownEditor
          value={newComment}
          onChange={setNewComment}
          placeholder='Add a comment... (supports markdown)'
          rows={3}
        />
        <SaveRow
          loading={savingComment}
          onClick={handlePostComment}
          label='Post Comment'
          disabled={!newComment.trim()}
        />

        {comments.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: '6px',
                  padding: '10px 12px',
                  background: token.colorFillAlter,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <Text type='secondary' style={{ fontSize: '11px' }}>
                    {dayjs(comment.createdAt).format('MMM D, YYYY h:mm A')}
                  </Text>
                  <Button
                    type='text'
                    danger
                    size='small'
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{ padding: '0 4px', height: 'auto' }}
                  />
                </div>
                <div style={{ fontSize: '13px' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {comment.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
