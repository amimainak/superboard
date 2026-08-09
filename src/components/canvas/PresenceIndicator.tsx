'use client';
import React, { useEffect, useState, useMemo } from 'react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AwarenessLike = any;
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AwarenessUser {
  id: string;
  name: string;
  color: string;
  role: 'tutor' | 'student';
}

interface AwarenessState {
  user?: AwarenessUser;
}

interface PresenceIndicatorProps {
  awareness: AwarenessLike | null;
}

const MAX_VISIBLE_AVATARS = 5;

/**
 * PresenceIndicator — shows a row of overlapping colored avatar circles
 * representing users currently connected to the whiteboard via Yjs awareness.
 */
export default function PresenceIndicator({
  awareness,
}: PresenceIndicatorProps) {
  const [states, setStates] = useState<Map<number, AwarenessState>>(new Map());

  // Sync awareness states into React state
  useEffect(() => {
    if (!awareness) return;

    // Read initial states (exclude local — rendered separately)
    const snapshot = new Map<number, AwarenessState>();
    awareness.getStates().forEach((state: unknown, clientID: number) => {
      if (clientID !== awareness.clientID) {
        snapshot.set(clientID, state as AwarenessState);
      }
    });
    setStates(snapshot);

    const onChange = () => {
      const next = new Map<number, AwarenessState>();
      awareness.getStates().forEach((state: unknown, clientID: number) => {
        if (clientID !== awareness.clientID) {
          next.set(clientID, state as AwarenessState);
        }
      });
      setStates(next);
    };

    awareness.on('change', onChange);
    return () => {
      awareness.off('change', onChange);
    };
  }, [awareness]);

  // Extract the local (current) user's info
  const localUser = useMemo<AwarenessUser | null>(() => {
    if (!awareness) return null;
    const local = awareness.getLocalState() as AwarenessState | undefined;
    return local?.user ?? null;
  }, [awareness]);

  // Derive a stable-ordered list of remote users
  const remoteUsers = useMemo(() => {
    const users: Array<{ clientID: number; user: AwarenessUser }> = [];
    states.forEach((state, clientID) => {
      if (state.user) {
        users.push({ clientID, user: state.user });
      }
    });
    // Sort by name for deterministic ordering
    users.sort((a, b) => a.user.name.localeCompare(b.user.name));
    return users;
  }, [states]);

  const visibleUsers = remoteUsers.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = remoteUsers.length - MAX_VISIBLE_AVATARS;

  // Re-read local user on awareness changes (name/color might update)
  const [currentLocalUser, setCurrentLocalUser] =
    useState<AwarenessUser | null>(localUser);

  useEffect(() => {
    setCurrentLocalUser(localUser);
  }, [localUser]);

  if (!awareness) return null;

  return (
    <div className="pointer-events-auto flex items-center">
      {/* Current user first, with a ring to distinguish */}
      {currentLocalUser && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm"
              style={{ backgroundColor: currentLocalUser.color }}
            >
              {/* Outer ring for the current user */}
              <span className="absolute inset-0 rounded-full ring-2 ring-foreground/30" />
              <span className="relative z-10">
                {currentLocalUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>
              {currentLocalUser.name}{' '}
              <span className="opacity-60">(you)</span>
            </span>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Remote users — stacked with slight overlap */}
      {visibleUsers.map(({ user }, i) => (
        <Tooltip key={user.id + i}>
          <TooltipTrigger asChild>
            <div
              className="relative flex h-7 w-7 shrink-0 -ml-1.5 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm"
              style={{
                backgroundColor: user.color,
              }}
            >
              <span>{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>{user.name}</span>
          </TooltipContent>
        </Tooltip>
      ))}

      {/* Overflow count badge */}
      {overflowCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white bg-muted text-[10px] font-semibold text-muted-foreground shadow-sm',
                '-ml-1.5'
              )}
            >
              +{overflowCount}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span>
              {remoteUsers
                .slice(MAX_VISIBLE_AVATARS)
                .map((u) => u.user.name)
                .join(', ')}
            </span>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}


