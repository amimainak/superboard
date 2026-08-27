// ============================================================
// BreakoutRoomManager — Multi-Room Split for Group Work
// ============================================================
// Tutors can split the class into groups, each getting their own
// whiteboard room. Tutor can peek into any group's board.
// This is a P3 feature — architectural wiring ready.
// ============================================================

'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Eye, X } from 'lucide-react';

interface BreakoutRoomManagerProps {
  roomId: string | null;
}

interface BreakoutGroup {
  id: string;
  name: string;
  roomId: string;
  participantIds: string[];
}

export default function BreakoutRoomManager({ roomId }: BreakoutRoomManagerProps) {
  const isTutor = useAppStore((s) => s.room.isTutor);
  const tier = useAppStore((s) => s.tier);
  const participants = useAppStore((s) => s.room.participants);
  const [groups, setGroups] = useState<BreakoutGroup[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [peekingRoom, setPeekingRoom] = useState<string | null>(null);

  const canUseBreakout = isTutor && tier === 'AGENCY' && participants.length >= 2;
  const groupCount = Math.max(2, Math.min(6, Math.ceil(participants.length / 2)));

  const createBreakoutGroups = useCallback(() => {
    if (!roomId) return;

    const newGroups: BreakoutGroup[] = [];
    for (let i = 0; i < groupCount; i++) {
      const start = Math.floor(i * participants.length / groupCount);
      const end = Math.floor((i + 1) * participants.length / groupCount);
      newGroups.push({
        id: `group-${i}`,
        name: `Group ${String.fromCharCode(65 + i)}`, // Group A, B, C...
        roomId: `breakout-${roomId}-${i}`,
        participantIds: participants.slice(start, end).map((p) => p.id),
      });
    }

    setGroups(newGroups);
    setIsActive(true);
    console.log(`[Breakout] Created ${newGroups.length} breakout groups`);
  }, [roomId, participants, groupCount]);

  const closeBreakout = useCallback(() => {
    setGroups([]);
    setIsActive(false);
    setPeekingRoom(null);
  }, []);

  if (!canUseBreakout) return null;

  return (
    <div className="breakout-manager">
      {isActive ? (
        <div
          style={{
            position: 'absolute',
            top: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'rgba(255,255,255,0.97)',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '12px 16px',
            minWidth: 300,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>Breakout Rooms</span>
            <button
              onClick={closeBreakout}
              style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer' }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {groups.map((group) => (
              <div
                key={group.id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 8px', borderRadius: 8,
                  background: peekingRoom === group.roomId ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.02)',
                  border: peekingRoom === group.roomId ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: 12, color: '#374151' }}>{group.name}</span>
                  <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>
                    {group.participantIds.length} students
                  </span>
                </div>
                <button
                  onClick={() => setPeekingRoom(peekingRoom === group.roomId ? null : group.roomId)}
                  style={{
                    padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(99,102,241,0.3)',
                    background: peekingRoom === group.roomId ? '#6366f1' : 'transparent',
                    color: peekingRoom === group.roomId ? 'white' : '#6366f1',
                    fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {peekingRoom === group.roomId ? 'Back' : 'Peek'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={createBreakoutGroups}
            >
              <Users className="w-3.5 h-3.5" />
              Breakout ({groupCount} groups)
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Split class into {groupCount} groups for collaborative work
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
