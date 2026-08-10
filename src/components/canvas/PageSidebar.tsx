// ============================================================
// PageSidebar — Multi-page Navigation (Tutor Only)
// ============================================================
// Shows page thumbnails/numbers. Students CANNOT change pages.
// ============================================================

'use client';

import React from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface PageSidebarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (index: number) => void;
  onAddPage: () => void;
  onDeletePage: (index: number) => void;
}

export default function PageSidebar({
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
  onDeletePage,
}: PageSidebarProps) {
  const isTutor = useAppStore((s) => s.room.isTutor);

  if (!isTutor) {
    // Students don't see the page sidebar
    return null;
  }

  return (
    <div className="flex flex-col items-center w-16 bg-card border-r py-2 gap-2">
      <div className="text-xs font-semibold text-muted-foreground">
        Pages
      </div>

      <ScrollArea className="flex-1 w-full px-1">
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <Button
                variant={currentPage === i ? 'default' : 'outline'}
                size="sm"
                className="w-12 h-16 text-xs"
                onClick={() => onPageChange(i)}
              >
                {i + 1}
              </Button>
              {totalPages > 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6"
                        onClick={() => onDeletePage(i)}
                        disabled={i === currentPage || totalPages <= 1}
                      >
                        <Trash2 className={`w-3 h-3 ${i === currentPage ? 'text-muted-foreground' : 'text-destructive'}`} />
                      </Button>
                    </TooltipTrigger>
                    {i === currentPage && (
                      <TooltipContent side="right" className="text-xs">
                        Cannot delete the current page
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <Separator />
      <Button
        variant="outline"
        size="icon"
        className="w-10 h-10"
        onClick={onAddPage}
        title="Add new page"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
