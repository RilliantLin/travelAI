import { create } from "zustand";
import type {
  Itinerary,
  DayPlan,
  Activity,
  AccommodationPlan,
} from "@/types/itinerary";

export interface TransportInfo {
  id: string;
  from: string;
  to: string;
  mode: "walking" | "bus" | "subway" | "taxi" | "train" | "flight" | "driving";
  duration: number;
  distance?: number;
  cost?: number;
  details?: string;
}

export interface ItineraryState {
  itinerary: Itinerary | null;
  activeDay: number;
  highlightedActivityId: string | null;
  isLoading: boolean;
  error: string | null;

  setItinerary: (data: Itinerary | null) => void;
  setActiveDay: (day: number) => void;
  setHighlightedActivity: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  updateDay: (dayIndex: number, dayPlan: DayPlan) => void;
  addActivity: (dayIndex: number, activity: Activity) => void;
  removeActivity: (dayIndex: number, activityId: string) => void;
  replaceActivity: (
    dayIndex: number,
    oldActivityId: string,
    newActivity: Activity
  ) => void;
  modifyActivity: (
    dayIndex: number,
    activityId: string,
    changes: Partial<Activity>
  ) => void;
  setAccommodation: (
    dayIndex: number,
    accommodation: AccommodationPlan
  ) => void;
  reorderActivities: (dayIndex: number, activityIds: string[]) => void;
  applySnapshot: (itinerary: Itinerary) => void;
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  itinerary: null,
  activeDay: 0,
  highlightedActivityId: null,
  isLoading: false,
  error: null,

  setItinerary: (data) => set({ itinerary: data, activeDay: 0, error: null }),
  setActiveDay: (day) => set({ activeDay: day }),
  setHighlightedActivity: (id) => set({ highlightedActivityId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  updateDay: (dayIndex, dayPlan) => {
    const { itinerary } = get();
    if (!itinerary) return;
    const days = [...itinerary.days];
    days[dayIndex] = dayPlan;
    set({ itinerary: { ...itinerary, days } });
  },

  addActivity: (dayIndex, activity) => {
    const { itinerary } = get();
    if (!itinerary || !itinerary.days[dayIndex]) return;
    const days = [...itinerary.days];
    days[dayIndex] = {
      ...days[dayIndex],
      activities: [...days[dayIndex].activities, activity],
    };
    set({ itinerary: { ...itinerary, days } });
  },

  removeActivity: (dayIndex, activityId) => {
    const { itinerary } = get();
    if (!itinerary || !itinerary.days[dayIndex]) return;
    const days = [...itinerary.days];
    days[dayIndex] = {
      ...days[dayIndex],
      activities: days[dayIndex].activities.filter((a) => a.id !== activityId),
    };
    set({ itinerary: { ...itinerary, days } });
  },

  replaceActivity: (dayIndex, oldActivityId, newActivity) => {
    const { itinerary } = get();
    if (!itinerary || !itinerary.days[dayIndex]) return;
    const days = [...itinerary.days];
    days[dayIndex] = {
      ...days[dayIndex],
      activities: days[dayIndex].activities.map((a) =>
        a.id === oldActivityId ? newActivity : a
      ),
    };
    set({ itinerary: { ...itinerary, days } });
  },

  modifyActivity: (dayIndex, activityId, changes) => {
    const { itinerary } = get();
    if (!itinerary || !itinerary.days[dayIndex]) return;
    const days = [...itinerary.days];
    days[dayIndex] = {
      ...days[dayIndex],
      activities: days[dayIndex].activities.map((a) =>
        a.id === activityId ? { ...a, ...changes } : a
      ),
    };
    set({ itinerary: { ...itinerary, days } });
  },

  setAccommodation: (dayIndex, accommodation) => {
    const { itinerary } = get();
    if (!itinerary || !itinerary.days[dayIndex]) return;
    const days = [...itinerary.days];
    days[dayIndex] = { ...days[dayIndex], accommodation };
    set({ itinerary: { ...itinerary, days } });
  },

  reorderActivities: (dayIndex, activityIds) => {
    const { itinerary } = get();
    if (!itinerary || !itinerary.days[dayIndex]) return;
    const days = [...itinerary.days];
    const currentActivities = days[dayIndex].activities;
    const reordered = activityIds
      .map((id) => currentActivities.find((a) => a.id === id))
      .filter(Boolean) as Activity[];
    days[dayIndex] = { ...days[dayIndex], activities: reordered };
    set({ itinerary: { ...itinerary, days } });
  },

  applySnapshot: (newItinerary) => {
    set({ itinerary: newItinerary });
  },
}));
