'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, Atom, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PeriodicTablePanelProps {
  editor: unknown;
  onClose?: () => void;
}

interface Element {
  atomicNumber: number;
  symbol: string;
  name: string;
  mass: number;
  category: string;
  row: number;
  col: number;
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  'alkali-metal':     { label: 'Alkali Metal', color: '#ef4444' },
  'alkaline-earth':   { label: 'Alkaline Earth', color: '#f59e0b' },
  'transition':       { label: 'Transition Metal', color: '#fbbf24' },
  'post-transition':  { label: 'Post-Transition', color: '#22c55e' },
  'metalloid':        { label: 'Metalloid', color: '#14b8a6' },
  'nonmetal':         { label: 'Nonmetal', color: '#3b82f6' },
  'halogen':          { label: 'Halogen', color: '#8b5cf6' },
  'noble-gas':        { label: 'Noble Gas', color: '#ec4899' },
  'lanthanide':       { label: 'Lanthanide', color: '#06b6d4' },
  'actinide':         { label: 'Actinide', color: '#f97316' },
};

const ELEMENTS: Element[] = [
  { atomicNumber: 1, symbol: 'H', name: 'Hydrogen', mass: 1.008, category: 'nonmetal', row: 1, col: 1 },
  { atomicNumber: 2, symbol: 'He', name: 'Helium', mass: 4.003, category: 'noble-gas', row: 1, col: 18 },
  { atomicNumber: 3, symbol: 'Li', name: 'Lithium', mass: 6.941, category: 'alkali-metal', row: 2, col: 1 },
  { atomicNumber: 4, symbol: 'Be', name: 'Beryllium', mass: 9.012, category: 'alkaline-earth', row: 2, col: 2 },
  { atomicNumber: 5, symbol: 'B', name: 'Boron', mass: 10.81, category: 'metalloid', row: 2, col: 13 },
  { atomicNumber: 6, symbol: 'C', name: 'Carbon', mass: 12.011, category: 'nonmetal', row: 2, col: 14 },
  { atomicNumber: 7, symbol: 'N', name: 'Nitrogen', mass: 14.007, category: 'nonmetal', row: 2, col: 15 },
  { atomicNumber: 8, symbol: 'O', name: 'Oxygen', mass: 15.999, category: 'nonmetal', row: 2, col: 16 },
  { atomicNumber: 9, symbol: 'F', name: 'Fluorine', mass: 18.998, category: 'halogen', row: 2, col: 17 },
  { atomicNumber: 10, symbol: 'Ne', name: 'Neon', mass: 20.18, category: 'noble-gas', row: 2, col: 18 },
  { atomicNumber: 11, symbol: 'Na', name: 'Sodium', mass: 22.99, category: 'alkali-metal', row: 3, col: 1 },
  { atomicNumber: 12, symbol: 'Mg', name: 'Magnesium', mass: 24.305, category: 'alkaline-earth', row: 3, col: 2 },
  { atomicNumber: 13, symbol: 'Al', name: 'Aluminum', mass: 26.982, category: 'post-transition', row: 3, col: 13 },
  { atomicNumber: 14, symbol: 'Si', name: 'Silicon', mass: 28.086, category: 'metalloid', row: 3, col: 14 },
  { atomicNumber: 15, symbol: 'P', name: 'Phosphorus', mass: 30.974, category: 'nonmetal', row: 3, col: 15 },
  { atomicNumber: 16, symbol: 'S', name: 'Sulfur', mass: 32.06, category: 'nonmetal', row: 3, col: 16 },
  { atomicNumber: 17, symbol: 'Cl', name: 'Chlorine', mass: 35.45, category: 'halogen', row: 3, col: 17 },
  { atomicNumber: 18, symbol: 'Ar', name: 'Argon', mass: 39.948, category: 'noble-gas', row: 3, col: 18 },
  { atomicNumber: 19, symbol: 'K', name: 'Potassium', mass: 39.098, category: 'alkali-metal', row: 4, col: 1 },
  { atomicNumber: 20, symbol: 'Ca', name: 'Calcium', mass: 40.078, category: 'alkaline-earth', row: 4, col: 2 },
  { atomicNumber: 21, symbol: 'Sc', name: 'Scandium', mass: 44.956, category: 'transition', row: 4, col: 3 },
  { atomicNumber: 22, symbol: 'Ti', name: 'Titanium', mass: 47.867, category: 'transition', row: 4, col: 4 },
  { atomicNumber: 23, symbol: 'V', name: 'Vanadium', mass: 50.942, category: 'transition', row: 4, col: 5 },
  { atomicNumber: 24, symbol: 'Cr', name: 'Chromium', mass: 51.996, category: 'transition', row: 4, col: 6 },
  { atomicNumber: 25, symbol: 'Mn', name: 'Manganese', mass: 54.938, category: 'transition', row: 4, col: 7 },
  { atomicNumber: 26, symbol: 'Fe', name: 'Iron', mass: 55.845, category: 'transition', row: 4, col: 8 },
  { atomicNumber: 27, symbol: 'Co', name: 'Cobalt', mass: 58.933, category: 'transition', row: 4, col: 9 },
  { atomicNumber: 28, symbol: 'Ni', name: 'Nickel', mass: 58.693, category: 'transition', row: 4, col: 10 },
  { atomicNumber: 29, symbol: 'Cu', name: 'Copper', mass: 63.546, category: 'transition', row: 4, col: 11 },
  { atomicNumber: 30, symbol: 'Zn', name: 'Zinc', mass: 65.38, category: 'transition', row: 4, col: 12 },
  { atomicNumber: 31, symbol: 'Ga', name: 'Gallium', mass: 69.723, category: 'post-transition', row: 4, col: 13 },
  { atomicNumber: 32, symbol: 'Ge', name: 'Germanium', mass: 72.63, category: 'metalloid', row: 4, col: 14 },
  { atomicNumber: 33, symbol: 'As', name: 'Arsenic', mass: 74.922, category: 'metalloid', row: 4, col: 15 },
  { atomicNumber: 34, symbol: 'Se', name: 'Selenium', mass: 78.971, category: 'nonmetal', row: 4, col: 16 },
  { atomicNumber: 35, symbol: 'Br', name: 'Bromine', mass: 79.904, category: 'halogen', row: 4, col: 17 },
  { atomicNumber: 36, symbol: 'Kr', name: 'Krypton', mass: 83.798, category: 'noble-gas', row: 4, col: 18 },
  { atomicNumber: 37, symbol: 'Rb', name: 'Rubidium', mass: 85.468, category: 'alkali-metal', row: 5, col: 1 },
  { atomicNumber: 38, symbol: 'Sr', name: 'Strontium', mass: 87.62, category: 'alkaline-earth', row: 5, col: 2 },
  { atomicNumber: 39, symbol: 'Y', name: 'Yttrium', mass: 88.906, category: 'transition', row: 5, col: 3 },
  { atomicNumber: 40, symbol: 'Zr', name: 'Zirconium', mass: 91.224, category: 'transition', row: 5, col: 4 },
  { atomicNumber: 41, symbol: 'Nb', name: 'Niobium', mass: 92.906, category: 'transition', row: 5, col: 5 },
  { atomicNumber: 42, symbol: 'Mo', name: 'Molybdenum', mass: 95.95, category: 'transition', row: 5, col: 6 },
  { atomicNumber: 43, symbol: 'Tc', name: 'Technetium', mass: 98, category: 'transition', row: 5, col: 7 },
  { atomicNumber: 44, symbol: 'Ru', name: 'Ruthenium', mass: 101.07, category: 'transition', row: 5, col: 8 },
  { atomicNumber: 45, symbol: 'Rh', name: 'Rhodium', mass: 102.906, category: 'transition', row: 5, col: 9 },
  { atomicNumber: 46, symbol: 'Pd', name: 'Palladium', mass: 106.42, category: 'transition', row: 5, col: 10 },
  { atomicNumber: 47, symbol: 'Ag', name: 'Silver', mass: 107.868, category: 'transition', row: 5, col: 11 },
  { atomicNumber: 48, symbol: 'Cd', name: 'Cadmium', mass: 112.414, category: 'transition', row: 5, col: 12 },
  { atomicNumber: 49, symbol: 'In', name: 'Indium', mass: 114.818, category: 'post-transition', row: 5, col: 13 },
  { atomicNumber: 50, symbol: 'Sn', name: 'Tin', mass: 118.71, category: 'post-transition', row: 5, col: 14 },
  { atomicNumber: 51, symbol: 'Sb', name: 'Antimony', mass: 121.76, category: 'metalloid', row: 5, col: 15 },
  { atomicNumber: 52, symbol: 'Te', name: 'Tellurium', mass: 127.6, category: 'metalloid', row: 5, col: 16 },
  { atomicNumber: 53, symbol: 'I', name: 'Iodine', mass: 126.904, category: 'halogen', row: 5, col: 17 },
  { atomicNumber: 54, symbol: 'Xe', name: 'Xenon', mass: 131.293, category: 'noble-gas', row: 5, col: 18 },
  { atomicNumber: 55, symbol: 'Cs', name: 'Cesium', mass: 132.905, category: 'alkali-metal', row: 6, col: 1 },
  { atomicNumber: 56, symbol: 'Ba', name: 'Barium', mass: 137.327, category: 'alkaline-earth', row: 6, col: 2 },
  { atomicNumber: 57, symbol: 'La', name: 'Lanthanum', mass: 138.905, category: 'lanthanide', row: 9, col: 3 },
  { atomicNumber: 58, symbol: 'Ce', name: 'Cerium', mass: 140.116, category: 'lanthanide', row: 9, col: 4 },
  { atomicNumber: 59, symbol: 'Pr', name: 'Praseodymium', mass: 140.908, category: 'lanthanide', row: 9, col: 5 },
  { atomicNumber: 60, symbol: 'Nd', name: 'Neodymium', mass: 144.242, category: 'lanthanide', row: 9, col: 6 },
  { atomicNumber: 72, symbol: 'Hf', name: 'Hafnium', mass: 178.49, category: 'transition', row: 6, col: 4 },
  { atomicNumber: 73, symbol: 'Ta', name: 'Tantalum', mass: 180.948, category: 'transition', row: 6, col: 5 },
  { atomicNumber: 74, symbol: 'W', name: 'Tungsten', mass: 183.84, category: 'transition', row: 6, col: 6 },
  { atomicNumber: 75, symbol: 'Re', name: 'Rhenium', mass: 186.207, category: 'transition', row: 6, col: 7 },
  { atomicNumber: 76, symbol: 'Os', name: 'Osmium', mass: 190.23, category: 'transition', row: 6, col: 8 },
  { atomicNumber: 77, symbol: 'Ir', name: 'Iridium', mass: 192.217, category: 'transition', row: 6, col: 9 },
  { atomicNumber: 78, symbol: 'Pt', name: 'Platinum', mass: 195.084, category: 'transition', row: 6, col: 10 },
  { atomicNumber: 79, symbol: 'Au', name: 'Gold', mass: 196.967, category: 'transition', row: 6, col: 11 },
  { atomicNumber: 80, symbol: 'Hg', name: 'Mercury', mass: 200.592, category: 'transition', row: 6, col: 12 },
  { atomicNumber: 81, symbol: 'Tl', name: 'Thallium', mass: 204.38, category: 'post-transition', row: 6, col: 13 },
  { atomicNumber: 82, symbol: 'Pb', name: 'Lead', mass: 207.2, category: 'post-transition', row: 6, col: 14 },
  { atomicNumber: 83, symbol: 'Bi', name: 'Bismuth', mass: 208.98, category: 'post-transition', row: 6, col: 15 },
  { atomicNumber: 84, symbol: 'Po', name: 'Polonium', mass: 209, category: 'post-transition', row: 6, col: 16 },
  { atomicNumber: 85, symbol: 'At', name: 'Astatine', mass: 210, category: 'halogen', row: 6, col: 17 },
  { atomicNumber: 86, symbol: 'Rn', name: 'Radon', mass: 222, category: 'noble-gas', row: 6, col: 18 },
];

export default function PeriodicTablePanel({ editor, onClose }: PeriodicTablePanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredElements = useMemo(() => {
    let result = ELEMENTS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e => e.name.toLowerCase().includes(q) || e.symbol.toLowerCase().includes(q) || String(e.atomicNumber).includes(q)
      );
    }
    if (selectedCategory) {
      result = result.filter(e => e.category === selectedCategory);
    }
    return result;
  }, [searchQuery, selectedCategory]);

  const insertToBoard = useCallback((element: Element) => {
    const ed = editor as Editor | null;
    if (!ed) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const catConfig = CATEGORIES[element.category];
    const boxW = 100;
    const boxH = 80;
    const shapes: any[] = [];

    // Element box
    shapes.push({
      id: `shape:pt-box-${element.symbol}-${Date.now()}` as any,
      type: 'geo' as const,
      x: center.x - boxW / 2,
      y: center.y - boxH / 2,
      props: { geo: 'rounded-rectangle', w: boxW, h: boxH, color: catConfig?.color || '#374151', fill: 'semi' },
    });

    // Atomic number
    shapes.push({
      id: `shape:pt-num-${element.symbol}-${Date.now()}` as any,
      type: 'text' as const,
      x: center.x - boxW / 2 + 6,
      y: center.y - boxH / 2 + 4,
      props: { text: String(element.atomicNumber), size: 's', font: 'sans' },
    });

    // Symbol
    shapes.push({
      id: `shape:pt-sym-${element.symbol}-${Date.now()}` as any,
      type: 'text' as const,
      x: center.x - 15,
      y: center.y - 14,
      props: { text: element.symbol, size: 'xl', font: 'sans' },
    });

    // Name
    shapes.push({
      id: `shape:pt-name-${element.symbol}-${Date.now()}` as any,
      type: 'text' as const,
      x: center.x - boxW / 2 + 6,
      y: center.y + 14,
      props: { text: element.name, size: 's', font: 'sans' },
    });

    // Mass
    shapes.push({
      id: `shape:pt-mass-${element.symbol}-${Date.now()}` as any,
      type: 'text' as const,
      x: center.x - boxW / 2 + 6,
      y: center.y + 28,
      props: { text: element.mass.toFixed(3), size: 's', font: 'mono', color: '#6b7280' },
    });

    ed.createShapes(shapes);
  }, [editor]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1001,
    width: 560,
    maxHeight: 'calc(100vh - 60px)',
    overflowY: 'auto',
  };

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-cyan-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-cyan-700 flex items-center gap-2">
              <Atom className="w-4 h-4" />
              Periodic Table
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative mt-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search element or symbol..."
              className="h-8 text-xs pl-7"
            />
          </div>
          {/* Category filter */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            <Badge
              variant={!selectedCategory ? 'default' : 'outline'}
              className="cursor-pointer text-[9px]"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <Badge
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                className="cursor-pointer text-[9px]"
                style={selectedCategory === key ? { backgroundColor: cat.color, borderColor: cat.color } : { borderColor: cat.color, color: cat.color }}
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {/* Periodic table grid */}
          <div className="relative" style={{ width: '100%', height: 320 }}>
            <svg viewBox="0 0 540 320" className="w-full h-full">
              {filteredElements.map(el => {
                const catConfig = CATEGORIES[el.category];
                const x = (el.col - 1) * 29 + 5;
                const y = (el.row <= 6 ? el.row : el.row === 9 ? 8.5 : 9.5) * 32 + 5;
                const isSelected = selectedElement?.atomicNumber === el.atomicNumber;
                return (
                  <g
                    key={el.atomicNumber}
                    onClick={() => setSelectedElement(el)}
                    onDoubleClick={() => insertToBoard(el)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x} y={y} width={27} height={30} rx={2}
                      fill={isSelected ? catConfig.color : `${catConfig.color}33`}
                      stroke={catConfig.color}
                      strokeWidth={isSelected ? 2 : 0.5}
                    />
                    <text x={x + 13.5} y={y + 10} textAnchor="middle" className="text-[6px] fill-gray-600">{el.atomicNumber}</text>
                    <text x={x + 13.5} y={y + 21} textAnchor="middle" className="text-[8px] fill-gray-800 font-bold">{el.symbol}</text>
                    <text x={x + 13.5} y={y + 28} textAnchor="middle" className="text-[5px] fill-gray-500">{el.name.slice(0, 3)}</text>
                  </g>
                );
              })}
              {/* Lanthanide/Actinide labels */}
              <text x={95} y={282} textAnchor="middle" className="text-[6px] fill-cyan-600">Lanthanides</text>
              <text x={95} y={318} textAnchor="middle" className="text-[6px] fill-orange-600">Actinides</text>
            </svg>
          </div>

          {/* Selected element detail */}
          {selectedElement && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border bg-gray-50 p-3">
              <div
                className="w-16 h-16 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${CATEGORIES[selectedElement.category].color}22`, border: `2px solid ${CATEGORIES[selectedElement.category].color}` }}
              >
                <span className="text-[10px] text-gray-500">{selectedElement.atomicNumber}</span>
                <span className="text-lg font-bold" style={{ color: CATEGORIES[selectedElement.category].color }}>{selectedElement.symbol}</span>
                <span className="text-[8px] text-gray-500">{selectedElement.mass.toFixed(2)}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{selectedElement.name}</div>
                <Badge variant="outline" className="text-[9px] mt-1" style={{ borderColor: CATEGORIES[selectedElement.category].color, color: CATEGORIES[selectedElement.category].color }}>
                  {CATEGORIES[selectedElement.category].label}
                </Badge>
                <div className="text-[10px] text-gray-500 mt-1">Double-click element to insert</div>
              </div>
              <Button onClick={() => insertToBoard(selectedElement)} size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Insert
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
