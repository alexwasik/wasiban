"use client";

import { useState, useEffect } from "react";
import { Menu, theme, Button } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  AppstoreOutlined,
  PlusOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BoardForm } from "@/components/boards/BoardForm";
import type { MenuProps } from "antd";

type Board = {
  id: string;
  name: string;
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { token } = theme.useToken();

  useEffect(() => {
    fetchBoards();
    const handler = () => fetchBoards();
    window.addEventListener("boards-updated", handler);
    return () => window.removeEventListener("boards-updated", handler);
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/boards");
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
    }
  };

  const handleFormSuccess = (boardId?: string) => {
    fetchBoards();
    setIsFormOpen(false);
    window.dispatchEvent(new CustomEvent("boards-updated"));
    if (boardId) {
      router.push(`/boards/${boardId}`);
    }
  };

  const items: MenuProps["items"] = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: <Link href="/">Projects</Link>,
    },
    {
      key: "my-boards",
      icon: <AppstoreOutlined />,
      label: "My Boards",
      children: boards.length === 0
        ? [{ key: "no-boards", label: "No Project Boards", disabled: true }]
        : boards.map((board) => ({
            key: `/boards/${board.id}`,
            label: <Link href={`/boards/${board.id}`}>{board.name}</Link>,
          })),
    },
  ];

  const sidebarBg = token.colorBgContainer;

  return (
    <div
      style={{
        width: collapsed ? "80px" : "250px",
        transition: "width 0.2s",
        background: sidebarBg,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-end",
        }}
      >
        {collapsed ? (
          <MenuUnfoldOutlined
            onClick={() => setCollapsed(false)}
            style={{ fontSize: "18px", cursor: "pointer", color: token.colorText }}
          />
        ) : (
          <MenuFoldOutlined
            onClick={() => setCollapsed(true)}
            style={{ fontSize: "18px", cursor: "pointer", color: token.colorText }}
          />
        )}
      </div>
      {!collapsed && (
        <div style={{ padding: "16px" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsFormOpen(true)}
            block
          >
            Create Board
          </Button>
        </div>
      )}
      <Menu
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[pathname]}
        defaultOpenKeys={["my-boards"]}
        items={items}
        style={{
          border: "none",
          flex: 1,
          background: sidebarBg
        }}
      />
      <BoardForm
        open={isFormOpen}
        onCancel={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
