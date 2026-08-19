// ============================================================
// Sentence Structure Exercises — organized by type, difficulty, grade band
// Architecture: data-file-based, consumed by unified widget component
// ============================================================

export type SentenceType =
  | 'simple' | 'compound' | 'complex' | 'compound-complex'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type GradeBand = 'K-5' | '6-8' | '9-12'

export interface SentenceExercise {
  id: string
  type: SentenceType
  difficulty: Difficulty
  band: GradeBand
  question: string
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
  explanations: [string, string, string]
}

export const SENTENCE_TYPES: { id: SentenceType; label: string; description: string }[] = [
  { id: 'simple', label: 'Simple', description: 'One independent clause with a subject and predicate' },
  { id: 'compound', label: 'Compound', description: 'Two independent clauses joined by a coordinating conjunction' },
  { id: 'complex', label: 'Complex', description: 'One independent clause and one or more dependent clauses' },
  { id: 'compound-complex', label: 'Compound-Complex', description: 'Two or more independent clauses and at least one dependent clause' },
]

// ============================================================
// Exercises — ~48 across 4 types, 3 difficulties, 3 grade bands
// ============================================================

export const SENTENCE_EXERCISES: SentenceExercise[] = [
  // ---- SIMPLE (12) ----
  { id: 'ss-simple-001', type: 'simple', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence is a simple sentence?',
    options: [
      'The dog barked loudly.',
      'The dog barked, and the cat ran.',
      'Because the dog barked, the cat ran.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. A simple sentence has one independent clause with one subject-verb pair.',
      'This is a compound sentence because it has two independent clauses joined by "and".',
      'This is a complex sentence because it starts with the subordinating conjunction "because".',
    ],
  },
  { id: 'ss-simple-002', type: 'simple', difficulty: 'beginner', band: 'K-5',
    question: 'Choose the simple sentence:',
    options: [
      'She read a book.',
      'She read a book, but he played outside.',
      'When she read a book, he played outside.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. This has exactly one subject ("she") and one verb ("read") — a simple sentence.',
      'Two independent clauses connected by "but" make this a compound sentence.',
      '"When" makes the first clause dependent, so this is complex.',
    ],
  },
  { id: 'ss-simple-003', type: 'simple', difficulty: 'beginner', band: 'K-5',
    question: 'Which is a simple sentence?',
    options: [
      'My best friend and I played soccer after school.',
      'My best friend played soccer, and I watched.',
      'Although we were tired, we played soccer.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Despite having a compound subject ("friend and I"), there is only one verb ("played") and one clause.',
      'Two clauses joined by "and" — this is compound.',
      '"Although" introduces a dependent clause — this is complex.',
    ],
  },
  { id: 'ss-simple-004', type: 'simple', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence is simple?',
    options: [
      'The tall, graceful dancer leaped across the stage.',
      'The dancer leaped across the stage, and the audience cheered.',
      'After the dancer leaped, the audience cheered.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. One subject ("dancer"), one verb ("leaped"), one clause — even with descriptive adjectives.',
      'Two independent clauses joined by "and" make this compound.',
      '"After" starts a dependent clause, making this complex.',
    ],
  },
  { id: 'ss-simple-005', type: 'simple', difficulty: 'intermediate', band: '6-8',
    question: 'Identify the simple sentence:',
    options: [
      'Scientific experiments require careful observation and precise measurements.',
      'Scientists conduct experiments, and engineers build prototypes.',
      'Because science requires precision, experiments must be controlled.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. One subject ("experiments") and one verb ("require") with a compound object.',
      'Two independent clauses joined by "and" — compound.',
      '"Because" makes the first clause dependent — complex.',
    ],
  },
  { id: 'ss-simple-006', type: 'simple', difficulty: 'advanced', band: '6-8',
    question: 'Which is a simple sentence despite having many words?',
    options: [
      'The exhausted hikers, who had been climbing for hours, finally reached the fog-covered summit.',
      'The hikers climbed for hours, and they finally reached the summit.',
      'When the hikers finally reached the summit, they celebrated their achievement.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. The clause "who had been climbing for hours" is just a relative clause modifying "hikers" — it does not make the sentence complex because it is embedded, not introduced by a subordinating conjunction.',
      'Two independent clauses with "and" — compound.',
      '"When" introduces a dependent clause — complex.',
    ],
  },
  { id: 'ss-simple-007', type: 'simple', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence is simple?',
    options: [
      'The committee chairperson called the meeting to order.',
      'The chairperson called the meeting, and the members took their seats.',
      'Before the chairperson called the meeting, members were chatting.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. One subject ("chairperson"), one verb ("called"), one independent clause.',
      'Two independent clauses joined by "and" — compound.',
      '"Before" introduces a dependent clause — complex.',
    ],
  },
  { id: 'ss-simple-008', type: 'simple', difficulty: 'advanced', band: '9-12',
    question: 'Which is a simple sentence?',
    options: [
      'The philosopher argued convincingly and wrote eloquently about ethics.',
      'The philosopher argued convincingly, and she wrote eloquently about ethics.',
      'Although the philosopher argued convincingly, critics disagreed.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. One subject ("philosopher") with a compound predicate ("argued" and "wrote") — still one clause.',
      'Two independent clauses joined by "and" — compound.',
      '"Although" starts a dependent clause — complex.',
    ],
  },
  { id: 'ss-simple-009', type: 'simple', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence has only one clause?',
    options: [
      'The sun shines brightly.',
      'The sun shines, and the flowers grow.',
      'When the sun shines, the flowers grow.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Only one subject-verb pair: "sun shines" — a simple sentence.',
      'Two clauses make this compound.',
      '"When" introduces a dependent clause — complex.',
    ],
  },
  { id: 'ss-simple-010', type: 'simple', difficulty: 'intermediate', band: '6-8',
    question: 'Which is a simple sentence with a compound subject?',
    options: [
      'My brother and sister attend the same school.',
      'My brother attends school, and my sister goes to work.',
      'Since my brother and sister attend school, they ride the bus together.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. A compound subject ("brother and sister") with one verb ("attend") is still a simple sentence.',
      'Two independent clauses — compound.',
      '"Since" introduces a dependent clause — complex.',
    ],
  },
  { id: 'ss-simple-011', type: 'simple', difficulty: 'advanced', band: '9-12',
    question: 'Which is a simple sentence?',
    options: [
      'The unexpectedly fierce storm caused widespread flooding across three counties.',
      'The storm caused flooding, and the rivers overflowed their banks.',
      'Because the storm was fierce, it caused widespread flooding.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. One subject ("storm"), one verb ("caused"), one clause — descriptive phrases do not add clauses.',
      'Two independent clauses joined by "and" — compound.',
      '"Because" starts a dependent clause — complex.',
    ],
  },
  { id: 'ss-simple-012', type: 'simple', difficulty: 'beginner', band: '6-8',
    question: 'Which is a simple sentence?',
    options: [
      'The old library has thousands of books.',
      'The old library has thousands of books, and students visit daily.',
      'Students visit the library because it has many books.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. One subject ("library"), one verb ("has") — a simple sentence.',
      'Two clauses joined by "and" — compound.',
      '"Because" introduces a dependent clause — complex.',
    ],
  },

  // ---- COMPOUND (12) ----
  { id: 'ss-compound-001', type: 'compound', difficulty: 'beginner', band: 'K-5',
    question: 'Which is a compound sentence?',
    options: [
      'I like pizza, and my brother likes tacos.',
      'I like pizza with cheese.',
      'Because I like pizza, I ordered it for dinner.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("I like pizza" / "my brother likes tacos") joined by the coordinating conjunction "and".',
      'One independent clause — this is a simple sentence.',
      '"Because" makes the first clause dependent — this is complex.',
    ],
  },
  { id: 'ss-compound-002', type: 'compound', difficulty: 'beginner', band: 'K-5',
    question: 'Find the compound sentence:',
    options: [
      'The rain stopped, so we went outside to play.',
      'When the rain stopped, we went outside.',
      'We went outside to play in the puddles.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses joined by the coordinating conjunction "so" — compound.',
      '"When" creates a dependent clause — complex.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-compound-003', type: 'compound', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence is compound?',
    options: [
      'She wanted to go, but she had to finish her homework.',
      'She wanted to go to the park.',
      'She went to the park after she finished her homework.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses joined by "but" — a compound sentence.',
      'One clause — simple.',
      '"After" introduces a dependent clause — complex.',
    ],
  },
  { id: 'ss-compound-004', type: 'compound', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence uses a coordinating conjunction correctly to form a compound sentence?',
    options: [
      'The team practiced hard, yet they lost the championship game.',
      'Even though the team practiced hard, they lost.',
      'The team practiced hard for the championship.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "Yet" is a coordinating conjunction (FANBOYS) joining two independent clauses.',
      '"Even though" is a subordinating conjunction — this makes a complex sentence.',
      'One independent clause — simple.',
    ],
  },
  { id: 'ss-compound-005', type: 'compound', difficulty: 'intermediate', band: '6-8',
    question: 'Identify the compound sentence:',
    options: [
      'The scientist published her findings, and the community reviewed her work.',
      'The scientist published her findings after years of research.',
      'After the scientist published her findings, the community reviewed them.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses joined by "and" — compound.',
      'One clause with a prepositional phrase — simple.',
      '"After" creates a dependent clause — complex.',
    ],
  },
  { id: 'ss-compound-006', type: 'compound', difficulty: 'advanced', band: '6-8',
    question: 'Which sentence is compound (not complex)?',
    options: [
      'He studied diligently; however, the exam was extremely difficult.',
      'Although he studied diligently, the exam was extremely difficult.',
      'He studied diligently for the extremely difficult exam.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. A semicolon with "however" joins two independent clauses — this is compound. The semicolon functions like a coordinating conjunction.',
      '"Although" is subordinating — complex.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-compound-007', type: 'compound', difficulty: 'intermediate', band: '9-12',
    question: 'Which is a compound sentence?',
    options: [
      'The legislation passed the Senate, or it would be reintroduced next session.',
      'The legislation would be reintroduced if it failed to pass.',
      'The legislation passed the Senate with bipartisan support.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses joined by "or" — compound.',
      '"If" introduces a dependent clause — complex.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-compound-008', type: 'compound', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence is compound?',
    options: [
      'The author outlined her arguments in the introduction; furthermore, she supported each with evidence.',
      'Furthermore, the author supported her arguments with evidence.',
      'Because the author outlined her arguments, the essay was well-organized.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. A semicolon with "furthermore" connects two independent clauses — compound.',
      'One clause — simple ("furthermore" is just an adverb here).',
      '"Because" introduces a dependent clause — complex.',
    ],
  },
  { id: 'ss-compound-009', type: 'compound', difficulty: 'beginner', band: '6-8',
    question: 'Which is a compound sentence?',
    options: [
      'The cake looked delicious, but it tasted too sweet.',
      'The cake on the table looked delicious.',
      'Even though the cake looked delicious, it was too sweet.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses joined by "but" — compound.',
      'One clause — simple.',
      '"Even though" introduces a dependent clause — complex.',
    ],
  },
  { id: 'ss-compound-010', type: 'compound', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence is compound?',
    options: [
      'The orchestra performed beautifully, nor did the audience expect anything less.',
      'The orchestra performed beautifully during the final movement.',
      'While the orchestra performed, the audience listened in silence.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "Nor" is a coordinating conjunction joining two independent clauses — compound.',
      'One clause — simple.',
      '"While" introduces a dependent clause — complex.',
    ],
  },
  { id: 'ss-compound-011', type: 'compound', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence uses a semicolon to create a compound sentence?',
    options: [
      'The experiment yielded surprising results; the hypothesis needed revision.',
      'The experiment yielded surprising results that required hypothesis revision.',
      'Since the experiment yielded surprising results, the hypothesis needed revision.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. A semicolon joins two independent clauses — compound.',
      '"That" introduces a relative clause embedded in the sentence — this is still one independent clause (simple or complex depending on analysis, but not compound).',
      '"Since" introduces a dependent clause — complex.',
    ],
  },
  { id: 'ss-compound-012', type: 'compound', difficulty: 'intermediate', band: '6-8',
    question: 'Which is a compound sentence?',
    options: [
      'We can go to the museum, or we can visit the aquarium.',
      'We can go to the museum on Saturday.',
      'If we go to the museum, we will see the new exhibit.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses joined by "or" — compound.',
      'One clause — simple.',
      '"If" introduces a dependent clause — complex.',
    ],
  },

  // ---- COMPLEX (12) ----
  { id: 'ss-complex-001', type: 'complex', difficulty: 'beginner', band: 'K-5',
    question: 'Which is a complex sentence?',
    options: [
      'Because it was raining, we stayed inside.',
      'It was raining, and we stayed inside.',
      'We stayed inside during the rain.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "Because it was raining" is a dependent clause; "we stayed inside" is independent — complex.',
      'Two independent clauses joined by "and" — compound.',
      'One clause with a prepositional phrase — simple.',
    ],
  },
  { id: 'ss-complex-002', type: 'complex', difficulty: 'beginner', band: 'K-5',
    question: 'Find the complex sentence:',
    options: [
      'When the bell rings, we go to lunch.',
      'The bell rings, so we go to lunch.',
      'We go to lunch at noon.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "When the bell rings" is a dependent clause — complex.',
      'Two independent clauses joined by "so" — compound.',
      'One independent clause — simple, not complex.',
    ],
  },
  { id: 'ss-complex-003', type: 'complex', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence has a dependent clause?',
    options: [
      'The dog that barked loudly ran away.',
      'The dog barked loudly and ran away.',
      'The dog barked loudly.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "that barked loudly" is a relative (dependent) clause modifying "dog" — complex.',
      'Two verbs sharing one subject (compound predicate) — simple.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-complex-004', type: 'complex', difficulty: 'intermediate', band: '6-8',
    question: 'Which is a complex sentence?',
    options: [
      'Although she was nervous, Maria delivered a perfect presentation.',
      'Maria was nervous, but she delivered a perfect presentation.',
      'Maria delivered a perfect presentation to the class.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "Although she was nervous" is a dependent clause — complex.',
      'Two independent clauses joined by "but" — compound.',
      'One independent clause — simple.',
    ],
  },
  { id: 'ss-complex-005', type: 'complex', difficulty: 'intermediate', band: '6-8',
    question: 'Identify the complex sentence:',
    options: [
      'The students who completed the project early received extra credit.',
      'The students completed the project, and they received extra credit.',
      'The students completed the project for extra credit.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "who completed the project early" is a relative (dependent) clause — complex.',
      'Two independent clauses joined by "and" — compound.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-complex-006', type: 'complex', difficulty: 'advanced', band: '6-8',
    question: 'Which sentence is complex?',
    options: [
      'While the city slept, the rescue teams worked through the night.',
      'The city slept, and the rescue teams worked through the night.',
      'The rescue teams worked through the night.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "While the city slept" is a dependent clause — complex.',
      'Two independent clauses — compound.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-complex-007', type: 'complex', difficulty: 'intermediate', band: '9-12',
    question: 'Which is a complex sentence?',
    options: [
      'The bill that the senator proposed addresses environmental concerns.',
      'The senator proposed a bill, and it addresses environmental concerns.',
      'The senator proposed an environmental bill.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "that the senator proposed" is a relative (dependent) clause — complex.',
      'Two independent clauses joined by "and" — compound.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-complex-008', type: 'complex', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence contains an adverbial dependent clause?',
    options: [
      'Unless the data supports the theory, the hypothesis remains unproven.',
      'The data supports the theory; therefore, the hypothesis is proven.',
      'The data supports the theory conclusively.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "Unless the data supports the theory" is an adverbial dependent clause — complex.',
      'Semicolon + conjunctive adverb joins two independent clauses — compound.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-complex-009', type: 'complex', difficulty: 'beginner', band: '6-8',
    question: 'Which sentence is complex?',
    options: [
      'If you practice every day, you will improve.',
      'You should practice every day, and you will improve.',
      'You will improve with daily practice.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "If you practice every day" is a dependent clause — complex.',
      'Two independent clauses joined by "and" — compound.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-complex-010', type: 'complex', difficulty: 'intermediate', band: '9-12',
    question: 'Which is a complex sentence with the dependent clause in the middle?',
    options: [
      'The athlete, who had trained for years, finally won the gold medal.',
      'The athlete trained for years and won the gold medal.',
      'The athlete trained for years.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "who had trained for years" is a non-restrictive relative clause embedded between commas — complex.',
      'Compound predicate with one subject — simple.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-complex-011', type: 'complex', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence is complex?',
    options: [
      'Whenever the volcano shows increased activity, the monitoring station issues alerts.',
      'The volcano showed increased activity, and the monitoring station issued alerts.',
      'The monitoring station issued volcano activity alerts.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "Whenever the volcano shows increased activity" is a dependent clause — complex.',
      'Two independent clauses joined by "and" — compound.',
      'One clause — simple.',
    ],
  },
  { id: 'ss-complex-012', type: 'complex', difficulty: 'intermediate', band: '6-8',
    question: 'Which is a complex sentence?',
    options: [
      'Since the store was closed, we ordered online instead.',
      'The store was closed, so we ordered online.',
      'We ordered from the online store.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. "Since the store was closed" is a dependent clause — complex.',
      'Two independent clauses joined by "so" — compound.',
      'One clause — simple.',
    ],
  },

  // ---- COMPOUND-COMPLEX (12) ----
  { id: 'ss-cplx-001', type: 'compound-complex', difficulty: 'intermediate', band: '6-8',
    question: 'Which is a compound-complex sentence?',
    options: [
      'Although it was late, we finished the project, and the teacher praised our work.',
      'Although it was late, we finished the project.',
      'We finished the project, and the teacher praised our work.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("we finished the project" / "the teacher praised our work") plus one dependent clause ("Although it was late") — compound-complex.',
      'One independent + one dependent clause — complex only.',
      'Two independent clauses — compound only.',
    ],
  },
  { id: 'ss-cplx-002', type: 'compound-complex', difficulty: 'intermediate', band: '6-8',
    question: 'Identify the compound-complex sentence:',
    options: [
      'The team won the game because they practiced hard, and the coach celebrated with them.',
      'The team won because they practiced hard.',
      'The team won the game, and they celebrated afterward.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("The team won the game" / "the coach celebrated with them") and one dependent clause ("because they practiced hard") — compound-complex.',
      'One independent + one dependent — complex.',
      'Two independent clauses — compound.',
    ],
  },
  { id: 'ss-cplx-003', type: 'compound-complex', difficulty: 'advanced', band: '6-8',
    question: 'Which is a compound-complex sentence?',
    options: [
      'When the storm passed, the crew assessed the damage, and they began repairs immediately.',
      'When the storm passed, the crew began repairs.',
      'The crew assessed the damage, and they began repairs.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("the crew assessed the damage" / "they began repairs immediately") and one dependent clause ("When the storm passed") — compound-complex.',
      'One independent + one dependent — complex.',
      'Two independent clauses — compound.',
    ],
  },
  { id: 'ss-cplx-004', type: 'compound-complex', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence is compound-complex?',
    options: [
      'The researcher who discovered the enzyme published her findings, and the scientific community took notice.',
      'The researcher published her findings, and the community took notice.',
      'The researcher who discovered the enzyme published her findings.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("The researcher...published her findings" / "the scientific community took notice") and one dependent clause ("who discovered the enzyme") — compound-complex.',
      'Two independent clauses — compound.',
      'One independent clause with a relative clause — complex.',
    ],
  },
  { id: 'ss-cplx-005', type: 'compound-complex', difficulty: 'advanced', band: '9-12',
    question: 'Which is a compound-complex sentence?',
    options: [
      'Even though the economy was struggling, consumer spending increased, and unemployment rates dropped.',
      'Even though the economy was struggling, consumer spending increased.',
      'Consumer spending increased, and unemployment rates dropped.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("consumer spending increased" / "unemployment rates dropped") and one dependent clause ("Even though the economy was struggling") — compound-complex.',
      'One independent + one dependent — complex.',
      'Two independent clauses — compound.',
    ],
  },
  { id: 'ss-cplx-006', type: 'compound-complex', difficulty: 'intermediate', band: '6-8',
    question: 'Find the compound-complex sentence:',
    options: [
      'While I was doing homework, my brother played video games, and my sister watched a movie.',
      'While I was doing homework, my brother played video games.',
      'My brother played video games, and my sister watched a movie.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("my brother played video games" / "my sister watched a movie") plus the dependent clause ("While I was doing homework") — compound-complex.',
      'One independent + one dependent — complex.',
      'Two independent clauses — compound.',
    ],
  },
  { id: 'ss-cplx-007', type: 'compound-complex', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence is compound-complex?',
    options: [
      'The diplomat negotiated the treaty that ended the conflict, and both nations agreed to its terms.',
      'The diplomat negotiated the treaty, and both nations agreed to its terms.',
      'The diplomat negotiated the treaty that ended the conflict.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("The diplomat negotiated the treaty..." / "both nations agreed to its terms") and one dependent clause ("that ended the conflict") — compound-complex.',
      'Two independent clauses — compound.',
      'One independent clause with a relative clause — complex.',
    ],
  },
  { id: 'ss-cplx-008', type: 'compound-complex', difficulty: 'intermediate', band: '9-12',
    question: 'Which is a compound-complex sentence?',
    options: [
      'Because the evidence was compelling, the jury reached a quick verdict, and the judge sentenced the defendant.',
      'Because the evidence was compelling, the jury reached a verdict.',
      'The jury reached a verdict, and the judge sentenced the defendant.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("the jury reached a quick verdict" / "the judge sentenced the defendant") plus a dependent clause ("Because the evidence was compelling") — compound-complex.',
      'One independent + one dependent — complex.',
      'Two independent clauses — compound.',
    ],
  },
  { id: 'ss-cplx-009', type: 'compound-complex', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence is compound-complex?',
    options: [
      'The architect, who had designed many museums, presented her plans, and the board approved the project.',
      'The architect presented her plans, and the board approved the project.',
      'The architect, who had designed many museums, presented her plans.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("The architect...presented her plans" / "the board approved the project") and a dependent relative clause ("who had designed many museums") — compound-complex.',
      'Two independent clauses — compound.',
      'One independent clause with a relative clause — complex.',
    ],
  },
  { id: 'ss-cplx-010', type: 'compound-complex', difficulty: 'intermediate', band: '6-8',
    question: 'Which is a compound-complex sentence?',
    options: [
      'After we ate dinner, we washed the dishes, and then we watched a movie.',
      'After we ate dinner, we watched a movie.',
      'We washed the dishes, and then we watched a movie.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("we washed the dishes" / "then we watched a movie") and one dependent clause ("After we ate dinner") — compound-complex.',
      'One independent + one dependent — complex.',
      'Two independent clauses — compound.',
    ],
  },
  { id: 'ss-cplx-011', type: 'compound-complex', difficulty: 'advanced', band: '6-8',
    question: 'Which sentence contains at least two independent clauses and one dependent clause?',
    options: [
      'The students who studied hard passed the test, and their parents were proud.',
      'The students who studied hard passed the test.',
      'The students passed the test, and their parents were proud.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("The students...passed the test" / "their parents were proud") and one dependent clause ("who studied hard") — compound-complex.',
      'One independent clause with a relative clause — complex.',
      'Two independent clauses — compound.',
    ],
  },
  { id: 'ss-cplx-012', type: 'compound-complex', difficulty: 'advanced', band: '9-12',
    question: 'Which is a compound-complex sentence?',
    options: [
      'Unless funding is secured, the program will end this year, but the organizers are seeking new sponsors.',
      'Unless funding is secured, the program will end.',
      'The program will end this year, but organizers are seeking sponsors.',
    ],
    correctIndex: 0,
    explanations: [
      'Correct. Two independent clauses ("the program will end this year" / "the organizers are seeking new sponsors") and one dependent clause ("Unless funding is secured") — compound-complex.',
      'One independent + one dependent — complex.',
      'Two independent clauses — compound.',
    ],
  },
]

// ============================================================
// Filter & Shuffle helpers
// ============================================================

export function getExercisesByFilter(filter: {
  types?: SentenceType[]
  difficulty?: Difficulty | 'all'
  band?: GradeBand | 'all'
}): SentenceExercise[] {
  let result = SENTENCE_EXERCISES
  if (filter.types && filter.types.length > 0) {
    result = result.filter(e => filter.types!.includes(e.type))
  }
  if (filter.difficulty && filter.difficulty !== 'all') {
    result = result.filter(e => e.difficulty === filter.difficulty)
  }
  if (filter.band && filter.band !== 'all') {
    result = result.filter(e => e.band === filter.band)
  }
  return result
}

export function shuffleExercises(exercises: SentenceExercise[]): SentenceExercise[] {
  const arr = [...exercises]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getExerciseById(id: string): SentenceExercise | undefined {
  return SENTENCE_EXERCISES.find(e => e.id === id)
}

export function generateWrongVariants(sentence: string, type: SentenceType): [string, string] {
  // Generate plausible wrong sentence-structure variants for teacher authoring.
  // Strategy: produce sentences that look similar but represent a different structure type.
  const ALL_TYPES: SentenceType[] = ['simple', 'compound', 'complex', 'compound-complex']
  const otherTypes = ALL_TYPES.filter(t => t !== type)

  // Joining with a coordinating conjunction
  const CONJUNCTIONS = ['and', 'but', 'or', 'so']
  // Subordinating conjunctions
  const SUBORDINATORS = ['because', 'although', 'if', 'when', 'while', 'since', 'unless']

  const base = sentence.replace(/[.!?]$/, '')

  switch (type) {
    case 'simple': {
      // Make it compound: add a coordinating conjunction + clause
      const conj = CONJUNCTIONS[Math.floor(Math.random() * CONJUNCTIONS.length)]
      const compoundVariant = base + ', ' + conj + ' it was interesting.'
      // Make it complex: add a subordinating conjunction
      const sub = SUBORDINATORS[Math.floor(Math.random() * SUBORDINATORS.length)]
      const words = base.split(' ')
      const verbIdx = words.findIndex(w => /[a-z]+ed|[a-z]+s$/.test(w))
      const complexVariant = sub.charAt(0).toUpperCase() + sub.slice(1) + ' ' + (verbIdx > 0 ? words.slice(0, verbIdx).join(' ') : base) + ', ' + base + '.'
      return [compoundVariant, complexVariant]
    }
    case 'compound': {
      // Make it simple: take just the first clause
      const conjMatch = base.match(/,\s*(and|but|or|so|yet|nor)\s+/i)
      const simpleVariant = conjMatch ? (conjMatch.index !== undefined ? base.slice(0, conjMatch.index) + '.' : base + '.') : base + '.'
      // Make it complex: replace coordinating conjunction with subordinator
      const complexVariant = conjMatch
        ? base.replace(conjMatch[0], ', ' + SUBORDINATORS[0] + ' ')
        : SUBORDINATORS[0].charAt(0).toUpperCase() + SUBORDINATORS[0].slice(1) + ' ' + base + '.'
      return [simpleVariant, complexVariant]
    }
    case 'complex': {
      // Check for subordinator at start
      const subMatch = base.match(/^(Because|Although|If|When|While|Since|Unless|Even though)\s+/i)
      const afterSub = subMatch ? base.slice(subMatch[0].length) : base
      // Make it simple: remove the dependent clause
      const commaIdx = afterSub.indexOf(',')
      const simpleVariant = commaIdx >= 0
        ? afterSub.slice(commaIdx + 1).trim().replace(/^,\s*/, '') + '.'
        : base + '.'
      // Make it compound: replace subordinator, keep two clauses
      const compoundVariant = commaIdx >= 0
        ? afterSub.slice(commaIdx + 1).trim().replace(/^,\s*/, '') + ', ' + CONJUNCTIONS[0] + ' ' + afterSub.slice(0, commaIdx).trim() + '.'
        : base + ', ' + CONJUNCTIONS[0] + ' that happened.'
      return [simpleVariant, compoundVariant]
    }
    case 'compound-complex': {
      // Make it compound: remove the dependent clause
      const subMatch = base.match(/^(Because|Although|If|When|While|Since|Unless|Even though)\s+/i)
      if (subMatch) {
        const afterSub = base.slice(subMatch[0].length)
        const commaIdx = afterSub.indexOf(',')
        if (commaIdx >= 0) {
          const compoundVariant = afterSub.slice(commaIdx + 1).trim().replace(/^,\s*/, '') + '.'
          // Make it complex: keep one independent clause + dependent
          const complexVariant = subMatch[0].toLowerCase() + afterSub.slice(0, commaIdx).trim() + '.'
          return [compoundVariant, complexVariant]
        }
      }
      // Fallback: check for relative clause pattern
      const relMatch = base.match(/,\s*who\s|,\s*which\s|,\s*that\s/)
      if (relMatch && relMatch.index !== undefined) {
        const before = base.slice(0, relMatch.index)
        const after = base.slice(relMatch.index)
        const endRel = after.indexOf(',')
        const compoundVariant = before + (endRel >= 0 ? after.slice(endRel + 1) : '') + '.'
        return [compoundVariant.trim(), base.replace(/,\s*(and|but|or|so)/i, '.').trim()]
      }
      return [base + '.', base + ', and so it was.']
    }
    default:
      return [sentence + '?', sentence + '!']
  }
}
