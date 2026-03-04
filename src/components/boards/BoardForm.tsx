"use client";

import { Modal, Form, Input, ColorPicker } from "antd";
import { useState } from "react";
import { useAlert } from "@/contexts/AlertContext";
import type { Color } from "antd/es/color-picker";
import type { BoardWithRelations } from "@/lib/db/boards";

interface BoardFormProps {
  open: boolean;
  board?: BoardWithRelations | null;
  onCancel: () => void;
  onSuccess: (boardId?: string) => void;
}

export function BoardForm({ open, board, onCancel, onSuccess }: BoardFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleSubmit = async (values: {
    name: string;
    description?: string;
    color?: Color;
  }) => {
    setLoading(true);
    try {
      const colorValue =
        typeof values.color === "string"
          ? values.color
          : values.color?.toHexString?.();

      const data = {
        name: values.name,
        description: values.description,
        color: colorValue,
      };

      const url = board ? `/api/boards/${board.id}` : "/api/boards";
      const method = board ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save board");
      }

      const result = await response.json();
      showAlert('success', board ? "Board updated!" : "Board created!");
      form.resetFields();
      onSuccess(board ? board.id : result.id);
    } catch (error) {
      console.error("Error saving board:", error);
      showAlert('error', "Failed to save board");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={board ? "Edit Board" : "Create Board"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={board || undefined}
      >
        <Form.Item
          name="name"
          label="Board Name"
          rules={[{ required: true, message: "Please enter a board name" }]}
        >
          <Input placeholder="e.g., Work, Personal, Projects" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea
            rows={3}
            placeholder="Optional description for your board"
          />
        </Form.Item>

        <Form.Item name="color" label="Color">
          <ColorPicker showText format="hex" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
