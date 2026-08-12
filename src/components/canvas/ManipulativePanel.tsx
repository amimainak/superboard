'use client';

import React, { useState, useMemo } from 'react';
import {
  Shapes,
  Search,
  Plus,
  LayoutGrid,
  Atom,
  BookOpen,
  Globe,
  Target,
  Music,
  Layers,
  CircleDot,
  Box,
  Minus,
  Crosshair,
  PieChart,
  RotateCw,
  TrendingUp,
  Triangle,
  BarChart3,
  Table2,
  Sun,
  RefreshCw,
  CloudRain,
  ArrowDown,
  Heart,
  Thermometer,
  CreditCard,
  Type,
  Map,
  Hash,
  Network,
  GitBranch,
  RefreshCcw,
  ArrowRight,
  LayoutList,
  Building,
  Repeat,
  XCircle,
  Timer,
  Hexagon,
  Puzzle,
  Loader,
  Square,
  Clock,
  BarChart,
  Zap,
  ArrowUp,
  Waves,
  Grid2x2,
  Grid3x3,
  Circle,
  AudioLines,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import type { FabricObject } from 'fabric';
import {
  MANIPULATIVE_REGISTRY,
  searchManipulatives,
  getCategoriesForSubject,
  getSubcategories,
  type ManipulativeEntry,
} from '@/lib/manipulative-registry';

// ---- Icon map ----
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutGrid,
  Atom,
  BookOpen,
  Globe,
  Target,
  Music,
  Layers,
  CircleDot,
  Box,
  Minus,
  Crosshair,
  PieChart,
  RotateCw,
  TrendingUp,
  Triangle,
  BarChart3,
  Table2,
  Sun,
  RefreshCw,
  CloudRain,
  ArrowDown,
  Heart,
  Thermometer,
  CreditCard,
  Type,
  Map,
  Hash,
  Network,
  GitBranch,
  RefreshCcw,
  ArrowRight,
  LayoutList,
  Building,
  Repeat,
  Timer,
  XCircle,
  Hexagon,
  Puzzle,
  Loader,
  Square,
  Clock,
  BarChart,
  Zap,
  ArrowUp,
  Waves,
  Grid2x2,
  Grid3x3,
  Circle,
  AudioLines,
  Shapes,
};

// Category display names
const CATEGORY_LABELS: Record<string, string> = {
  MATH: 'Math',
  SCIENCE: 'Science',
  LANGUAGE: 'Language',
  SOCIAL_STUDIES: 'Social Studies',
  TEST_PREP: 'Test Prep',
  MUSIC: 'Music',
  GENERAL: 'General',
};

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  MATH: 'bg-blue-100 text-blue-800',
  SCIENCE: 'bg-green-100 text-green-800',
  LANGUAGE: 'bg-amber-100 text-amber-800',
  SOCIAL_STUDIES: 'bg-purple-100 text-purple-800',
  TEST_PREP: 'bg-red-100 text-red-800',
  MUSIC: 'bg-pink-100 text-pink-800',
  GENERAL: 'bg-gray-100 text-gray-800',
};

interface ManipulativePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddManipulative: (objects: FabricObject[]) => void;
}

export default function ManipulativePanel({
  open,
  onOpenChange,
  onAddManipulative,
}: ManipulativePanelProps) {
  const subject = useAppStore((s) => s.room.subject);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine relevant categories based on current subject
  const relevantCategories = useMemo(
    () => getCategoriesForSubject(subject),
    [subject]
  );

  // All available categories in the registry
  const allCategories = useMemo(() => {
    const cats = new Set(MANIPULATIVE_REGISTRY.map((m) => m.category));
    return Array.from(cats);
  }, []);

  // Search results
  const searchResults = useMemo(
    () => searchManipulatives(searchQuery),
    [searchQuery]
  );

  // Get manipulatives for a category, filtered by search
  const getFilteredByCategory = (category: string): ManipulativeEntry[] => {
    if (searchQuery.trim()) {
      return searchResults.filter((m) => m.category === category);
    }
    return MANIPULATIVE_REGISTRY.filter((m) => m.category === category);
  };

  const handleAdd = (entry: ManipulativeEntry) => {
    // Dynamically import renderManipulative to avoid circular deps at build
    import('@/lib/manipulative-renderer').then(({ renderManipulative }) => {
      const objects = renderManipulative({ type: entry.id, params: {} });
      onAddManipulative(objects);
      onOpenChange(false);
    });
  };

  // Build tab list: relevant categories first, then 'all'
  const tabs = useMemo(() => {
    const uniqueRelevant = relevantCategories.filter(
      (c, i, arr) => arr.indexOf(c) === i
    );
    return [
      ...uniqueRelevant,
      ...allCategories.filter((c) => !uniqueRelevant.includes(c)),
    ];
  }, [relevantCategories, allCategories]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] p-0 flex flex-col"
      >
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <Shapes className="w-5 h-5" />
            Manipulatives
          </SheetTitle>
          <SheetDescription>
            Add interactive teaching tools to the canvas
          </SheetDescription>
        </SheetHeader>

        {/* Search bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search manipulatives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Separator />

        {/* Subject Tabs */}
        <Tabs defaultValue={relevantCategories[0] || 'ALL'} className="flex-1 flex flex-col min-h-0">
          <div className="px-4 pt-2">
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
              <TabsTrigger
                value="ALL"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-xs rounded-full border border-border"
              >
                All
              </TabsTrigger>
              {tabs.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 text-xs rounded-full border border-border"
                >
                  {CATEGORY_LABELS[cat] || cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-4 pt-3 pb-4">
            {/* All tab */}
            <TabsContent value="ALL" className="mt-0 space-y-4">
              {searchQuery.trim() ? (
                <ManipulativeGrid
                  items={searchResults}
                  onAdd={handleAdd}
                />
              ) : (
                allCategories.map((cat) => (
                  <CategorySection
                    key={cat}
                    category={cat}
                    items={getFilteredByCategory(cat)}
                    onAdd={handleAdd}
                  />
                ))
              )}
            </TabsContent>

            {/* Per-category tabs */}
            {tabs.map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-0">
                <ManipulativeGrid
                  items={getFilteredByCategory(cat)}
                  onAdd={handleAdd}
                />
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ---- Sub-components ----

function CategorySection({
  category,
  items,
  onAdd,
}: {
  category: string;
  items: ManipulativeEntry[];
  onAdd: (entry: ManipulativeEntry) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Badge
          variant="secondary"
          className={CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800'}
        >
          {CATEGORY_LABELS[category] || category}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>
      <ManipulativeGrid items={items} onAdd={onAdd} />
    </div>
  );
}

function ManipulativeGrid({
  items,
  onAdd,
}: {
  items: ManipulativeEntry[];
  onAdd: (entry: ManipulativeEntry) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No manipulatives found.
      </div>
    );
  }

  // Group by subcategory
  const grouped = items.reduce<Record<string, ManipulativeEntry[]>>(
    (acc, item) => {
      if (!acc[item.subcategory]) acc[item.subcategory] = [];
      acc[item.subcategory].push(item);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([subcategory, subItems]) => (
        <div key={subcategory}>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {subcategory}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {subItems.map((item) => (
              <ManipulativeCard key={item.id} item={item} onAdd={onAdd} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ManipulativeCard({
  item,
  onAdd,
}: {
  item: ManipulativeEntry;
  onAdd: (entry: ManipulativeEntry) => void;
}) {
  const IconComp = ICON_MAP[item.icon] || Shapes;

  return (
    <div className="group relative border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => onAdd(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onAdd(item); }}
      aria-label={`Add ${item.name} to canvas`}
    >
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <IconComp className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight truncate">
            {item.name}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-1">
          {item.gradeBands.map((gb) => (
            <Badge key={gb} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {gb}
            </Badge>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(item);
          }}
          aria-label={`Add ${item.name}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
