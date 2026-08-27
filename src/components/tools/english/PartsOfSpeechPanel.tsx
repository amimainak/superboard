'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, Highlighter, Plus, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface PartsOfSpeechPanelProps {
  editor: unknown;
  onClose?: () => void;
}

type POS = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'interjection' | 'article' | 'unknown';

interface TaggedWord {
  word: string;
  pos: POS;
}

const POS_CONFIG: Record<POS, { label: string; color: string; bg: string; examples: string[] }> = {
  noun:          { label: 'Noun', color: '#dc2626', bg: '#fee2e2', examples: ['dog', 'cat', 'house', 'John', 'city', 'time', 'water', 'school', 'love', 'book'] },
  verb:          { label: 'Verb', color: '#2563eb', bg: '#dbeafe', examples: ['run', 'eat', 'is', 'was', 'have', 'go', 'make', 'know', 'think', 'take'] },
  adjective:     { label: 'Adjective', color: '#059669', bg: '#d1fae5', examples: ['big', 'small', 'happy', 'red', 'fast', 'good', 'beautiful', 'new', 'old', 'long'] },
  adverb:        { label: 'Adverb', color: '#7c3aed', bg: '#ede9fe', examples: ['quickly', 'very', 'well', 'often', 'always', 'never', 'too', 'also', 'just', 'really'] },
  preposition:   { label: 'Prep', color: '#d97706', bg: '#fef3c7', examples: ['in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'under'] },
  conjunction:   { label: 'Conj', color: '#0891b2', bg: '#cffafe', examples: ['and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'because', 'although', 'if'] },
  pronoun:       { label: 'Pronoun', color: '#be185d', bg: '#fce7f3', examples: ['he', 'she', 'it', 'they', 'we', 'you', 'I', 'me', 'him', 'her'] },
  interjection:  { label: 'Interj', color: '#ea580c', bg: '#ffedd5', examples: ['oh', 'wow', 'hey', 'yes', 'no', 'please', 'thanks', 'oops', 'yay', 'ah'] },
  article:       { label: 'Article', color: '#4b5563', bg: '#f3f4f6', examples: ['the', 'a', 'an'] },
  unknown:       { label: 'Unknown', color: '#9ca3af', bg: '#f9fafb', examples: [] },
};

const ARTICLES = new Set(['the', 'a', 'an']);
const PRONOUNS = new Set(['i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves', 'they', 'them', 'their', 'theirs', 'themselves', 'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what']);
const PREPOSITIONS = new Set(['in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'under', 'over', 'between', 'through', 'during', 'before', 'after', 'above', 'below', 'of', 'into', 'upon', 'without', 'within', 'along', 'across', 'behind', 'beyond', 'beside', 'among', 'toward', 'towards', 'against', 'throughout', 'during', 'since', 'until', 'around']);
const CONJUNCTIONS = new Set(['and', 'but', 'or', 'nor', 'for', 'yet', 'so', 'because', 'although', 'if', 'when', 'while', 'where', 'that', 'than', 'whether', 'unless', 'since', 'until', 'before', 'after']);
const INTERJECTIONS = new Set(['oh', 'wow', 'hey', 'yes', 'no', 'please', 'thanks', 'oops', 'yay', 'ah', 'ouch', 'well', 'hi', 'hello', 'goodbye', 'alas']);
const ADVERBS = new Set(['quickly', 'very', 'well', 'often', 'always', 'never', 'too', 'also', 'just', 'really', 'not', 'now', 'then', 'here', 'there', 'only', 'again', 'already', 'even', 'still', 'soon', 'ever', 'once', 'perhaps', 'quite', 'almost', 'enough', 'especially', 'extremely']);
const COMMON_VERBS = new Set(['is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'go', 'went', 'gone', 'come', 'came', 'run', 'ran', 'eat', 'ate', 'eaten', 'make', 'made', 'take', 'took', 'taken', 'see', 'saw', 'seen', 'know', 'knew', 'known', 'think', 'thought', 'say', 'said', 'tell', 'told', 'give', 'gave', 'given', 'find', 'found', 'get', 'got', 'put', 'keep', 'kept', 'let', 'seem', 'show', 'showed', 'begin', 'began', 'write', 'wrote', 'written', 'read', 'bring', 'brought', 'set', 'sit', 'sat', 'stand', 'stood', 'hear', 'heard', 'play', 'work', 'live', 'call', 'try', 'ask', 'need', 'feel', 'become', 'leave', 'mean', 'move', 'like', 'happen', 'turn', 'start', 'help', 'show', 'walk', 'open', 'close', 'use', 'change', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow', 'learn', 'love', 'want', 'look', 'remember', 'believe', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'watch', 'follow', 'stop']);
const COMMON_ADJECTIVES = new Set(['good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able', 'free', 'sure', 'real', 'full', 'special', 'easy', 'clear', 'recent', 'certain', 'personal', 'open', 'red', 'difficult', 'available', 'likely', 'short', 'single', 'medical', 'current', 'wrong', 'private', 'past', 'foreign', 'fine', 'common', 'poor', 'natural', 'significant', 'similar', 'hot', 'dead', 'central', 'happy', 'serious', 'ready', 'simple', 'left', 'physical', 'general', 'environmental', 'financial', 'blue', 'democratic', 'dark', 'various', 'entire', 'close', 'legal', 'religious', 'cold', 'final', 'main', 'green', 'nice', 'huge', 'popular', 'traditional', 'cultural']);

function tagWord(word: string): POS {
  const lower = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!lower) return 'unknown';

  if (ARTICLES.has(lower)) return 'article';
  if (PRONOUNS.has(lower)) return 'pronoun';
  if (PREPOSITIONS.has(lower)) return 'preposition';
  if (CONJUNCTIONS.has(lower)) return 'conjunction';
  if (INTERJECTIONS.has(lower)) return 'interjection';
  if (ADVERBS.has(lower)) return 'adverb';
  if (COMMON_VERBS.has(lower)) return 'verb';
  if (COMMON_ADJECTIVES.has(lower)) return 'adjective';

  // Heuristic: -ly → adverb, -tion/-ment/-ness → noun
  if (lower.endsWith('ly')) return 'adverb';
  if (lower.endsWith('tion') || lower.endsWith('sion') || lower.endsWith('ment') || lower.endsWith('ness') || lower.endsWith('ity')) return 'noun';
  if (lower.endsWith('ful') || lower.endsWith('ous') || lower.endsWith('ive') || lower.endsWith('able') || lower.endsWith('ible') || lower.endsWith('al') || lower.endsWith('ical') || lower.endsWith('ish')) return 'adjective';
  if (lower.endsWith('ed') || lower.endsWith('ing') || lower.endsWith('en') || lower.endsWith('ize') || lower.endsWith('ify')) return 'verb';

  return 'noun'; // Default guess
}

function parseAndTag(text: string): TaggedWord[] {
  const rawWords = text.split(/(\s+|[.,!?;:"'()\[\]{}])/);
  return rawWords
    .map(raw => {
      const cleaned = raw.replace(/[^a-zA-Z'-]/g, '');
      if (!cleaned) return null;
      return { word: raw, pos: tagWord(cleaned) };
    })
    .filter((w): w is TaggedWord => w !== null);
}

export default function PartsOfSpeechPanel({ editor, onClose }: PartsOfSpeechPanelProps) {
  const [text, setText] = useState('');
  const [tagged, setTagged] = useState<TaggedWord[]>([]);

  const analyzeText = useCallback(() => {
    if (!text.trim()) return;
    setTagged(parseAndTag(text));
  }, [text]);

  const taggedOutput = useMemo(() => {
    return tagged.map((tw, i) => {
      const config = POS_CONFIG[tw.pos];
      return (
        <span
          key={i}
          className="inline-block mx-0.5 px-1.5 py-0.5 rounded text-xs font-medium transition-all cursor-default"
          style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.color}44` }}
          title={`${config.label}: ${tw.word}`}
        >
          {tw.word}
        </span>
      );
    });
  }, [tagged]);

  const posCounts = useMemo(() => {
    const counts: Partial<Record<POS, number>> = {};
    tagged.forEach(tw => { counts[tw.pos] = (counts[tw.pos] || 0) + 1; });
    return counts;
  }, [tagged]);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed || tagged.length === 0) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 200;
    const startY = center.y - 40;
    const shapes: any[] = [];

    shapes.push({
      id: `shape:pos-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 30,
      props: { text: 'Parts of Speech Analysis', size: 'l', font: 'sans' },
    });

    // Render each word with color
    let currentText = '';
    let currentColor = '#374151';
    let x = startX;
    let lineY = startY;
    const maxW = 400;

    tagged.forEach((tw, i) => {
      const config = POS_CONFIG[tw.pos];
      const nextX = x + tw.word.length * 8;
      if (nextX > startX + maxW) {
        if (currentText) {
          shapes.push({
            id: `shape:pos-text-${i}-${Date.now()}` as any,
            type: 'text' as const,
            x,
            y: lineY,
            props: { text: currentText.trim(), size: 'm', font: 'sans', color: currentColor },
          });
        }
        currentText = '';
        x = startX;
        lineY += 24;
      }

      if (currentColor !== config.color) {
        if (currentText) {
          shapes.push({
            id: `shape:pos-word-${i}-${Date.now()}` as any,
            type: 'text' as const,
            x,
            y: lineY,
            props: { text: currentText, size: 'm', font: 'sans', color: currentColor },
          });
          x += currentText.length * 8;
          currentText = '';
        }
        currentColor = config.color;
      }

      currentText += tw.word + ' ';
    });

    if (currentText) {
      shapes.push({
        id: `shape:pos-final-${Date.now()}` as any,
        type: 'text' as const,
        x,
        y: lineY,
        props: { text: currentText.trim(), size: 'm', font: 'sans', color: currentColor },
      });
    }

    // Legend
    const legendY = lineY + 40;
    const usedPOS = new Set(tagged.map(t => t.pos));
    let legendX = startX;
    usedPOS.forEach(pos => {
      const config = POS_CONFIG[pos];
      shapes.push({
        id: `shape:pos-legend-${pos}-${Date.now()}` as any,
        type: 'text' as const,
        x: legendX,
        y: legendY,
        props: { text: `● ${config.label}`, size: 's', font: 'sans', color: config.color },
      });
      legendX += config.label.length * 7 + 30;
    });

    ed.createShapes(shapes);
  }, [editor, tagged]);

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
      <Card className="shadow-xl border-2 border-pink-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-pink-700 flex items-center gap-2">
              <Highlighter className="w-4 h-4" />
              Parts of Speech
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Enter a sentence or paragraph</Label>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="The quick brown fox jumps over the lazy dog."
              className="min-h-[80px] text-sm"
            />
            <Button onClick={analyzeText} disabled={!text.trim()} className="w-full bg-pink-600 hover:bg-pink-700 text-white">
              <Sparkles className="w-4 h-4 mr-1.5" /> Analyze Parts of Speech
            </Button>
          </div>

          {tagged.length > 0 && (
            <>
              {/* Color-coded output */}
              <div className="rounded-lg bg-white p-4 border min-h-[80px] leading-relaxed">
                {taggedOutput}
              </div>

              {/* Legend with counts */}
              <div className="rounded-lg bg-gray-50 p-3 border">
                <div className="text-[10px] font-semibold text-gray-500 mb-2">Legend</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(posCounts).map(([pos, count]) => {
                    const config = POS_CONFIG[pos as POS];
                    return (
                      <Badge
                        key={pos}
                        variant="outline"
                        className="text-[10px]"
                        style={{ borderColor: config.color, color: config.color, backgroundColor: config.bg }}
                      >
                        {config.label} ({count})
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <Button onClick={addToBoard} className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                <Plus className="w-4 h-4 mr-1.5" /> Add to Board
              </Button>
            </>
          )}

          {tagged.length === 0 && text.trim() && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              Click analyze to color-code the parts of speech.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
