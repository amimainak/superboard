// ============================================================
// Zustand Store — Global Application State
// ============================================================

import { create } from 'zustand';
import type { Subject, BrandingConfig, Participant, Tier } from '@/types';

export interface RoomState {
  roomId: string | null;
  subject: Subject;
  isActive: boolean;
  isTutor: boolean;
  userId: string | null;
  userName: string | null;
  userColor: string;
  participants: Participant[];
  branding: BrandingConfig;
  currentPageIndex: number;
  totalPages: number;
  focusMode: boolean;
  isRecording: boolean;
}

export interface AppState {
  // Room
  room: RoomState;
  // User tier
  tier: Tier;
  // Usage
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  videoMinutesUsed: number;
  videoMinutesLimit: number;
  recordingsUsed: number;
  recordingsLimit: number;
  // AI Panel
  aiPanelOpen: boolean;
  aiFeaturesEnabled: Record<string, boolean>;
  // Premium modals
  paywallOpen: boolean;
  paywallFeature: string | null;
}

interface AppActions {
  // Room actions
  setRoom: (room: Partial<RoomState>) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  setSubject: (subject: Subject) => void;
  setCurrentPage: (index: number) => void;
  setTotalPages: (count: number) => void;
  toggleFocusMode: () => void;
  setRecording: (recording: boolean) => void;
  // Branding
  setBranding: (branding: BrandingConfig) => void;
  // Tier & usage
  setTier: (tier: Tier) => void;
  setUsage: (usage: {
    aiCreditsUsed?: number;
    aiCreditsLimit?: number;
    videoMinutesUsed?: number;
    videoMinutesLimit?: number;
    recordingsUsed?: number;
    recordingsLimit?: number;
  }) => void;
  // AI
  toggleAIPanel: () => void;
  toggleAIFeature: (feature: string, enabled: boolean) => void;
  // Paywall
  openPaywall: (feature: string) => void;
  closePaywall: () => void;
}

const initialRoomState: RoomState = {
  roomId: null,
  subject: 'GENERAL',
  isActive: false,
  isTutor: false,
  userId: null,
  userName: null,
  userColor: '#3b82f6',
  participants: [],
  branding: {
    logoUrl: null,
    color: null,
    agencyName: null,
    customDomain: null,
  },
  currentPageIndex: 0,
  totalPages: 1,
  focusMode: false,
  isRecording: false,
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  // Initial state
  room: initialRoomState,
  tier: 'FREE',
  aiCreditsUsed: 0,
  aiCreditsLimit: 10,
  videoMinutesUsed: 0,
  videoMinutesLimit: 120,
  recordingsUsed: 0,
  recordingsLimit: 0,
  aiPanelOpen: false,
  aiFeaturesEnabled: {},
  paywallOpen: false,
  paywallFeature: null,

  // Room actions
  setRoom: (roomPatch) =>
    set((state) => ({
      room: { ...state.room, ...roomPatch },
    })),
  addParticipant: (participant) =>
    set((state) => ({
      room: {
        ...state.room,
        participants: [...state.room.participants, participant],
      },
    })),
  removeParticipant: (id) =>
    set((state) => ({
      room: {
        ...state.room,
        participants: state.room.participants.filter((p) => p.id !== id),
      },
    })),
  setSubject: (subject) =>
    set((state) => ({
      room: { ...state.room, subject },
    })),
  setCurrentPage: (index) =>
    set((state) => ({
      room: { ...state.room, currentPageIndex: index },
    })),
  setTotalPages: (count) =>
    set((state) => ({
      room: { ...state.room, totalPages: count },
    })),
  toggleFocusMode: () =>
    set((state) => ({
      room: { ...state.room, focusMode: !state.room.focusMode },
    })),
  setRecording: (recording) =>
    set((state) => ({
      room: { ...state.room, isRecording: recording },
    })),

  // Branding
  setBranding: (branding) =>
    set((state) => ({
      room: { ...state.room, branding },
    })),

  // Tier & usage
  setTier: (tier) => set({ tier }),
  setUsage: (usage) => set((state) => ({ ...state, ...usage })),

  // AI
  toggleAIPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
  toggleAIFeature: (feature, enabled) =>
    set((state) => ({
      aiFeaturesEnabled: { ...state.aiFeaturesEnabled, [feature]: enabled },
    })),

  // Paywall
  openPaywall: (feature) => set({ paywallOpen: true, paywallFeature: feature }),
  closePaywall: () => set({ paywallOpen: false, paywallFeature: null }),
}));
