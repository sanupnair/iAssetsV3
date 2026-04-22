import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen:    boolean;
  themeMode:      'light' | 'dark' | 'system';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar:  () => void;
  setThemeMode:   (mode: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen:    true,
      themeMode:      'light',

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar:  ()     => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setThemeMode:   (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'ui-store',
    },
  ),
);