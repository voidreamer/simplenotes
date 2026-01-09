import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface User {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  households: string[];
}

export interface Household {
  household_id: string;
  name: string;
  owner_id: string;
  members: { user_id: string; name: string; email: string; picture: string }[];
  created_at: string;
  updated_at: string;
}

export interface ListItem {
  id: string;
  text: string;
  checked: boolean;
  quantity?: number;
  unit?: string;
  category?: string;
  note?: string;
  added_by?: string;
  created_at?: string;
}

export interface List {
  list_id: string;
  household_id: string;
  title: string;
  type: 'note' | 'checklist' | 'shopping';
  items: ListItem[];
  content: string;  // Rich text content for notes
  created_by: string;
  created_at: string;
  updated_at: string;
  color: string;
  icon: string;
  pinned: boolean;
}

// Auth Store
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);

// Household Store
interface HouseholdState {
  households: Household[];
  currentHousehold: Household | null;
  setHouseholds: (households: Household[]) => void;
  setCurrentHousehold: (household: Household | null) => void;
  addHousehold: (household: Household) => void;
  updateHousehold: (id: string, updates: Partial<Household>) => void;
  removeHousehold: (id: string) => void;
}

export const useHouseholdStore = create<HouseholdState>((set) => ({
  households: [],
  currentHousehold: null,
  setHouseholds: (households) => set({ households }),
  setCurrentHousehold: (currentHousehold) => set({ currentHousehold }),
  addHousehold: (household) =>
    set((state) => ({ households: [...state.households, household] })),
  updateHousehold: (id, updates) =>
    set((state) => ({
      households: state.households.map((h) =>
        h.household_id === id ? { ...h, ...updates } : h
      ),
    })),
  removeHousehold: (id) =>
    set((state) => ({
      households: state.households.filter((h) => h.household_id !== id),
      currentHousehold:
        state.currentHousehold?.household_id === id ? null : state.currentHousehold,
    })),
}));

// Lists Store
interface ListsState {
  lists: List[];
  currentList: List | null;
  isLoading: boolean;
  setLists: (lists: List[]) => void;
  setCurrentList: (list: List | null) => void;
  addList: (list: List) => void;
  updateList: (id: string, householdId: string, updates: Partial<List>) => void;
  removeList: (id: string) => void;
  setLoading: (loading: boolean) => void;
  toggleItem: (listId: string, itemId: string) => void;
  addItem: (listId: string, item: ListItem) => void;
  removeItem: (listId: string, itemId: string) => void;
}

export const useListsStore = create<ListsState>((set) => ({
  lists: [],
  currentList: null,
  isLoading: false,
  setLists: (lists) => set({ lists }),
  setCurrentList: (currentList) => set({ currentList }),
  addList: (list) => set((state) => ({ lists: [list, ...state.lists] })),
  updateList: (id, householdId, updates) =>
    set((state) => ({
      lists: state.lists.map((l) =>
        l.list_id === id && l.household_id === householdId ? { ...l, ...updates } : l
      ),
      currentList:
        state.currentList?.list_id === id ? { ...state.currentList, ...updates } : state.currentList,
    })),
  removeList: (id) =>
    set((state) => ({
      lists: state.lists.filter((l) => l.list_id !== id),
      currentList: state.currentList?.list_id === id ? null : state.currentList,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  toggleItem: (listId, itemId) =>
    set((state) => {
      const updateItems = (items: ListItem[]) =>
        items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );

      return {
        lists: state.lists.map((l) =>
          l.list_id === listId ? { ...l, items: updateItems(l.items) } : l
        ),
        currentList:
          state.currentList?.list_id === listId
            ? { ...state.currentList, items: updateItems(state.currentList.items) }
            : state.currentList,
      };
    }),
  addItem: (listId, item) =>
    set((state) => ({
      lists: state.lists.map((l) =>
        l.list_id === listId ? { ...l, items: [...l.items, item] } : l
      ),
      currentList:
        state.currentList?.list_id === listId
          ? { ...state.currentList, items: [...state.currentList.items, item] }
          : state.currentList,
    })),
  removeItem: (listId, itemId) =>
    set((state) => {
      const filterItems = (items: ListItem[]) =>
        items.filter((i) => i.id !== itemId);

      return {
        lists: state.lists.map((l) =>
          l.list_id === listId ? { ...l, items: filterItems(l.items) } : l
        ),
        currentList:
          state.currentList?.list_id === listId
            ? { ...state.currentList, items: filterItems(state.currentList.items) }
            : state.currentList,
      };
    }),
}));
