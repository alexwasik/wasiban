"use client";

import { useState, useEffect, useCallback } from "react";
import { Row, Col, Button, App, Empty } from "antd";
import { PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { BoardCard } from "./BoardCard";
import { BoardForm } from "./BoardForm";
import { useAlert } from "@/contexts/AlertContext";
import type { BoardWithRelations } from "@/lib/db/boards";

interface BoardListProps {
  initialBoards: BoardWithRelations[];
}

export function BoardList({ initialBoards }: BoardListProps) {
  const [boards, setBoards] = useState(initialBoards);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<BoardWithRelations | null>(
    null
  );
  const { showAlert } = useAlert();
  const { modal } = App.useApp();

  const refreshBoards = useCallback(async () => {
    try {
      const response = await fetch("/api/boards");
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error("Error refreshing boards:", error);
    }
  }, []);

  useEffect(() => {
    const handler = () => refreshBoards();
    window.addEventListener("boards-updated", handler);
    return () => window.removeEventListener("boards-updated", handler);
  }, [refreshBoards]);

  const handleEdit = (board: BoardWithRelations) => {
    setEditingBoard(board);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Delete Board",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to delete this board? All columns and cards will be permanently deleted.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/boards/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete board");
          }

          showAlert('success', 'Board deleted!');
          refreshBoards();
          window.dispatchEvent(new CustomEvent("boards-updated"));
        } catch (error) {
          console.error("Error deleting board:", error);
          showAlert('error', 'Failed to delete board');
        }
      },
    });
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBoard(null);
  };

  const handleFormSuccess = () => {
    refreshBoards();
    handleFormClose();
  };

  return (
    <>
      {boards.length === 0 ? (
        <Empty
          description="No boards yet. Create your first board to get started!"
          style={{ marginTop: "48px" }}
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsFormOpen(true)}
            size="large"
          >
            Create Your First Board
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {boards.map((board) => (
            <Col key={board.id} xs={24} sm={12} md={8} lg={6}>
              <BoardCard
                board={board}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Col>
          ))}
        </Row>
      )}

      <BoardForm
        open={isFormOpen}
        board={editingBoard}
        onCancel={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}
