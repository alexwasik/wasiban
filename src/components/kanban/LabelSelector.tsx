'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Row,
  Col,
  theme as antTheme,
} from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useAlert } from '@/contexts/AlertContext';
import { useThemeMode } from '@/contexts/ThemeContext';

type Label = {
  id: string;
  name: string;
  color: string;
  boardId: string;
};

interface LabelSelectorProps {
  cardId: string;
  boardId: string;
  selectedLabels: Array<{
    label: Label;
  }>;
  onUpdate: () => void;
}

const PRESET_COLORS = [
  '#ff4d4f', // red
  '#ff7a45', // orange
  '#ffa940', // gold
  '#ffc53d', // yellow
  '#a0d911', // lime
  '#52c41a', // green
  '#13c2c2', // cyan
  '#1890ff', // blue
  '#2f54eb', // geekblue
  '#722ed1', // purple
  '#eb2f96', // magenta
];

export function LabelSelector({
  cardId,
  boardId,
  selectedLabels,
  onUpdate,
}: LabelSelectorProps) {
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const { showAlert } = useAlert();
  const { mode } = useThemeMode();
  const { token } = antTheme.useToken();
  const isDark = mode === 'dark';

  useEffect(() => {
    fetchLabels();
  }, [boardId]);

  const fetchLabels = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}/labels`);
      if (response.ok) {
        const data = await response.json();
        setAllLabels(data);
      }
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const handleToggleLabel = async (labelId: string, isSelected: boolean) => {
    try {
      if (isSelected) {
        // Remove label
        const response = await fetch(
          `/api/cards/${cardId}/labels?labelId=${labelId}`,
          {
            method: 'DELETE',
          }
        );
        if (!response.ok) throw new Error('Failed to remove label');
        showAlert('success', 'Label removed!');
      } else {
        // Add label
        const response = await fetch(`/api/cards/${cardId}/labels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ labelId }),
        });
        if (!response.ok) throw new Error('Failed to add label');
        showAlert('success', 'Label added!');
      }
      onUpdate();
    } catch (error) {
      console.error('Error toggling label:', error);
      showAlert('error', 'Failed to update label');
    }
  };

  const handleCreateLabel = async (values: { name: string }) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          color: selectedColor,
        }),
      });

      if (!response.ok) throw new Error('Failed to create label');

      showAlert('success', 'Label created!');
      form.resetFields();
      setSelectedColor(PRESET_COLORS[0]);
      setIsModalOpen(false);
      fetchLabels();
    } catch (error) {
      console.error('Error creating label:', error);
      showAlert('error', 'Failed to create label');
    }
  };

  const selectedLabelIds = selectedLabels.map((sl) => sl.label.id);

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <Space size={[8, 8]} wrap>
          {allLabels.map((label) => {
            const isSelected = selectedLabelIds.includes(label.id);
            return (
              <Tag
                key={label.id}
                color={isDark ? undefined : label.color}
                style={{
                  cursor: 'pointer',
                  border: isSelected
                    ? `2px solid ${token.colorText}`
                    : isDark
                      ? `1px solid ${label.color}`
                      : 'none',
                  fontWeight: isSelected ? 600 : 400,
                  padding: '4px 12px',
                  fontSize: '13px',
                  background: isDark ? 'transparent' : undefined,
                  color: isDark ? label.color : undefined,
                }}
                onClick={() => handleToggleLabel(label.id, isSelected)}
              >
                {label.name}
                {isSelected && (
                  <CloseOutlined
                    style={{ marginLeft: '6px', fontSize: '10px' }}
                  />
                )}
              </Tag>
            );
          })}
        </Space>
      </div>

      <Button
        type='dashed'
        icon={<PlusOutlined />}
        onClick={() => setIsModalOpen(true)}
        size='small'
      >
        Create Label
      </Button>

      <Modal
        title='Create New Label'
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSelectedColor(PRESET_COLORS[0]);
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout='vertical' onFinish={handleCreateLabel}>
          <Form.Item
            name='name'
            label='Label Name'
            rules={[{ required: true, message: 'Please enter a label name' }]}
          >
            <Input placeholder='e.g., High Priority, Bug, Feature' />
          </Form.Item>

          <Form.Item label='Color'>
            <Row gutter={[8, 8]}>
              {PRESET_COLORS.map((color) => (
                <Col key={color}>
                  <div
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border:
                        selectedColor === color
                          ? `3px solid ${token.colorText}`
                          : `1px solid ${token.colorBorder}`,
                    }}
                  />
                </Col>
              ))}
            </Row>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
