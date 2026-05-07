import { create } from "zustand";

interface UIState {
  isHistoryDrawerOpen: boolean;
  openHistoryDrawer: () => void;
  closeHistoryDrawer: () => void;
  toggleHistoryDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isHistoryDrawerOpen: false,
  openHistoryDrawer: () => set({ isHistoryDrawerOpen: true }),
  closeHistoryDrawer: () => set({ isHistoryDrawerOpen: false }),
  toggleHistoryDrawer: () =>
    set((state) => ({ isHistoryDrawerOpen: !state.isHistoryDrawerOpen })),
}));
