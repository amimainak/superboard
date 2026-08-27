'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, FileText, Plus, Trash2, BookOpen, ListChecks, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface DBQWorkspaceProps {
  editor: unknown;
  onClose?: () => void;
}

interface Document {
  id: string;
  source: string;
  text: string;
  annotation: string;
}

interface Evidence {
  id: string;
  docId: string;
  quote: string;
  analysis: string;
}

export default function DBQWorkspace({ editor, onClose }: DBQWorkspaceProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [thesis, setThesis] = useState('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [newSource, setNewSource] = useState('');
  const [newText, setNewText] = useState('');
  const [newEvidenceDoc, setNewEvidenceDoc] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newAnalysis, setNewAnalysis] = useState('');

  const addDocument = useCallback(() => {
    if (!newSource.trim() || !newText.trim()) return;
    const doc: Document = {
      id: `doc-${Date.now()}` as any,
      source: newSource.trim(),
      text: newText.trim(),
      annotation: '',
    };
    setDocuments(prev => [...prev, doc]);
    setNewSource('');
    setNewText('');
  }, [newSource, newText]);

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    setEvidence(prev => prev.filter(e => e.docId !== id));
  }, []);

  const updateAnnotation = useCallback((docId: string, annotation: string) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, annotation } : d));
  }, []);

  const addEvidence = useCallback(() => {
    if (!newEvidenceDoc || !newQuote.trim()) return;
    const ev: Evidence = {
      id: `ev-${Date.now()}` as any,
      docId: newEvidenceDoc,
      quote: newQuote.trim(),
      analysis: newAnalysis.trim(),
    };
    setEvidence(prev => [...prev, ev]);
    setNewQuote('');
    setNewAnalysis('');
  }, [newEvidenceDoc, newQuote, newAnalysis]);

  const removeEvidence = useCallback((id: string) => {
    setEvidence(prev => prev.filter(e => e.id !== id));
  }, []);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 250;
    const startY = center.y - 200;
    const shapes: any[] = [];

    // Title
    shapes.push({
      id: `shape:dbq-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 40,
      props: { text: 'DBQ Workspace', size: 'xl', font: 'sans' },
    });

    // Thesis
    if (thesis.trim()) {
      shapes.push({
        id: `shape:dbq-thesis-label-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y: startY,
        props: { text: 'THESIS:', size: 's', font: 'sans', color: '#dc2626' },
      });
      shapes.push({
        id: `shape:dbq-thesis-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y: startY + 18,
        props: { text: thesis, size: 'm', font: 'sans' },
      });
    }

    // Documents
    let y = startY + 60;
    documents.forEach((doc, i) => {
      shapes.push({
        id: `shape:dbq-doc-label-${doc.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y,
        props: { text: `Document ${i + 1}: ${doc.source}`, size: 'm', font: 'sans', color: '#2563eb' },
      });
      shapes.push({
        id: `shape:dbq-doc-text-${doc.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y: y + 20,
        props: { text: doc.text.slice(0, 200), size: 's', font: 'sans', color: '#374151' },
      });
      if (doc.annotation) {
        shapes.push({
          id: `shape:dbq-doc-ann-${doc.id}-${Date.now()}` as any,
          type: 'text' as const,
          x: startX + 20,
          y: y + 40,
          props: { text: `→ ${doc.annotation}`, size: 's', font: 'sans', color: '#6b7280' },
        });
        y += 20;
      }
      y += 60;
    });

    // Evidence
    if (evidence.length > 0) {
      shapes.push({
        id: `shape:dbq-ev-label-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y,
        props: { text: 'EVIDENCE:', size: 'm', font: 'sans', color: '#059669' },
      });
      y += 20;
      evidence.forEach(ev => {
        const doc = documents.find(d => d.id === ev.docId);
        shapes.push({
          id: `shape:dbq-ev-${ev.id}-${Date.now()}` as any,
          type: 'text' as const,
          x: startX + 10,
          y,
          props: { text: `"${ev.quote.slice(0, 80)}" — ${doc?.source || 'Unknown'}`, size: 's', font: 'sans' },
        });
        y += 16;
        if (ev.analysis) {
          shapes.push({
            id: `shape:dbq-ev-analysis-${ev.id}-${Date.now()}` as any,
            type: 'text' as const,
            x: startX + 20,
            y,
            props: { text: `Analysis: ${ev.analysis}`, size: 's', font: 'sans', color: '#6b7280' },
          });
          y += 16;
        }
        y += 4;
      });
    }

    ed.createShapes(shapes);
  }, [editor, documents, thesis, evidence]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1001,
    width: 520,
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto',
  };

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-amber-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              DBQ Workspace
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents">
            <TabsList className="w-full">
              <TabsTrigger value="documents" className="text-xs flex-1"><BookOpen className="w-3 h-3 mr-1" /> Documents</TabsTrigger>
              <TabsTrigger value="thesis" className="text-xs flex-1"><Lightbulb className="w-3 h-3 mr-1" /> Thesis</TabsTrigger>
              <TabsTrigger value="evidence" className="text-xs flex-1"><ListChecks className="w-3 h-3 mr-1" /> Evidence</TabsTrigger>
            </TabsList>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-3 mt-3">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs font-medium">Source</Label>
                    <Input value={newSource} onChange={e => setNewSource(e.target.value)} placeholder="e.g. Letter from John Adams" className="h-8 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addDocument} disabled={!newSource.trim() || !newText.trim()} className="w-full h-8 bg-amber-600 hover:bg-amber-700 text-white">
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Text</Label>
                  <Textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Paste document text..." className="min-h-[60px] text-xs" />
                </div>
              </div>

              <ScrollArea className="max-h-60">
                <div className="space-y-3">
                  {documents.map((doc, i) => (
                    <div key={doc.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">Doc {i + 1}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeDocument(doc.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-xs font-semibold">{doc.source}</div>
                      <div className="text-[10px] text-gray-600 line-clamp-3">{doc.text}</div>
                      <Input
                        value={doc.annotation}
                        onChange={e => updateAnnotation(doc.id, e.target.value)}
                        placeholder="Add annotation..."
                        className="h-7 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {documents.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Import 2-4 document passages to get started.
                </div>
              )}
            </TabsContent>

            {/* Thesis Tab */}
            <TabsContent value="thesis" className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Thesis Statement
                </Label>
                <Textarea
                  value={thesis}
                  onChange={e => setThesis(e.target.value)}
                  placeholder="Write your thesis statement here. It should be defensible, specific, and address the prompt..."
                  className="min-h-[120px] text-sm"
                />
              </div>
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                <div className="text-xs font-semibold text-amber-800 mb-1">Thesis Checklist</div>
                <div className="text-[10px] text-amber-700 space-y-0.5">
                  <div>✓ Defensible — can be proven with evidence</div>
                  <div>✓ Specific — not vague or general</div>
                  <div>✓ Answers the prompt directly</div>
                  <div>✓ Addresses all parts of the question</div>
                </div>
              </div>
            </TabsContent>

            {/* Evidence Tab */}
            <TabsContent value="evidence" className="space-y-3 mt-3">
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">From Document</Label>
                  <select
                    value={newEvidenceDoc}
                    onChange={e => setNewEvidenceDoc(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="">Select document...</option>
                    {documents.map((doc, i) => (
                      <option key={doc.id} value={doc.id}>Doc {i + 1}: {doc.source}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Quote / Evidence</Label>
                  <Textarea value={newQuote} onChange={e => setNewQuote(e.target.value)} placeholder="Paste a quote or paraphrase from the document..." className="min-h-[48px] text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Analysis</Label>
                  <Textarea value={newAnalysis} onChange={e => setNewAnalysis(e.target.value)} placeholder="How does this evidence support your thesis?" className="min-h-[48px] text-xs" />
                </div>
                <Button onClick={addEvidence} disabled={!newEvidenceDoc || !newQuote.trim()} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Evidence
                </Button>
              </div>

              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {evidence.map(ev => {
                    const doc = documents.find(d => d.id === ev.docId);
                    return (
                      <div key={ev.id} className="rounded-lg border p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[9px]">{doc?.source || 'Unknown'}</Badge>
                          <button onClick={() => removeEvidence(ev.id)}><Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <div className="text-xs italic text-gray-700">"{ev.quote.slice(0, 80)}{ev.quote.length > 80 ? '...' : ''}"</div>
                        {ev.analysis && <div className="text-[10px] text-gray-500">→ {ev.analysis}</div>}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {evidence.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  Add evidence from your documents to support your thesis.
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Separator className="my-3" />

          <Button onClick={addToBoard} disabled={documents.length === 0} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
