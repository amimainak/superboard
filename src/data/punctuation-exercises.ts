// ============================================================
// Punctuation Exercises — organized by rule, difficulty, grade band
// Architecture: data-file-based, consumed by unified widget component
// ============================================================

export type PunctRule =
  | 'period' | 'comma' | 'semicolon' | 'colon' | 'dash'
  | 'apostrophe' | 'quotation' | 'exclamation' | 'question' | 'hyphen'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type GradeBand = 'K-5' | '6-8' | '9-12'

export interface PunctExercise {
  id: string
  rule: PunctRule
  difficulty: Difficulty
  band: GradeBand
  question: string
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
  explanations: [string, string, string]
}

export const PUNCT_RULES: { id: PunctRule; label: string; description: string }[] = [
  { id: 'period', label: 'Period', description: 'End of sentences, abbreviations, initials' },
  { id: 'comma', label: 'Comma', description: 'Lists, introductory elements, compound sentences, appositives' },
  { id: 'semicolon', label: 'Semicolon', description: 'Joining independent clauses, complex lists' },
  { id: 'colon', label: 'Colon', description: 'Lists, explanations, formal greetings' },
  { id: 'dash', label: 'Dash', description: 'Parenthetical info, emphasis, interruptions' },
  { id: 'apostrophe', label: 'Apostrophe', description: 'Possessives, contractions, plurals of letters/numbers' },
  { id: 'quotation', label: 'Quotation Marks', description: 'Dialogue, titles, quotes within quotes' },
  { id: 'exclamation', label: 'Exclamation Mark', description: 'Commands, strong emotion, interjections' },
  { id: 'question', label: 'Question Mark', description: 'Direct questions, question vs statement' },
  { id: 'hyphen', label: 'Hyphen', description: 'Compound adjectives, compound numbers, prefixes' },
]

// ============================================================
// Exercises — ~65 across 10 rules, 3 difficulties, 3 grade bands
// ============================================================

export const PUNCT_EXERCISES: PunctExercise[] = [
  // ---- PERIOD (8) ----
  { id: 'p-period-001', rule: 'period', difficulty: 'beginner', band: 'K-5',
    question: 'Choose the sentence that ends correctly:',
    options: ['The cat sat on the mat.', 'The cat sat on the mat?', 'The cat sat on the mat!'],
    correctIndex: 0,
    explanations: ['Correct. Statements end with a period.', 'A question mark is for questions, not statements.', 'An exclamation mark shows strong emotion; this is a calm statement.'] },
  { id: 'p-period-002', rule: 'period', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence is punctuated correctly?',
    options: ['Please close the door.', 'Please close the door!', 'Please close the door?'],
    correctIndex: 0,
    explanations: ['Correct. Even polite commands end with a period.', 'An exclamation mark would mean the command is urgent or emotional.', 'A question mark is only for questions.'] },
  { id: 'p-period-003', rule: 'period', difficulty: 'intermediate', band: 'K-5',
    question: 'Which abbreviation is correct?',
    options: ['Dr. Smith is here.', 'Dr Smith is here.', 'Dr, Smith is here.'],
    correctIndex: 0,
    explanations: ['Correct. "Dr." uses a period because it is an abbreviation.', 'Abbreviations like Dr., Mr., and Mrs. need a period.', 'A comma is never used in abbreviations.'] },
  { id: 'p-period-004', rule: 'period', difficulty: 'beginner', band: '6-8',
    question: 'Choose the correctly punctuated sentence:',
    options: ['The experiment concluded at noon.', 'The experiment concluded at noon!', 'The experiment concluded at noon?'],
    correctIndex: 0,
    explanations: ['Correct. This is a factual statement and ends with a period.', 'An exclamation mark suggests strong emotion, which does not fit here.', 'A question mark is only for direct questions.'] },
  { id: 'p-period-005', rule: 'period', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence uses the period correctly?',
    options: ['The meeting is at 3 p.m. on Friday.', 'The meeting is at 3 pm on Friday.', 'The meeting is at 3 p,m, on Friday.'],
    correctIndex: 0,
    explanations: ['Correct. "p.m." is an abbreviation and needs periods.', '"pm" without periods is acceptable in informal writing but not standard.', 'Commas are never used in time abbreviations.'] },
  { id: 'p-period-006', rule: 'period', difficulty: 'advanced', band: '6-8',
    question: 'Which is correct?',
    options: ['She earned her Ph.D. in 2015.', 'She earned her Ph.D in 2015.', 'She earned her PhD. in 2015.'],
    correctIndex: 0,
    explanations: ['Correct. Both parts of the abbreviation get periods.', 'The "D" also needs a period to show it is abbreviated.', 'The period goes inside the abbreviation, not after it.'] },
  { id: 'p-period-007', rule: 'period', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence is correct?',
    options: ['The senator addressed the committee.', 'The senator addressed the committee!', 'The senator addressed the committee?'],
    correctIndex: 0,
    explanations: ['Correct. A neutral declarative sentence ends with a period.', 'Reserve exclamation marks for truly emphatic statements.', 'This is not a question.'] },
  { id: 'p-period-008', rule: 'period', difficulty: 'advanced', band: '9-12',
    question: 'Choose the correctly punctuated sentence:',
    options: ['The project, which was funded by the N.S.F., succeeded.', 'The project, which was funded by the NSF., succeeded.', 'The project, which was funded by the N.S.F, succeeded.'],
    correctIndex: 0,
    explanations: ['Correct. Each letter in the initialism gets a period.', 'The period goes after each letter, not after the whole abbreviation.', 'The final period is missing after "F".'] },

  // ---- COMMA (8) ----
  { id: 'p-comma-001', rule: 'comma', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence uses commas correctly in a list?',
    options: ['I like apples, bananas, and oranges.', 'I like apples bananas and oranges.', 'I like apples, bananas and oranges.'],
    correctIndex: 0,
    explanations: ['Correct. The Oxford comma before "and" clarifies the list.', 'Items in a list of three or more must be separated by commas.', 'Without the Oxford comma, the last two items can seem like a pair.'] },
  { id: 'p-comma-002', rule: 'comma', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence starts correctly?',
    options: ['After lunch, we went outside.', 'After lunch we went outside.', 'After, lunch we went outside.'],
    correctIndex: 0,
    explanations: ['Correct. A comma follows an introductory phrase.', 'An introductory phrase needs a comma after it.', 'The comma should come after the whole phrase, not in the middle.'] },
  { id: 'p-comma-003', rule: 'comma', difficulty: 'intermediate', band: 'K-5',
    question: 'Choose the correctly punctuated sentence:',
    options: ['Wow, that is a big dog!', 'Wow that is a big dog!', 'Wow, that, is a big dog!'],
    correctIndex: 0,
    explanations: ['Correct. A comma follows the interjection "Wow".', 'Interjections are followed by commas.', 'Only one comma is needed after the interjection.'] },
  { id: 'p-comma-004', rule: 'comma', difficulty: 'beginner', band: '6-8',
    question: 'Which compound sentence is punctuated correctly?',
    options: ['I was tired, so I went to bed.', 'I was tired so, I went to bed.', 'I was tired so I went to bed.'],
    correctIndex: 0,
    explanations: ['Correct. The comma goes before the conjunction joining two independent clauses.', 'The comma goes before "so", not after it.', 'A comma is needed before coordinating conjunctions joining independent clauses.'] },
  { id: 'p-comma-005', rule: 'comma', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence uses commas correctly?',
    options: ['My sister, who lives in Paris, is visiting.', 'My sister who lives in Paris, is visiting.', 'My sister, who lives in Paris is visiting.'],
    correctIndex: 0,
    explanations: ['Correct. Non-essential clauses are set off by commas on both sides.', 'The first comma is needed before the non-essential clause.', 'A comma is also needed after the non-essential clause.'] },
  { id: 'p-comma-006', rule: 'comma', difficulty: 'advanced', band: '6-8',
    question: 'Which sentence is correct?',
    options: ['Having finished the test, the students left early.', 'Having finished the test the students, left early.', 'Having finished, the test, the students left early.'],
    correctIndex: 0,
    explanations: ['Correct. A comma follows an introductory participial phrase.', 'The comma separates the introductory phrase from the main clause.', 'Only one comma is needed after the introductory phrase.'] },
  { id: 'p-comma-007', rule: 'comma', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence uses the comma correctly with an appositive?',
    options: ['Mr. Lee, the principal, announced the assembly.', 'Mr. Lee the principal, announced the assembly.', 'Mr. Lee, the principal announced the assembly.'],
    correctIndex: 0,
    explanations: ['Correct. The appositive "the principal" is set off by commas on both sides.', 'A comma is needed before the appositive.', 'A comma is also needed after the appositive.'] },
  { id: 'p-comma-008', rule: 'comma', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence is punctuated correctly?',
    options: ['The author, however, disagreed with the review.', 'The author however, disagreed with the review.', 'The author, however disagreed with the review.'],
    correctIndex: 0,
    explanations: ['Correct. Conjunctive adverbs like "however" are set off by commas on both sides.', 'A comma is needed before "however" as well.', 'A comma is needed after "however" to separate it from the clause.'] },

  // ---- SEMICOLON (6) ----
  { id: 'p-semi-001', rule: 'semicolon', difficulty: 'beginner', band: '6-8',
    question: 'Which sentence uses a semicolon correctly?',
    options: ['It rained all day; we stayed inside.', 'It rained all day; so we stayed inside.', 'It rained all day we; stayed inside.'],
    correctIndex: 0,
    explanations: ['Correct. A semicolon joins two related independent clauses.', 'Do not use a semicolon with a coordinating conjunction like "so".', 'The semicolon goes between the clauses, not inside one.'] },
  { id: 'p-semi-002', rule: 'semicolon', difficulty: 'intermediate', band: '6-8',
    question: 'Choose the correct sentence:',
    options: ['She plays soccer; he plays basketball.', 'She plays soccer; and he plays basketball.', 'She plays soccer, he plays basketball;'],
    correctIndex: 0,
    explanations: ['Correct. Semicolons join related independent clauses without a conjunction.', 'Do not pair a semicolon with a coordinating conjunction.', 'The semicolon replaces the comma, not the period.'] },
  { id: 'p-semi-003', rule: 'semicolon', difficulty: 'advanced', band: '6-8',
    question: 'Which sentence is correct?',
    options: ['I have visited Paris, France; Rome, Italy; and London, England.', 'I have visited Paris, France, Rome, Italy, and London, England.', 'I have visited Paris, France; Rome, Italy and London, England.'],
    correctIndex: 0,
    explanations: ['Correct. Semicolons separate items in a complex list that already contains commas.', 'Without semicolons, the list items with internal commas become confusing.', 'Consistency: use semicolons between all major list items when they contain commas.'] },
  { id: 'p-semi-004', rule: 'semicolon', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence is punctuated correctly?',
    options: ['The sky grew dark; the storm approached quickly.', 'The sky grew dark; because the storm approached quickly.', 'The sky grew dark the storm; approached quickly.'],
    correctIndex: 0,
    explanations: ['Correct. Both sides must be independent clauses (complete sentences).', 'A semicolon cannot join an independent clause to a dependent clause.', 'The semicolon must go between the two complete clauses.'] },
  { id: 'p-semi-005', rule: 'semicolon', difficulty: 'advanced', band: '9-12',
    question: 'Which is correct?',
    options: ['Some students prefer visual learning; others learn best through practice.', 'Some students prefer visual learning; however others learn best through practice.', 'Some students prefer visual learning, others learn best through practice;'],
    correctIndex: 0,
    explanations: ['Correct. Semicolons connect closely related independent clauses.', 'When using "however", it should be followed by a comma: "; however, others".', 'A comma splice occurs when two independent clauses are joined by only a comma.'] },
  { id: 'p-semi-006', rule: 'semicolon', difficulty: 'beginner', band: '9-12',
    question: 'Which sentence correctly uses a semicolon?',
    options: ['The experiment failed; the hypothesis was wrong.', 'The experiment failed; because the hypothesis was wrong.', 'The experiment failed the; hypothesis was wrong.'],
    correctIndex: 0,
    explanations: ['Correct. A semicolon joins two complete, related statements.', '"Because the hypothesis was wrong" is a dependent clause and cannot follow a semicolon.', 'The semicolon must separate the two independent clauses.'] },

  // ---- COLON (6) ----
  { id: 'p-colon-001', rule: 'colon', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence introduces a list correctly?',
    options: ['I need three things: paper, pencils, and erasers.', 'I need three things, paper, pencils, and erasers.', 'I need three things; paper, pencils, and erasers.'],
    correctIndex: 0,
    explanations: ['Correct. A colon introduces a list.', 'A comma alone cannot introduce a list of items.', 'A semicolon is not used to introduce lists.'] },
  { id: 'p-colon-002', rule: 'colon', difficulty: 'intermediate', band: 'K-5',
    question: 'Choose the correctly punctuated sentence:',
    options: ['Dear Mrs. Jones:', 'Dear Mrs. Jones,', 'Dear Mrs. Jones;'],
    correctIndex: 0,
    explanations: ['Correct. A colon follows a formal greeting.', 'A comma is too casual for a formal letter greeting.', 'A semicolon is never used after a greeting.'] },
  { id: 'p-colon-003', rule: 'colon', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence uses a colon correctly?',
    options: ['The rule is clear: no running in the hallway.', 'The rule is clear, no running in the hallway.', 'The rule is clear; no running in the hallway.'],
    correctIndex: 0,
    explanations: ['Correct. A colon introduces an explanation or clarification.', 'A comma is too weak to introduce a direct explanation.', 'A semicolon joins independent clauses; this is a clarification, not a new clause.'] },
  { id: 'p-colon-004', rule: 'colon', difficulty: 'advanced', band: '6-8',
    question: 'Which is correct?',
    options: ['There are three primary colors: red, blue, and yellow.', 'There are three primary colors, red, blue, and yellow.', 'There are three primary colors; red, blue, and yellow.'],
    correctIndex: 0,
    explanations: ['Correct. Use a colon before a list when the clause before it is a complete sentence.', 'Without a colon, the relationship between the clause and the list is unclear.', 'A semicolon is for joining independent clauses, not for introducing lists.'] },
  { id: 'p-colon-005', rule: 'colon', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence is punctuated correctly?',
    options: ['She made one thing absolutely clear: she would not resign.', 'She made one thing absolutely clear, she would not resign.', 'She made one thing absolutely clear; she would not resign.'],
    correctIndex: 0,
    explanations: ['Correct. A colon emphasizes the explanation that follows.', 'This creates a comma splice between two independent clauses.', 'A semicolon could work here, but a colon better emphasizes the clarification.'] },
  { id: 'p-colon-006', rule: 'colon', difficulty: 'advanced', band: '9-12',
    question: 'Choose the correct sentence:',
    options: ['The instructions are as follows: read, annotate, and summarize.', 'The instructions are as follows, read, annotate, and summarize.', 'The instructions are as follows; read, annotate, and summarize.'],
    correctIndex: 0,
    explanations: ['Correct. "As follows" is always followed by a colon when introducing a list or steps.', 'A comma does not properly introduce the list after "as follows".', 'A semicolon is not used after "as follows".'] },

  // ---- DASH (5) ----
  { id: 'p-dash-001', rule: 'dash', difficulty: 'beginner', band: '6-8',
    question: 'Which sentence uses a dash correctly?',
    options: ['The animal—a red fox—darted across the road.', 'The animal-a red fox-darted across the road.', 'The animal, a red fox, darted across the road.'],
    correctIndex: 0,
    explanations: ['Correct. An em dash sets off parenthetical information for emphasis.', 'A hyphen is shorter and used for compound words, not parenthetical info.', 'Commas could work, but dashes add more emphasis.'] },
  { id: 'p-dash-002', rule: 'dash', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence is correct?',
    options: ['I finally got what I wanted—a puppy!', 'I finally got what I wanted, a puppy!', 'I finally got what I wanted; a puppy!'],
    correctIndex: 0,
    explanations: ['Correct. A dash creates dramatic emphasis before the reveal.', 'A comma is too weak for the dramatic pause here.', 'A semicolon connects independent clauses; this is an appositive, not a clause.'] },
  { id: 'p-dash-003', rule: 'dash', difficulty: 'intermediate', band: '9-12',
    question: 'Choose the correctly punctuated sentence:',
    options: ['The conference—scheduled for March—was postponed.', 'The conference, scheduled for March, was postponed.', 'The conference scheduled for March—was postponed.'],
    correctIndex: 0,
    explanations: ['Correct. Dashes set off the interrupting phrase with strong emphasis.', 'Commas are correct but weaker; dashes emphasize the interruption.', 'The dash only on one side is unbalanced.'] },
  { id: 'p-dash-004', rule: 'dash', difficulty: 'advanced', band: '9-12',
    question: 'Which is punctuated correctly?',
    options: ['The result was unexpected—and controversial.', 'The result was unexpected, and controversial.', 'The result was unexpected; and controversial.'],
    correctIndex: 0,
    explanations: ['Correct. A dash can emphasize an added thought at the end of a sentence.', 'A comma before "and" is only needed between independent clauses.', 'Never pair a semicolon with a coordinating conjunction.'] },
  { id: 'p-dash-005', rule: 'dash', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence uses the dash appropriately?',
    options: ['Three cities—London, Paris, and Tokyo—competed for the bid.', 'Three cities, London, Paris, and Tokyo, competed for the bid.', 'Three cities-London, Paris, and Tokyo-competed for the bid.'],
    correctIndex: 0,
    explanations: ['Correct. Dashes emphasize the appositive list more than commas would.', 'While grammatically acceptable, commas provide less emphasis.', 'Hyphens are too short; em dashes are the correct mark here.'] },

  // ---- APOSTROPHE (8) ----
  { id: 'p-apos-001', rule: 'apostrophe', difficulty: 'beginner', band: 'K-5',
    question: 'Which word uses the apostrophe correctly?',
    options: ['can\'t', 'cant', 'can\' t'],
    correctIndex: 0,
    explanations: ['Correct. The apostrophe replaces the missing letters in "cannot".', 'Without an apostrophe, "cant" is a different word meaning jargon.', 'The apostrophe goes between the letters, not after a space.'] },
  { id: 'p-apos-002', rule: 'apostrophe', difficulty: 'beginner', band: 'K-5',
    question: 'Which shows possession correctly?',
    options: ['the dog\'s bone', 'the dogs bone', 'the dog bone\'s'],
    correctIndex: 0,
    explanations: ['Correct. Add an apostrophe + s for singular possessive.', 'Without the apostrophe, it looks like plural "dogs" modifying "bone".', 'The apostrophe goes after the owner, not after the object.'] },
  { id: 'p-apos-003', rule: 'apostrophe', difficulty: 'intermediate', band: 'K-5',
    question: 'Choose the correct possessive form:',
    options: ['the students\' projects', 'the student\'s projects', 'the students projects'],
    correctIndex: 0,
    explanations: ['Correct. For plural nouns ending in s, add only an apostrophe.', 'This means only one student owns the projects.', 'Without an apostrophe, this looks like a noun modifying another noun.'] },
  { id: 'p-apos-004', rule: 'apostrophe', difficulty: 'beginner', band: '6-8',
    question: 'Which contraction is correct?',
    options: ['They\'re going to the park.', 'Their going to the park.', 'There going to the park.'],
    correctIndex: 0,
    explanations: ['Correct. "They\'re" = "they are".', '"Their" is a possessive pronoun, not a contraction.', '"There" refers to a place, not a contraction.'] },
  { id: 'p-apos-005', rule: 'apostrophe', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence shows possession correctly?',
    options: ['James\'s essay won first prize.', 'James\' essay won first prize.', 'Jame\'s essay won first prize.'],
    correctIndex: 0,
    explanations: ['Correct. For singular names ending in s, add \'s for the possessive.', 'Just an apostrophe is for plural nouns ending in s.', 'The apostrophe goes inside the name, not in the middle of it.'] },
  { id: 'p-apos-006', rule: 'apostrophe', difficulty: 'advanced', band: '6-8',
    question: 'Which is correct?',
    options: ['The children\'s playground is new.', 'The childrens\' playground is new.', 'The childrens playground is new.'],
    correctIndex: 0,
    explanations: ['Correct. Irregular plurals that do not end in s add \'s.', '"Children" is already plural; "childrens" is not a word.', 'Even irregular plurals need an apostrophe to show possession.'] },
  { id: 'p-apos-007', rule: 'apostrophe', difficulty: 'intermediate', band: '9-12',
    question: 'Choose the correct sentence:',
    options: ['Its fur was soft and warm.', 'It\'s fur was soft and warm.', 'Its\' fur was soft and warm.'],
    correctIndex: 0,
    explanations: ['Correct. "Its" (no apostrophe) is the possessive pronoun.', '"It\'s" means "it is" or "it has", not possession.', 'The possessive pronoun "its" never takes an apostrophe.'] },
  { id: 'p-apos-008', rule: 'apostrophe', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence is correct?',
    options: ['The boss\'s decision was final.', 'The boss\' decision was final.', 'The bosses\'s decision was final.'],
    correctIndex: 0,
    explanations: ['Correct. Singular nouns ending in s typically add \'s.', 'Just an apostrophe is usually for plurals, not singulars.', 'The \'s is redundant after a plural apostrophe.'] },

  // ---- QUOTATION MARKS (8) ----
  { id: 'p-quot-001', rule: 'quotation', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence shows dialogue correctly?',
    options: ['She said, "I am hungry."', 'She said "I am hungry."', 'She said, I am hungry.'],
    correctIndex: 0,
    explanations: ['Correct. A comma precedes the quote, and quotation marks enclose the spoken words.', 'A comma is needed before the opening quotation mark.', 'Quotation marks are required around the exact words spoken.'] },
  { id: 'p-quot-002', rule: 'quotation', difficulty: 'intermediate', band: 'K-5',
    question: 'Choose the correctly punctuated sentence:',
    options: ['"Let\'s go!" shouted the coach.', '"Let\'s go! shouted the coach."', 'Let\'s go! shouted the coach.'],
    correctIndex: 0,
    explanations: ['Correct. The exclamation goes inside the quotation marks, and the closing quote comes before the tag.', 'The closing quotation mark must come right after the exclamation mark.', 'Quotation marks are required around the exact words spoken.'] },
  { id: 'p-quot-003', rule: 'quotation', difficulty: 'beginner', band: '6-8',
    question: 'Which sentence punctuates dialogue correctly?',
    options: ['"I finished my homework," said Tom.', '"I finished my homework" said Tom.', '"I finished my homework, said Tom."'],
    correctIndex: 0,
    explanations: ['Correct. A comma before the closing quote separates the dialogue from the tag.', 'A comma is needed before the closing quotation mark.', 'The comma goes inside the quotes, and the closing quote comes after the tag.'] },
  { id: 'p-quot-004', rule: 'quotation', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence uses quotation marks correctly for a title?',
    options: ['My favorite poem is "The Road Not Taken."', 'My favorite poem is The Road Not Taken.', 'My favorite poem is \'The Road Not Taken\'.'],
    correctIndex: 0,
    explanations: ['Correct. Short works like poems use double quotation marks.', 'Titles of short works should be in quotation marks.', 'Single quotes are for quotes within quotes, not for titles.'] },
  { id: 'p-quot-005', rule: 'quotation', difficulty: 'advanced', band: '6-8',
    question: 'Which sentence handles a question in dialogue correctly?',
    options: ['She asked, "Are you coming?"', 'She asked, "Are you coming?"?', 'She asked "Are you coming"?'],
    correctIndex: 0,
    explanations: ['Correct. The question mark goes inside the quotation marks.', 'Only one question mark is needed, inside the quotes.', 'The question mark goes inside, not outside the quotation marks.'] },
  { id: 'p-quot-006', rule: 'quotation', difficulty: 'intermediate', band: '9-12',
    question: 'Choose the correct sentence:',
    options: ['The teacher said, "Read chapter five for homework."', 'The teacher said "Read chapter five for homework."', 'The teacher said, Read chapter five for homework.'],
    correctIndex: 0,
    explanations: ['Correct. A comma introduces the quote, and quotation marks enclose it.', 'A comma is needed before the quotation mark.', 'Quotation marks are required around direct speech.'] },
  { id: 'p-quot-007', rule: 'quotation', difficulty: 'advanced', band: '9-12',
    question: 'Which sentence uses quotes within quotes correctly?',
    options: ['She said, "He told me, \'I quit.\'"', 'She said, "He told me, \"I quit.\""', 'She said, "He told me, I quit."'],
    correctIndex: 0,
    explanations: ['Correct. Single quotation marks are used for a quote within a quote.', 'Double quotes inside double quotes are incorrect; use single quotes for nested quotes.', 'The inner quote must also have quotation marks around it.'] },
  { id: 'p-quot-008', rule: 'quotation', difficulty: 'advanced', band: '9-12',
    question: 'Which is punctuated correctly?',
    options: ['"The title of the article is \'Climate Change and You,\'" she noted.', '"The title of the article is \"Climate Change and You,\"" she noted.', '"The title of the article is \'Climate Change and You,\' she noted."'],
    correctIndex: 0,
    explanations: ['Correct. A title within a quote uses single quotation marks.', 'Use single quotes, not double, for a nested quotation.', 'The outer closing quote must come after the inner one closes.'] },

  // ---- EXCLAMATION (5) ----
  { id: 'p-excl-001', rule: 'exclamation', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence needs an exclamation mark?',
    options: ['That is the biggest dinosaur I have ever seen!', 'That is the biggest dinosaur I have ever seen.', 'That is the biggest dinosaur I have ever seen?'],
    correctIndex: 0,
    explanations: ['Correct. Strong emotion or surprise calls for an exclamation mark.', 'A period is too calm for this excited statement.', 'This is not a question.'] },
  { id: 'p-excl-002', rule: 'exclamation', difficulty: 'beginner', band: 'K-5',
    question: 'Choose the correctly punctuated command:',
    options: ['Stop right there!', 'Stop right there.', 'Stop right there?'],
    correctIndex: 0,
    explanations: ['Correct. An urgent command uses an exclamation mark.', 'A period makes the command sound calm rather than urgent.', 'A question mark is only for questions.'] },
  { id: 'p-excl-003', rule: 'exclamation', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence is punctuated correctly?',
    options: ['Help! I need help!', 'Help? I need help?', 'Help. I need help.'],
    correctIndex: 0,
    explanations: ['Correct. An urgent cry for help uses exclamation marks.', 'This is not a question.', 'Periods are too calm for an emergency.'] },
  { id: 'p-excl-004', rule: 'exclamation', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence correctly uses an exclamation mark?',
    options: ['What an incredible performance that was!', 'What an incredible performance that was.', 'What an incredible performance that was?'],
    correctIndex: 0,
    explanations: ['Correct. "What" exclamations express strong emotion and end with an exclamation mark.', 'An exclamation beginning with "What" should end with an exclamation mark.', 'This is an exclamation, not a question.'] },
  { id: 'p-excl-005', rule: 'exclamation', difficulty: 'advanced', band: '6-8',
    question: 'Which sentence uses exclamation marks appropriately?',
    options: ['I can\'t believe we won the championship!', 'I can\'t believe we won the championship!?!', 'I can\'t believe we won the championship!!'],
    correctIndex: 0,
    explanations: ['Correct. One exclamation mark is sufficient for emphasis.', 'Multiple marks like !?! are informal and not standard.', 'One exclamation mark is standard; double is informal.'] },

  // ---- QUESTION MARK (5) ----
  { id: 'p-ques-001', rule: 'question', difficulty: 'beginner', band: 'K-5',
    question: 'Which sentence is a question?',
    options: ['Where is the library?', 'Where is the library.', 'Where is the library!'],
    correctIndex: 0,
    explanations: ['Correct. Direct questions end with a question mark.', 'A period is for statements, not questions.', 'An exclamation mark shows strong emotion, not a question.'] },
  { id: 'p-ques-002', rule: 'question', difficulty: 'beginner', band: 'K-5',
    question: 'Choose the correctly punctuated sentence:',
    options: ['Can you help me find my book?', 'Can you help me find my book.', 'Can you help me find my book!'],
    correctIndex: 0,
    explanations: ['Correct. This is a direct question and needs a question mark.', 'A question must end with a question mark.', 'This is a request, not an exclamation.'] },
  { id: 'p-ques-003', rule: 'question', difficulty: 'intermediate', band: '6-8',
    question: 'Which sentence is punctuated correctly?',
    options: ['She asked, "What time is it?"', 'She asked, "What time is it."', 'She asked, "What time is it!"'],
    correctIndex: 0,
    explanations: ['Correct. The question mark goes inside the quotation marks.', 'A period is wrong for a question inside quotes.', 'An exclamation mark changes the meaning of the question.'] },
  { id: 'p-ques-004', rule: 'question', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence is correct?',
    options: ['Have you considered the long-term implications?', 'Have you considered the long-term implications.', 'Have you considered the long-term implications!'],
    correctIndex: 0,
    explanations: ['Correct. Direct questions always end with a question mark.', 'This is clearly a question and needs a question mark.', 'An exclamation mark would change the tone unexpectedly.'] },
  { id: 'p-ques-005', rule: 'question', difficulty: 'advanced', band: '9-12',
    question: 'Which is punctuated correctly?',
    options: ['The question is: are we prepared?', 'The question is: are we prepared.', 'The question is, are we prepared!'],
    correctIndex: 0,
    explanations: ['Correct. Even after a colon, if the sentence is a question, it ends with a question mark.', 'The sentence after the colon is a question and needs a question mark.', 'An exclamation mark is incorrect for a question.'] },

  // ---- HYPHEN (5) ----
  { id: 'p-hyph-001', rule: 'hyphen', difficulty: 'beginner', band: '6-8',
    question: 'Which sentence uses a hyphen correctly?',
    options: ['She has a part-time job.', 'She has a part time job.', 'She has a parttime job.'],
    correctIndex: 0,
    explanations: ['Correct. Compound adjectives before a noun are hyphenated.', '"Part time" as separate words is incorrect when modifying a noun.', '"Parttime" should be two hyphenated words.'] },
  { id: 'p-hyph-002', rule: 'hyphen', difficulty: 'intermediate', band: '6-8',
    question: 'Choose the correctly hyphenated sentence:',
    options: ['The eight-year-old girl won the race.', 'The eight year old girl won the race.', 'The eight-year old girl won the race.'],
    correctIndex: 0,
    explanations: ['Correct. Compound numbers used as adjectives are fully hyphenated.', 'All parts of the compound adjective need hyphens.', 'Each part of the compound number needs a hyphen.'] },
  { id: 'p-hyph-003', rule: 'hyphen', difficulty: 'intermediate', band: '9-12',
    question: 'Which sentence is correct?',
    options: ['This is a well-known restaurant.', 'This is a well known restaurant.', 'This is a wellknown restaurant.'],
    correctIndex: 0,
    explanations: ['Correct. "Well-known" is a compound adjective and needs a hyphen.', 'Without the hyphen, "well" and "known" are separate words.', '"Wellknown" is not a single word.'] },
  { id: 'p-hyph-004', rule: 'hyphen', difficulty: 'advanced', band: '9-12',
    question: 'Which uses the hyphen correctly?',
    options: ['The anti-bullying campaign was effective.', 'The antibullying campaign was effective.', 'The anti bullying campaign was effective.'],
    correctIndex: 0,
    explanations: ['Correct. Many prefixes (like anti-) are followed by a hyphen.', 'Some prefixed words are accepted without hyphens, but "anti-bullying" is standard.', 'A space should not separate the prefix from the root word.'] },
  { id: 'p-hyph-005', rule: 'hyphen', difficulty: 'advanced', band: '9-12',
    question: 'Choose the correctly punctuated sentence:',
    options: ['The matter is open to discussion but not yet resolved.', 'The matter is open-to-discussion but not yet resolved.', 'The matter is open to-discussion but not yet resolved.'],
    correctIndex: 0,
    explanations: ['Correct. "Open to discussion" is a phrase, not a compound adjective, so no hyphen is needed.', 'Hyphens are not used in phrases that follow the noun they modify.', 'Hyphens connect compound adjectives, not prepositional phrases.'] },
]

// ============================================================
// Helper Functions
// ============================================================

export function getExercisesByFilter(filter: {
  rules?: PunctRule[]
  difficulty?: Difficulty | 'all'
  band?: GradeBand | 'all'
}): PunctExercise[] {
  let result = PUNCT_EXERCISES
  if (filter.rules && filter.rules.length > 0) {
    result = result.filter(e => filter.rules!.includes(e.rule))
  }
  if (filter.difficulty && filter.difficulty !== 'all') {
    result = result.filter(e => e.difficulty === filter.difficulty)
  }
  if (filter.band && filter.band !== 'all') {
    result = result.filter(e => e.band === filter.band)
  }
  return result
}

export function shuffleExercises(exercises: PunctExercise[]): PunctExercise[] {
  const arr = [...exercises]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getExerciseById(id: string): PunctExercise | undefined {
  return PUNCT_EXERCISES.find(e => e.id === id)
}

export function generateWrongVariants(correctSentence: string, rule: PunctRule): [string, string] {
  const s = correctSentence
  switch (rule) {
    case 'period': {
      if (s.endsWith('.')) {
        const base = s.slice(0, -1)
        if (base.includes('?') || base.includes('what') || base.includes('how') || base.includes('why') || base.includes('when') || base.includes('where') || base.includes('who')) {
          return [base + '!', base + '?']
        }
        return [base + '?', base + '!']
      }
      return [s + '?', s + '!']
    }
    case 'comma': {
      // Remove commas
      const noCommas = s.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim()
      // Add unnecessary comma before conjunction
      const withExtra = s.replace(/\b(and|but|or|so)\b/g, ', $1')
      if (noCommas !== s && withExtra !== s) return [noCommas, withExtra]
      if (noCommas !== s) return [noCommas, s.replace(/,\s*/g, '; ')]
      return [s.replace(/\s+and\s+/, ' and, '), s.replace(/\s+and\s+/, ' and; ')]
    }
    case 'semicolon': {
      const semiIdx = s.indexOf(';')
      if (semiIdx >= 0) {
        const withComma = s.replace(';', ',')
        const withPeriod = s.replace(';', '.') + ' ' + s[semiIdx + 2].toUpperCase() + s.slice(semiIdx + 3)
        return [withComma, withPeriod]
      }
      return [s.replace('.', ','), s.replace('.', ';')]
    }
    case 'colon': {
      const colonIdx = s.indexOf(':')
      if (colonIdx >= 0) {
        return [s.replace(':', ','), s.replace(':', ';')]
      }
      return [s.replace('.', ':'), s.replace('.', ';')]
    }
    case 'dash': {
      const noDash = s.replace(/—/g, ',').replace(/–/g, ',')
      const withParens = s.replace(/—([^\u2014]*)—/, '($1)')
      if (noDash !== s) return [noDash, withParens !== s ? withParens : noDash.replace(/,/, ' ')]
      return [s.replace(/,\s/g, ' '), s.replace(/,\s/g, ' - ')]
    }
    case 'apostrophe': {
      const noApos = s.replace(/'/g, '').replace(/’/g, '')
      const wrongApos = s.replace(/\b(\w+)'(\w+)\b/g, '$1$2')
      if (noApos !== s && wrongApos !== noApos) return [noApos, wrongApos]
      return [noApos, s.replace(/n't/g, ' n\'t').replace(/'s/g, ' s\'')]
    }
    case 'quotation': {
      const noQuotes = s.replace(/"/g, '').replace(/\u201C|\u201D/g, '').replace(/'/g, '')
      const wrongComma = s.replace(/,"\s*/g, ' "').replace(/"\s*,/g, '"')
      if (noQuotes !== s) return [noQuotes, wrongComma !== s ? wrongComma : noQuotes]
      return [s, s]
    }
    case 'exclamation': {
      if (s.endsWith('!')) {
        const base = s.slice(0, -1)
        return [base + '.', base + '?']
      }
      return [s + '.', s + '?']
    }
    case 'question': {
      if (s.endsWith('?')) {
        const base = s.slice(0, -1)
        return [base + '.', base + '!']
      }
      return [s + '.', s + '!']
    }
    case 'hyphen': {
      const noHyph = s.replace(/-/g, ' ')
      const oneWord = s.replace(/-/g, '')
      if (noHyph !== s) return [noHyph, oneWord !== noHyph ? oneWord : noHyph]
      return [s, s]
    }
    default:
      return [s + '?', s + '!']
  }
}
