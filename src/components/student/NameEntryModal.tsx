'use client';

import { useState, type KeyboardEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/store/app-store';
import { User, Palette } from 'lucide-react';

const CURSOR_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#14b8a6', // teal
];

type Props = {
  open: boolean;
  onJoin: (name: string, color: string) => void;
  onOpenChange: (open: boolean) => void;
};

export default function NameEntryModal({ open, onJoin, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const storeColor = useAppStore((s) => s.room.userColor);
  const [selectedColor, setSelectedColor] = useState(storeColor);

  const canJoin = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canJoin) return;
    onJoin(name.trim(), selectedColor);
    setName('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && canJoin) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="size-5" />
            Enter your name
          </DialogTitle>
          <DialogDescription>
            Choose a display name and cursor color before joining the board. No account needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Name input */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="student-name">Your name</Label>
            <Input
              id="student-name"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              maxLength={32}
              className="h-11 text-base"
            />
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5">
              <Palette className="size-3.5" />
              Cursor color
            </Label>
            <div className="flex items-center gap-3">
              {CURSOR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select color ${color}`}
                  className={
                    'size-8 rounded-full border-2 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                  }
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? color : 'transparent',
                    boxShadow:
                      selectedColor === color ? `0 0 0 3px ${color}40` : 'none',
                  }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <svg
                      className="size-4 mx-auto text-white drop-shadow-sm"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!canJoin}
            className="w-full sm:w-auto"
            style={{
              backgroundColor: canJoin ? selectedColor : undefined,
            }}
          >
            Join Board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
