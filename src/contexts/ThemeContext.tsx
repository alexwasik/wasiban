"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { App, ConfigProvider, theme as antTheme } from "antd";

type ThemeMode = "light" | "dark";

const ThemeContext = createContext<{
  mode: ThemeMode;
  toggleMode: () => void;
}>({
  mode: "light",
  toggleMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme-mode") as ThemeMode | null;
    if (saved) setMode(saved);
  }, []);

  const toggleMode = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("theme-mode", next);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ConfigProvider
        theme={{
          algorithm:
            mode === "dark"
              ? antTheme.darkAlgorithm
              : antTheme.defaultAlgorithm,
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
