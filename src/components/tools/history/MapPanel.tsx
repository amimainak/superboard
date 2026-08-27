'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, Globe, Plus, Tag, Eye, EyeOff, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface MapPanelProps {
  editor: unknown;
  onClose?: () => void;
}

interface Region {
  id: string;
  name: string;
  path: string;
  color: string;
  annotation: string;
}

const WORLD_REGIONS: Region[] = [
  { id: 'na', name: 'North America', path: 'M 80 60 Q 60 50 50 70 Q 30 80 40 100 Q 50 130 80 140 Q 100 150 120 140 Q 140 120 130 100 Q 120 80 100 70 Z', color: '#3b82f6', annotation: '' },
  { id: 'sa', name: 'South America', path: 'M 100 150 Q 90 160 85 180 Q 80 210 90 230 Q 100 260 110 270 Q 120 260 125 240 Q 130 210 120 180 Q 115 160 105 150 Z', color: '#22c55e', annotation: '' },
  { id: 'eu', name: 'Europe', path: 'M 210 60 Q 200 55 195 65 Q 190 75 200 85 Q 210 95 220 90 Q 230 85 225 75 Q 220 65 215 60 Z', color: '#a855f7', annotation: '' },
  { id: 'af', name: 'Africa', path: 'M 210 100 Q 200 95 195 110 Q 190 140 195 170 Q 200 200 210 215 Q 220 210 225 190 Q 230 160 225 130 Q 220 110 215 100 Z', color: '#f59e0b', annotation: '' },
  { id: 'as', name: 'Asia', path: 'M 230 50 Q 240 40 260 45 Q 290 50 310 60 Q 330 75 320 95 Q 310 110 290 115 Q 270 120 250 110 Q 235 100 230 80 Z', color: '#ef4444', annotation: '' },
  { id: 'oc', name: 'Oceania', path: 'M 310 190 Q 320 185 340 190 Q 360 200 355 215 Q 345 225 325 220 Q 310 210 310 200 Z', color: '#06b6d4', annotation: '' },
];

const US_REGIONS: Region[] = [
  { id: 'pacific', name: 'Pacific', path: 'M 40 40 Q 30 60 35 100 Q 40 130 55 140 Q 65 120 60 90 Q 55 60 50 45 Z', color: '#f59e0b', annotation: '' },
  { id: 'mountain', name: 'Mountain', path: 'M 60 40 Q 55 55 60 90 Q 65 120 80 130 Q 90 110 85 80 Q 80 55 70 42 Z', color: '#ef4444', annotation: '' },
  { id: 'midwest', name: 'Midwest', path: 'M 85 40 Q 80 55 85 80 Q 90 110 105 120 Q 115 100 110 70 Q 105 50 95 42 Z', color: '#3b82f6', annotation: '' },
  { id: 'southeast', name: 'Southeast', path: 'M 85 100 Q 80 120 85 150 Q 95 165 110 155 Q 120 140 115 115 Q 110 105 95 100 Z', color: '#22c55e', annotation: '' },
  { id: 'northeast', name: 'Northeast', path: 'M 110 40 Q 105 50 110 70 Q 115 85 130 80 Q 140 70 135 55 Q 130 45 120 40 Z', color: '#a855f7', annotation: '' },
];

const EUROPE_REGIONS: Region[] = [
  { id: 'scandinavia', name: 'Scandinavia', path: 'M 140 30 Q 135 50 140 70 Q 150 80 160 70 Q 165 50 155 35 Z', color: '#3b82f6', annotation: '' },
  { id: 'western', name: 'Western Europe', path: 'M 100 70 Q 95 90 100 110 Q 115 120 130 110 Q 135 90 130 75 Q 120 65 105 68 Z', color: '#22c55e', annotation: '' },
  { id: 'eastern', name: 'Eastern Europe', path: 'M 140 60 Q 135 80 140 100 Q 155 110 170 100 Q 175 80 165 65 Q 155 58 145 60 Z', color: '#f59e0b', annotation: '' },
  { id: 'southern', name: 'Southern Europe', path: 'M 110 110 Q 105 125 110 145 Q 125 155 140 145 Q 150 130 145 115 Q 135 105 120 108 Z', color: '#ef4444', annotation: '' },
];

const MAP_PRESETS = {
  world: { label: 'World', regions: WORLD_REGIONS, viewBox: '0 0 400 300' },
  us: { label: 'United States', regions: US_REGIONS, viewBox: '0 0 180 200' },
  europe: { label: 'Europe', regions: EUROPE_REGIONS, viewBox: '0 0 200 180' },
} as const;

type MapPreset = keyof typeof MAP_PRESETS;

export default function MapPanel({ editor, onClose }: MapPanelProps) {
  const [preset, setPreset] = useState<MapPreset>('world');
  const [showLabels, setShowLabels] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [regions, setRegions] = useState<Region[]>(MAP_PRESETS.world.regions);

  const handlePresetChange = useCallback((p: MapPreset) => {
    setPreset(p);
    setRegions(MAP_PRESETS[p].regions.map(r => ({ ...r })));
    setSelectedRegion(null);
    setAnnotationText('');
  }, []);

  const handleRegionClick = useCallback((regionId: string) => {
    setSelectedRegion(regionId);
    const region = regions.find(r => r.id === regionId);
    setAnnotationText(region?.annotation || '');
  }, [regions]);

  const handleAnnotationChange = useCallback((text: string) => {
    setAnnotationText(text);
    if (selectedRegion) {
      setRegions(prev => prev.map(r => r.id === selectedRegion ? { ...r, annotation: text } : r));
    }
  }, [selectedRegion]);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const map = MAP_PRESETS[preset];
    const scale = 3;
    const offsetX = center.x - 200;
    const offsetY = center.y - 150;
    const shapes: any[] = [];

    // Title
    shapes.push({
      id: `shape:map-title-${Date.now()}` as any,
      type: 'text' as const,
      x: offsetX,
      y: offsetY - 40,
      props: { text: `${map.label} Map`, size: 'l', font: 'sans' },
    });

    // Draw each region as a geo shape (simplified to rectangle with label)
    regions.forEach((region) => {
      shapes.push({
        id: `shape:map-${region.id}-${Date.now()}` as any,
        type: 'geo' as const,
        x: offsetX + 10,
        y: offsetY + 10,
        props: {
          geo: 'rectangle',
          w: 380,
          h: 280,
          color: region.color,
          fill: 'semi',
          opacity: selectedRegion === region.id ? 0.6 : 0.25,
        },
      });
    });

    // Region labels
    if (showLabels) {
      regions.forEach((region, i) => {
        shapes.push({
          id: `shape:map-label-${region.id}-${Date.now()}` as any,
          type: 'text' as const,
          x: offsetX + 50 + (i % 3) * 120,
          y: offsetY + 40 + Math.floor(i / 3) * 80,
          props: { text: region.name, size: 'm', font: 'sans' },
        });
      });
    }

    // Annotations
    regions.forEach((region, i) => {
      if (region.annotation) {
        shapes.push({
          id: `shape:map-ann-${region.id}-${Date.now()}` as any,
          type: 'text' as const,
          x: offsetX + 50 + (i % 3) * 120,
          y: offsetY + 60 + Math.floor(i / 3) * 80,
          props: { text: region.annotation, size: 's', font: 'sans', color: '#6b7280' },
        });
      }
    });

    ed.createShapes(shapes);
  }, [editor, preset, regions, showLabels, selectedRegion]);

  const addBlankMap = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const map = MAP_PRESETS[preset];
    const offsetX = center.x - 200;
    const offsetY = center.y - 150;
    const shapes: any[] = [];

    shapes.push({
      id: `shape:bmap-title-${Date.now()}` as any,
      type: 'text' as const,
      x: offsetX,
      y: offsetY - 40,
      props: { text: `Blank ${map.label} Map`, size: 'l', font: 'sans' },
    });

    // Outline rectangle
    shapes.push({
      id: `shape:bmap-outline-${Date.now()}` as any,
      type: 'geo' as const,
      x: offsetX,
      y: offsetY,
      props: { geo: 'rectangle', w: 400, h: 300, color: '#374151', fill: 'none', dash: 'draw' },
    });

    // Region boxes (blank)
    regions.forEach((region, i) => {
      shapes.push({
        id: `shape:bmap-region-${region.id}-${Date.now()}` as any,
        type: 'geo' as const,
        x: offsetX + 20 + (i % 3) * 130,
        y: offsetY + 20 + Math.floor(i / 3) * 100,
        props: { geo: 'rectangle', w: 120, h: 80, color: '#9ca3af', fill: 'none', dash: 'draw' },
      });
    });

    ed.createShapes(shapes);
  }, [editor, preset, regions]);

  const currentMap = MAP_PRESETS[preset];
  const selectedRegionData = regions.find(r => r.id === selectedRegion);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1001,
    width: 480,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  };

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-sky-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-sky-700 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Map Annotation Panel
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {(Object.keys(MAP_PRESETS) as MapPreset[]).map(p => (
              <Badge
                key={p}
                variant={preset === p ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => handlePresetChange(p)}
              >
                {MAP_PRESETS[p].label}
              </Badge>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <Switch checked={showLabels} onCheckedChange={setShowLabels} />
              <Label className="text-xs text-muted-foreground">Labels</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Map SVG */}
          <div className="rounded-lg border bg-gray-50 p-2 cursor-pointer">
            <svg viewBox={currentMap.viewBox} className="w-full h-auto">
              {regions.map(region => (
                <g key={region.id}>
                  <path
                    d={region.path}
                    fill={selectedRegion === region.id ? region.color : `${region.color}66`}
                    stroke={selectedRegion === region.id ? '#1e293b' : region.color}
                    strokeWidth={selectedRegion === region.id ? 2.5 : 1}
                    className="cursor-pointer transition-all"
                    onClick={() => handleRegionClick(region.id)}
                  />
                  {showLabels && (
                    <text
                      x={region.path.match(/M\s*([\d.]+)\s+([\d.]+)/)?.[1] || 0}
                      y={region.path.match(/M\s*([\d.]+)\s+([\d.]+)/)?.[2] || 0}
                      textAnchor="middle"
                      className="text-[8px] fill-gray-800 font-semibold pointer-events-none select-none"
                    >
                      {region.name}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* Selected region annotation */}
          {selectedRegionData && (
            <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: selectedRegionData.color }} />
                <span className="text-xs font-semibold">{selectedRegionData.name}</span>
                <PenLine className="w-3 h-3 ml-auto text-sky-600" />
              </div>
              <Textarea
                value={annotationText}
                onChange={e => handleAnnotationChange(e.target.value)}
                placeholder="Add annotation for this region..."
                className="min-h-[60px] text-xs"
              />
            </div>
          )}

          {/* Region legend */}
          <div className="flex flex-wrap gap-1.5">
            {regions.map(r => (
              <Badge
                key={r.id}
                variant={selectedRegion === r.id ? 'default' : 'outline'}
                className="text-[10px] cursor-pointer"
                style={selectedRegion === r.id ? { backgroundColor: r.color, borderColor: r.color } : {}}
                onClick={() => handleRegionClick(r.id)}
              >
                {r.name}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={addToBoard} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" /> Annotated Map
            </Button>
            <Button onClick={addBlankMap} variant="outline" className="flex-1 border-sky-300 text-sky-700">
              <Eye className="w-4 h-4 mr-1.5" /> Blank Map
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
