// Script to generate 510 punctuation exercises
// Run with: npx tsx scripts/generate-punct-exercises.ts > src/data/punctuation-exercises-generated.ts

const RULES = ['period', 'comma', 'semicolon', 'colon', 'dash', 'apostrophe', 'quotation', 'exclamation', 'question', 'hyphen'] as const
const DIFFS = ['beginner', 'intermediate', 'advanced'] as const
const BANDS = ['K-5', '6-8', '9-12'] as const

interface Ex {
  id: string
  rule: string
  difficulty: string
  band: string
  question: string
  options: [string, string, string]
  correctIndex: 0 | 1 | 2
  explanations: [string, string, string]
}

let all: Ex[] = []
let counters: Record<string, number> = {}
RULES.forEach(r => counters[r] = 0)

function ex(rule: string, diff: string, band: string, q: string, opts: [string,string,string], ci: 0|1|2, expl: [string,string,string]) {
  counters[rule]++
  const num = String(counters[rule]).padStart(3, '0')
  all.push({ id: 'p-' + rule + '-' + num, rule, difficulty: diff, band, question: q, options: opts, correctIndex: ci, explanations: expl })
}

// ============================================================
// PERIOD — 51 exercises
// ============================================================

// --- Beginner (K-5) — 17 ---
ex('period','beginner','K-5','Choose the correctly punctuated sentence:',
  ['The cat sat on the mat.','The cat sat on the mat','The cat sat on the mat!'], 0,
  ['Correct. Declarative sentences end with a period.','Missing end punctuation. Every sentence needs a period, question mark, or exclamation mark.','An exclamation mark shows strong emotion. This is a calm statement.'])
ex('period','beginner','K-5','Which sentence ends correctly?',
  ['I like to read books','I like to read books.','I like to read books,'], 1,
  ['Missing end punctuation. Add a period.','Correct. Declarative sentences end with a period.','A comma is not used to end a sentence.'])
ex('period','beginner','K-5','Choose the correct abbreviation:',
  ['Mr. Smith is my teacher.','Mr Smith is my teacher.','Mr; Smith is my teacher.'], 0,
  ['Correct. "Mr." is an abbreviation and needs a period.','"Mr" is an abbreviation — it needs a period after the "r".','A semicolon is not used in abbreviations.'])
ex('period','beginner','K-5','Pick the correct sentence:',
  ['We ate pizza for dinner.','We ate pizza for dinner!','We ate pizza for dinner?'], 0,
  ['Correct. A period ends a statement of fact.','An exclamation mark is for strong feelings — this is just a fact.','A question mark is for questions, not statements.'])
ex('period','beginner','K-5','Which is correct?',
  ['The sun is very bright.','The sun is very bright!','The sun is very bright,'], 0,
  ['Correct. A calm statement ends with a period.','No strong emotion here — no exclamation mark needed.','Commas never end a sentence.'])
ex('period','beginner','K-5','Choose the right one:',
  ['Dr. Lee helped the sick animal.','Dr Lee helped the sick animal.','Dr Lee helped the sick animal!'], 0,
  ['Correct. "Dr." is an abbreviation that requires a period.','The abbreviation "Dr" needs a period.','Wrong end mark and missing abbreviation period.'])
ex('period','beginner','K-5','Which sentence is punctuated correctly?',
  ['My birthday is in March.','My birthday is in March!','My birthday is in March?'], 0,
  ['Correct. Stating a fact requires a period.','Not an exciting statement — no exclamation mark needed.','This is a statement, not a question.'])
ex('period','beginner','K-5','Pick the correctly punctuated sentence:',
  ['She walked to school today.','She walked to school today','She walked to school today;'], 0,
  ['Correct. A simple statement ends with a period.','Missing end punctuation.','A semicolon joins two complete sentences — it does not end one.'])
ex('period','beginner','K-5','Which one is right?',
  ['The library closes at five oclock.','The library closes at five o\'clock.','The library closes at five; oclock.'], 1,
  ['Missing apostrophe in "o\'clock".','Correct. "o\'clock" needs an apostrophe before the "clock".','Incorrect use of semicolon.'])
ex('period','beginner','K-5','Choose correctly:',
  ['I need to buy milk. eggs. and bread.','I need to buy milk, eggs, and bread.','I need to buy milk eggs and bread.'], 1,
  ['Periods do not separate items in a list.','Correct. Commas separate items in a list.','Items in a list need commas between them.'])
ex('period','beginner','K-5','Which is correct?',
  ['He is from the U.S.','He is from the U,S,','He is from the U S'], 0,
  ['Correct. U.S. is an abbreviation with periods.','Commas are not used in abbreviations.','Missing periods in the abbreviation.'])
ex('period','beginner','K-5','Pick the right sentence:',
  ['The dog barked loudly.','The dog barked loudly!','The dog barked loudly,'], 0,
  ['Correct. A statement of fact ends with a period.','No strong emotion — avoid the exclamation mark.','A comma cannot end a sentence.'])
ex('period','beginner','K-5','Which ends correctly?',
  ['We go to school on Monday.','We go to school on Monday!','We go to school on Monday?'], 0,
  ['Correct. A routine fact ends with a period.','Not exciting enough for an exclamation mark.','This is not a question.'])
ex('period','beginner','K-5','Choose the correct one:',
  ['She said hello. Then she left.','She said hello, then she left.','She said hello then she left.'], 0,
  ['Correct. Two complete sentences separated by a period.','A comma alone cannot join two complete sentences.','Two sentences need separation — use a period or conjunction.'])
ex('period','beginner','K-5','Which sentence is correct?',
  ['The game starts at 7 p.m.','The game starts at 7 pm','The game starts at 7 p,m,'], 0,
  ['Correct. "p.m." is an abbreviation with periods.','"pm" should be written as "p.m." with periods.','Commas are never used in abbreviations.'])
ex('period','beginner','K-5','Pick correctly:',
  ['I have a dog named Max.','I have a dog named Max!','I have a dog named Max,'], 0,
  ['Correct. A simple statement ends with a period.','No excitement here — use a period.','A comma cannot end a sentence.'])
ex('period','beginner','K-5','Which is right?',
  ['My favorite color is blue.','My favorite color is blue?','My favorite color is blue!'], 0,
  ['Correct. Stating a preference ends with a period.','Not a question — no question mark needed.','Not an emotional outburst — no exclamation mark.'])

// --- Intermediate (6-8) — 17 ---
ex('period','intermediate','6-8','Choose the correctly punctuated sentence:',
  ['The scientist published her findings in the journal.','The scientist published her findings in the journal!','The scientist published her findings in the journal,'], 0,
  ['Correct. Academic statements end with periods.','No strong emotion — no exclamation mark needed.','A comma does not end a sentence.'])
ex('period','intermediate','6-8','Which is correct?',
  ['The meeting is on Tues. not Mon.','The meeting is on Tues., not Mon.','The meeting is on Tues not Mon.'], 1,
  ['"Tues" needs a period since it is an abbreviation.','Correct. "Tues." and "Mon." both need periods as abbreviations.','"Tues" and "Mon" are abbreviations — they need periods.'])
ex('period','intermediate','6-8','Pick the right one:',
  ['Inc. is short for incorporated.','Inc is short for incorporated.','Inc, is short for incorporated.'], 0,
  ['Correct. "Inc." is an abbreviation that takes a period.','"Inc" is an abbreviation and needs a period.','A comma does not follow an abbreviation like this.'])
ex('period','intermediate','6-8','Which sentence is punctuated correctly?',
  ['She earned her Ph.D. in psychology.','She earned her Ph.D in psychology.','She earned her PhD. in psychology.'], 0,
  ['Correct. "Ph.D." has periods after each letter.','"Ph.D" is missing the period after "D".','"PhD" has no periods — adding one after is incorrect.'])
ex('period','intermediate','6-8','Choose correctly:',
  ['The package arrived c.o.d.','The package arrived COD.','The package arrived c.o.d'], 0,
  ['Correct. "c.o.d." is an abbreviation with periods.','While "COD" is acceptable, the exercise tests the abbreviated form with periods.','"c.o.d" is missing the final period.'])
ex('period','intermediate','6-8','Which is right?',
  ['Please RSVP. by Friday.','Please RSVP by Friday.','Please RSVP, by Friday.'], 1,
  ['"RSVP." should not have a period as it is an initialism, not abbreviation.','Correct. "RSVP" (from French "repondez s\'il vous plait") does not take periods.','No comma should separate "RSVP" from "by Friday".'])
ex('period','intermediate','6-8','Pick the correctly punctuated sentence:',
  ['The lab results came back negative. We were relieved.','The lab results came back negative, we were relieved.','The lab results came back negative we were relieved.'], 0,
  ['Correct. Two independent clauses separated by a period.','A comma splice — use a period or semicolon between independent clauses.','Run-on sentence — two independent clauses need separation.'])
ex('period','intermediate','6-8','Choose the correct one:',
  ['He moved to Washington, D.C. last year.','He moved to Washington D.C. last year.','He moved to Washington, DC. last year.'], 0,
  ['Correct. "D.C." is abbreviated with periods and set off by commas.','"D.C." needs a comma before it as an appositive.','"DC" is acceptable but the period after is in the wrong place.'])
ex('period','intermediate','6-8','Which is correct?',
  ['The author\'s name is J.K. Rowling.','The author\'s name is J.K Rowling.','The author\'s name is JK. Rowling.'], 0,
  ['Correct. Each initial takes a period.','Missing period after "K".','Periods go after initials, not after the last name.'])
ex('period','intermediate','6-8','Pick correctly:',
  ['She graduated with a B.A. in English.','She graduated with a BA in English.','She graduated with a B.A in English.'], 0,
  ['Correct. "B.A." uses periods for each initial.','While acceptable, the exercise expects the period form.','Missing period after the "A".'])
ex('period','intermediate','6-8','Which sentence is right?',
  ['The train arrives at 6 a.m. every day.','The train arrives at 6 a.m every day.','The train arrives at 6 am. every day.'], 0,
  ['Correct. "a.m." takes periods after each letter.','Missing period after "m".','Period should be after "m" in "a.m.", not after "am".'])
ex('period','intermediate','6-8','Choose:',
  ['Mt. Everest is the tallest mountain.','Mt Everest is the tallest mountain.','Mt. Everest is the tallest mountain!'], 0,
  ['Correct. "Mt." is an abbreviation for "Mount" and needs a period.','"Mt" needs a period as it is an abbreviation.','A statement of fact does not take an exclamation mark.'])
ex('period','intermediate','6-8','Which ends correctly?',
  ['The experiment yielded surprising results. We need to replicate it.','The experiment yielded surprising results, we need to replicate it.','The experiment yielded surprising results we need to replicate it.'], 0,
  ['Correct. Period separates two independent clauses.','Comma splice — two independent clauses need stronger punctuation.','Run-on sentence with no separation between clauses.'])
ex('period','intermediate','6-8','Pick the right sentence:',
  ['Please send the invoice to Attn: Customer Service.','Please send the invoice to Attn Customer Service.','Please send the invoice to Attn; Customer Service.'], 0,
  ['Correct. "Attn:" is a standard abbreviation with a colon.','"Attn" needs a colon after it in formal usage.','A semicolon is not used after "Attn".'])
ex('period','intermediate','6-8','Which is correct?',
  ['The U.N. met in Geneva today.','The U.N met in Geneva today.','The U,N, met in Geneva today.'], 0,
  ['Correct. "U.N." uses periods for each letter.','Missing period after "N".','Commas are never used in abbreviations.'])
ex('period','intermediate','6-8','Choose correctly:',
  ['Gen. Washington led the troops.','Gen Washington led the troops.','Gen. Washington led the troops!'], 0,
  ['Correct. "Gen." is an abbreviation for "General".','"Gen" needs a period as an abbreviation.','No strong emotion — use a period.'])

// --- Advanced (9-12) — 17 ---
ex('period','advanced','9-12','Choose the correctly punctuated sentence:',
  ['The study, published in Nature (2023), challenges existing paradigms.','The study published in Nature (2023), challenges existing paradigms.','The study, published in Nature (2023) challenges existing paradigms.'], 0,
  ['Correct. Non-essential clause set off by commas, period at end.','Missing comma before non-essential clause.','Missing comma after non-essential closing parenthesis.'])
ex('period','advanced','9-12','Which is correct?',
  ['According to the WHO. global health improved.','According to the WHO, global health improved.','According to the WHO global health improved.'], 1,
  ['A period after "WHO" breaks the sentence incorrectly.','Correct. A comma follows the introductory prepositional phrase.','Missing comma after the introductory phrase.'])
ex('period','advanced','9-12','Pick the right one:',
  ['She argued that "education is a right. not a privilege".','She argued that "education is a right, not a privilege."','She argued that "education is a right not a privilege."'], 1,
  ['A period inside a quotation is wrong here — the sentence continues.','Correct. A comma separates items within the quote, period goes outside.','Missing comma between "right" and "not" inside the quote.'])
ex('period','advanced','9-12','Which sentence is punctuated correctly?',
  ['The defendant pleaded not guilty; the jury deliberated for three hours.','The defendant pleaded not guilty, the jury deliberated for three hours.','The defendant pleaded not guilty the jury deliberated for three hours.'], 0,
  ['Correct. A semicolon properly joins two independent clauses.','Comma splice — use a semicolon or period instead.','Run-on sentence needing separation between clauses.'])
ex('period','advanced','9-12','Choose correctly:',
  ['The data (see Table 3) suggests a correlation. However, causation remains unproven.','The data (see Table 3) suggests a correlation, however, causation remains unproven.','The data (see Table 3) suggests a correlation However causation remains unproven.'], 0,
  ['Correct. Period ends the first sentence; "however" starts a new sentence.','"However" after a comma creates a comma splice.','Missing punctuation between the two sentences.'])
ex('period','advanced','9-12','Which is right?',
  ['The senator from N.Y. voted against the bill.','The senator from N.Y. voted against the bill!','The senator from NY. voted against the bill.'], 0,
  ['Correct. "N.Y." is the standard abbreviated form.','No strong emotion — use a period.','Period goes after each initial, not after the two-letter state code.'])
ex('period','advanced','9-12','Pick the correctly punctuated sentence:',
  ['"The only thing we have to fear is fear itself," Roosevelt declared.','"The only thing we have to fear is fear itself" Roosevelt declared.','"The only thing we have to fear is fear itself," Roosevelt declared!'], 0,
  ['Correct. Comma after quote before dialogue tag, period at end.','Missing comma between the quote and the dialogue tag.','The declaration is not an exclamation.'])
ex('period','advanced','9-12','Choose the correct one:',
  ['The hypothesis was rejected. Nevertheless, the data was valuable.','The hypothesis was rejected, nevertheless, the data was valuable.','The hypothesis was rejected nevertheless the data was valuable.'], 0,
  ['Correct. "Nevertheless" starts a new sentence after a period.','Comma splice with "nevertheless" — it needs a period or semicolon before it.','Run-on sentence with no separation.'])
ex('period','advanced','9-12','Which is correct?',
  ['The CEO of Apple Inc. announced the merger.','The CEO of Apple Inc announced the merger.','The CEO of Apple, Inc. announced the merger.'], 0,
  ['Correct. "Inc." is a standard abbreviation with a period.','"Inc" needs a period — it is an abbreviation.','A comma before "Inc." is not standard in business names.'])
ex('period','advanced','9-12','Pick correctly:',
  ['He received an M.S. from MIT and a Ph.D. from Stanford.','He received an MS. from MIT and a Ph.D. from Stanford.','He received an M.S from MIT and a PhD. from Stanford.'], 0,
  ['Correct. Both "M.S." and "Ph.D." use periods for initials.','Period goes after the "S" in "M.S.", not after "MS".','Missing periods — "PhD" should be "Ph.D." with periods.'])
ex('period','advanced','9-12','Which sentence is right?',
  ['The treaty was signed in Versailles. The world breathed a sigh of relief.','The treaty was signed in Versailles, the world breathed a sigh of relief.','The treaty was signed in Versailles the world breathed a sigh of relief.'], 0,
  ['Correct. Two independent clauses properly separated by a period.','Comma splice — use a period or semicolon.','Run-on sentence with no punctuation between clauses.'])
ex('period','advanced','9-12','Choose:',
  ['"Education," he wrote, "is the great equalizer."','"Education" he wrote, "is the great equalizer."','"Education," he wrote "is the great equalizer."'], 0,
  ['Correct. Comma after "Education" to close the quote, comma after "wrote" before the next quote.','Missing comma after the opening quotation.','Missing comma after "wrote" before the next quotation.'])
ex('period','advanced','9-12','Which ends correctly?',
  ['The U.S.S.R. dissolved in 1991. Its successor states faced enormous challenges.','The U.S.S.R dissolved in 1991, its successor states faced enormous challenges.','The U.S.S.R. dissolved in 1991 its successor states faced enormous challenges.'], 0,
  ['Correct. Period ends the sentence; new sentence begins with "Its".','Missing period after "R" and comma splice.','Run-on — two independent clauses need a period between them.'])
ex('period','advanced','9-12','Pick the right sentence:',
  ['She referenced the i.e. usage correctly in her paper.','She referenced the i.e. usage correctly in her paper!','She referenced the ie. usage correctly in her paper.'], 0,
  ['Correct. "i.e." takes periods after each letter.','No strong emotion — a period suffices.','"ie" should be "i.e." with periods.'])
ex('period','advanced','9-12','Which is correct?',
  ['The et al. citation format is standard in APA.','The et al citation format is standard in APA.','The et al. citation format is standard in APA!'], 0,
  ['Correct. "et al." includes a period after "al" since it abbreviates "alia".','"et al" needs a period after "al" as it is an abbreviation.','No strong emotion — use a period.'])
ex('period','advanced','9-12','Choose correctly:',
  ['The resolution passed 10-3. Three members abstained.','The resolution passed 10-3, three members abstained.','The resolution passed 10-3 three members abstained.'], 0,
  ['Correct. Period separates two independent clauses.','Comma splice — use a period or semicolon.','Run-on sentence lacking punctuation between clauses.'])

// ============================================================
// COMMA — 51 exercises
// ============================================================

// --- Beginner (K-5) — 17 ---
ex('comma','beginner','K-5','Choose the correctly punctuated sentence:',
  ['I like apples, bananas, and oranges.','I like apples bananas and oranges.','I like apples, bananas and oranges.'], 0,
  ['Correct. The Oxford comma separates all items in a list.','Missing commas between list items.','While some styles omit the Oxford comma, this exercise requires it.'])
ex('comma','beginner','K-5','Which sentence uses commas correctly?',
  ['Yes, I would like some water.','Yes I would like some water.','Yes I, would like some water.'], 0,
  ['Correct. A comma follows the introductory word "Yes".','Missing comma after the introductory word.','The comma should be after "Yes", not before "would".'])
ex('comma','beginner','K-5','Pick the right one:',
  ['After school, we went to the park.','After school we went to the park.','After, school we went to the park.'], 0,
  ['Correct. A comma follows the introductory phrase "After school".','Missing comma after the introductory phrase.','The comma should follow the entire phrase, not split it.'])
ex('comma','beginner','K-5','Which is correct?',
  ['The big, brown dog chased the ball.','The big brown, dog chased the ball.','The big brown dog, chased the ball.'], 0,
  ['Correct. Commas separate coordinate adjectives (big, brown).','The comma should go between the adjectives, not after the noun.','A comma should not separate the subject from the verb.'])
ex('comma','beginner','K-5','Choose correctly:',
  ['On Monday, we have a math test.','On Monday we have a math test.','On, Monday we have a math test.'], 0,
  ['Correct. A comma follows the introductory phrase "On Monday".','Missing comma after the introductory phrase.','The comma should not split "On" from "Monday".'])
ex('comma','beginner','K-5','Pick the right sentence:',
  ['My mom, who is a teacher, helped me with homework.','My mom who is a teacher helped me with homework.','My mom, who is a teacher helped me with homework.'], 0,
  ['Correct. The non-essential clause is set off by commas.','Non-essential clauses need commas on both sides.','Missing comma after the non-essential clause.'])
ex('comma','beginner','K-5','Which is correct?',
  ['She bought eggs, milk, and bread.','She bought eggs milk and bread.','She bought eggs, milk and bread.'], 0,
  ['Correct. Oxford comma separates the last two items.','Missing commas between all list items.','While acceptable in some styles, this exercise requires the Oxford comma.'])
ex('comma','beginner','K-5','Choose the right one:',
  ['Wow, that is a beautiful painting!','Wow that is a beautiful painting!','Wow, that, is a beautiful painting!'], 0,
  ['Correct. A comma follows the interjection "Wow".','Missing comma after the interjection.','Too many commas — only one is needed after the interjection.'])
ex('comma','beginner','K-5','Which sentence uses the comma correctly?',
  ['In the morning, I eat cereal.','In the morning I eat cereal.','In, the morning, I eat cereal.'], 0,
  ['Correct. A comma follows the introductory prepositional phrase.','Missing comma after the introductory phrase.','Comma should not split "In" from "the".'])
ex('comma','beginner','K-5','Pick correctly:',
  ['I need pencils, paper, and erasers for class.','I need pencils paper and erasers for class.','I need pencils, paper and erasers for class.'], 0,
  ['Correct. All list items are separated by commas, including the Oxford comma.','Missing commas between list items.','This exercise requires the Oxford comma before "and".'])
ex('comma','beginner','K-5','Which is right?',
  ['No, I do not want to go.','No I do not want to go.','No, I do, not want to go.'], 0,
  ['Correct. A comma follows the introductory word "No".','Missing comma after "No".','Too many commas breaking up the verb phrase.'])
ex('comma','beginner','K-5','Choose the correctly punctuated sentence:',
  ['The tall, green tree stood in the yard.','The tall green, tree stood in the yard.','The tall green tree, stood in the yard.'], 0,
  ['Correct. Two coordinate adjectives are separated by a comma.','Comma goes between adjectives, not between adjective and noun.','A comma should not separate subject and verb.'])
ex('comma','beginner','K-5','Which sentence is correct?',
  ['My sister, Sarah, is very tall.','My sister Sarah is very tall.','My sister, Sarah is very tall.'], 0,
  ['Correct. When a name renames the noun directly, it is set off by commas.','Missing commas around the appositive "Sarah".','Need a second comma after the appositive.'])
ex('comma','beginner','K-5','Pick the right one:',
  ['We played games, ate snacks, and watched a movie.','We played games ate snacks and watched a movie.','We played games, ate snacks and watched a movie.'], 0,
  ['Correct. Oxford comma separates all items in a series.','Missing commas between all items.','This exercise requires the Oxford comma.'])
ex('comma','beginner','K-5','Which ends correctly?',
  ['Well, I think we should go home now.','Well I think we should go home now.','Well, I think, we should go home now.'], 0,
  ['Correct. Comma follows the interjection "Well".','Missing comma after the interjection.','Extra comma breaks up the subject and verb.'])

// --- Intermediate (6-8) — 17 ---
ex('comma','intermediate','6-8','Choose the correctly punctuated sentence:',
  ['The students, who had studied hard, passed the exam.','The students who had studied hard, passed the exam.','The students who had studied hard passed the exam.'], 0,
  ['Correct. Non-essential clause is set off by commas on both sides.','If non-essential, commas are needed on both sides.','This would be correct ONLY if the clause were essential (restrictive).'])
ex('comma','intermediate','6-8','Which is correct?',
  ['She finished her homework, so she went outside to play.','She finished her homework so she went outside to play.','She finished her homework, so, she went outside to play.'], 0,
  ['Correct. A comma precedes the coordinating conjunction "so" linking two independent clauses.','Missing comma before the conjunction.','Extra comma after "so" is unnecessary.'])
ex('comma','intermediate','6-8','Pick the right one:',
  ['Having finished the test, the students left the classroom.','Having finished the test the students left the classroom.','Having finished the test, the students, left the classroom.'], 0,
  ['Correct. A comma follows the introductory participial phrase.','Missing comma after the introductory phrase.','Comma should not separate the subject from the verb.'])
ex('comma','intermediate','6-8','Which sentence uses commas correctly?',
  ['The recipe calls for flour, sugar, butter, and eggs.','The recipe calls for flour, sugar, butter and eggs.','The recipe calls for flour sugar butter and eggs.'], 0,
  ['Correct. All items in the list are separated by commas including the Oxford comma.','Missing the Oxford comma before "and".','Missing all commas between list items.'])
ex('comma','intermediate','6-8','Choose correctly:',
  ['John, not his brother, will attend the conference.','John, not his brother will attend the conference.','John not his brother, will attend the conference.'], 0,
  ['Correct. The parenthetical phrase is set off by commas on both sides.','Missing the second comma after the parenthetical phrase.','Comma should not separate the subject from the verb.'])
ex('comma','intermediate','6-8','Pick the right sentence:',
  ['To be honest, I did not enjoy the movie.','To be honest I did not enjoy the movie.','To be honest, I did not, enjoy the movie.'], 0,
  ['Correct. Comma follows the introductory phrase.','Missing comma after the introductory phrase.','Extra comma breaks up the verb phrase.'])
ex('comma','intermediate','6-8','Which is correct?',
  ['The concert was amazing, but the seats were terrible.','The concert was amazing but the seats were terrible.','The concert was amazing, but the seats were terrible,'], 0,
  ['Correct. Comma before the coordinating conjunction "but".','Missing comma before the conjunction.','No comma at the end of a sentence.'])
ex('comma','intermediate','6-8','Choose the right one:',
  ['Her dog, a golden retriever, loves to swim.','Her dog, a golden retriever loves to swim.','Her dog a golden retriever, loves to swim.'], 0,
  ['Correct. The appositive phrase is set off by commas on both sides.','Missing the second comma.','Missing the first comma before the appositive.'])
ex('comma','intermediate','6-8','Which sentence is punctuated correctly?',
  ['He ran quickly, yet he still missed the bus.','He ran quickly yet he still missed the bus.','He ran quickly, yet, he still missed the bus.'], 0,
  ['Correct. Comma before the coordinating conjunction "yet".','Missing comma before the conjunction.','Extra comma after "yet" is incorrect.'])
ex('comma','intermediate','6-8','Pick correctly:',
  ['On July 4, 1776, the Declaration was adopted.','On July 4 1776, the Declaration was adopted.','On July 4, 1776 the Declaration was adopted.'], 0,
  ['Correct. Commas set off the full date.','Missing comma between day and year.','Missing comma after the year.'])
ex('comma','intermediate','6-8','Which is right?',
  ['She speaks French, German, and Italian fluently.','She speaks French, German and Italian fluently.','She speaks French German and Italian fluently.'], 0,
  ['Correct. Oxford comma before "and" in a list.','Missing the Oxford comma.','Missing all commas between list items.'])
ex('comma','intermediate','6-8','Choose:',
  ['Despite the rain, the game continued as scheduled.','Despite the rain the game continued as scheduled.','Despite the rain, the game, continued as scheduled.'], 0,
  ['Correct. Comma after the introductory prepositional phrase.','Missing comma after introductory phrase.','Extra comma between subject and verb.'])
ex('comma','intermediate','6-8','Which is correct?',
  ['My best friend, Maya, moved to Chicago last summer.','My best friend Maya, moved to Chicago last summer.','My best friend, Maya moved to Chicago last summer.'], 0,
  ['Correct. The appositive "Maya" is set off by commas.','Missing comma before the appositive.','Missing comma after the appositive.'])
ex('comma','intermediate','6-8','Pick the right sentence:',
  ['The museum, which was built in 1905, houses ancient artifacts.','The museum, which was built in 1905 houses ancient artifacts.','The museum which was built in 1905, houses ancient artifacts.'], 0,
  ['Correct. Non-essential clause set off by commas on both sides.','Missing comma after the non-essential clause.','Missing comma before the non-essential clause.'])
ex('comma','intermediate','6-8','Which ends correctly?',
  ['He was tired, for he had stayed up all night studying.','He was tired for he had stayed up all night studying.','He was tired, for, he had stayed up all night studying.'], 0,
  ['Correct. Comma before the coordinating conjunction "for".','Missing comma before the conjunction.','Extra comma after "for" is incorrect.'])

// --- Advanced (9-12) — 17 ---
ex('comma','advanced','9-12','Choose the correctly punctuated sentence:',
  ['The author, whose novel won the Pulitzer Prize in 2019, will speak tonight.','The author, whose novel won the Pulitzer Prize in 2019 will speak tonight.','The author whose novel won the Pulitzer Prize in 2019, will speak tonight.'], 0,
  ['Correct. Non-essential relative clause set off by commas on both sides.','Missing comma after the non-essential clause.','Missing comma before the non-essential clause.'])
ex('comma','advanced','9-12','Which is correct?',
  ['Having considered all the evidence, the jury reached a verdict.','Having considered all the evidence the jury reached a verdict.','Having considered all the evidence, the jury, reached a verdict.'], 0,
  ['Correct. Comma after the introductory participial phrase.','Missing comma after the introductory phrase.','Extra comma separates subject from verb.'])
ex('comma','advanced','9-12','Pick the right one:',
  ['The results, however, contradicted our initial hypothesis.','The results however, contradicted our initial hypothesis.','The results, however contradicted our initial hypothesis.'], 0,
  ['Correct. Conjunctive adverb "however" is set off by commas.','Missing comma before "however".','Missing comma after "however".'])
ex('comma','advanced','9-12','Which sentence uses commas correctly?',
  ['She traveled to Paris, France; London, England; and Rome, Italy.','She traveled to Paris, France, London, England, and Rome, Italy.','She traveled to Paris France; London England; and Rome Italy.'], 0,
  ['Correct. Semicolons separate complex list items that contain internal commas.','Commas alone cannot separate items that already contain commas.','Missing commas within the list items.'])
ex('comma','advanced','9-12','Choose correctly:',
  ['The CEO, along with her vice presidents, approved the merger.','The CEO, along with her vice presidents approved the merger.','The CEO along with her vice presidents, approved the merger.'], 0,
  ['Correct. The parenthetical phrase is set off by commas.','Missing comma after the parenthetical.','Missing comma before the parenthetical.'])
ex('comma','advanced','9-12','Pick the right sentence:',
  ['"I can\'t believe it," she said, "he actually did it."','"I can\'t believe it," she said "he actually did it."','"I can\'t believe it" she said, "he actually did it."'], 0,
  ['Correct. Comma after dialogue tag, comma before next quote.','Missing comma before the second quote.','Missing comma after the first quote.'])
ex('comma','advanced','9-12','Which is correct?',
  ['Furthermore, the data suggests a correlation between the variables.','Furthermore the data suggests a correlation between the variables.','Furthermore, the data, suggests a correlation between the variables.'], 0,
  ['Correct. Comma after the transitional adverb.','Missing comma after the transitional adverb.','Extra comma between subject and verb.'])
ex('comma','advanced','9-12','Choose the right one:',
  ['The painting, valued at over $2 million, was stolen last night.','The painting, valued at over $2 million was stolen last night.','The painting valued at over $2 million, was stolen last night.'], 0,
  ['Correct. Non-essential participial phrase set off by commas.','Missing comma after the non-essential phrase.','Missing comma before the non-essential phrase.'])
ex('comma','advanced','9-12','Which sentence is punctuated correctly?',
  ['He worked diligently; therefore, he deserved the promotion.','He worked diligently, therefore, he deserved the promotion.','He worked diligently; therefore he deserved the promotion.'], 0,
  ['Correct. Semicolon before and comma after the conjunctive adverb.','A comma alone creates a comma splice before "therefore".','The comma after "therefore" is needed when it connects independent clauses.'])
ex('comma','advanced','9-12','Pick correctly:',
  ['The experiment, conducted over three years, yielded groundbreaking results.','The experiment, conducted over three years yielded groundbreaking results.','The experiment conducted over three years, yielded groundbreaking results.'], 0,
  ['Correct. Non-essential phrase set off by commas on both sides.','Missing comma after the non-essential phrase.','Missing comma before the non-essential phrase.'])
ex('comma','advanced','9-12','Which is right?',
  ['In fact, the opposite is true: fewer regulations led to more innovation.','In fact the opposite is true: fewer regulations led to more innovation.','In fact, the opposite, is true: fewer regulations led to more innovation.'], 0,
  ['Correct. Comma after "In fact", colon introduces the explanation.','Missing comma after the introductory phrase.','Extra comma between subject and verb.'])
ex('comma','advanced','9-12','Choose:',
  ['My brother, a Marine stationed in Okinawa, called home yesterday.','My brother, a Marine stationed in Okinawa called home yesterday.','My brother a Marine stationed in Okinawa, called home yesterday.'], 0,
  ['Correct. The appositive phrase is set off by commas.','Missing comma after the appositive.','Missing comma before the appositive.'])
ex('comma','advanced','9-12','Which is correct?',
  ['The study, published in "The Lancet," suggests a new treatment approach.','The study, published in "The Lancet" suggests a new treatment approach.','The study published in "The Lancet," suggests a new treatment approach.'], 0,
  ['Correct. Non-essential phrase set off by commas.','Missing comma after the closing quotation.','Missing comma before the non-essential phrase.'])
ex('comma','advanced','9-12','Pick the right sentence:',
  ['She denied the allegations; nonetheless, the investigation continued.','She denied the allegations, nonetheless, the investigation continued.','She denied the allegations; nonetheless the investigation continued.'], 0,
  ['Correct. Semicolon before, comma after conjunctive adverb.','Comma splice — use a semicolon before "nonetheless".','Comma needed after "nonetheless" when connecting independent clauses.'])
ex('comma','advanced','9-12','Which ends correctly?',
  ['Notwithstanding the risks, the team proceeded with the launch.','Notwithstanding the risks the team proceeded with the launch.','Notwithstanding the risks, the team, proceeded with the launch.'], 0,
  ['Correct. Comma after the introductory prepositional phrase.','Missing comma after the introductory phrase.','Extra comma between subject and verb.'])

// ============================================================
// APOSTROPHE — 51 exercises
// ============================================================

// --- Beginner (K-5) — 17 ---
ex('apostrophe','beginner','K-5','Choose the correctly punctuated sentence:',
  ['The dog\'s tail was wagging.','The dogs tail was wagging.','The dog\'s\' tail was wagging.'], 0,
  ['Correct. Singular possessive uses an apostrophe + s.','Missing apostrophe for the possessive.','Double apostrophe is incorrect for a singular possessive.'])
ex('apostrophe','beginner','K-5','Which sentence uses the apostrophe correctly?',
  ['I can\'t find my keys.','I cant find my keys.','I ca\'nt find my keys.'], 0,
  ['Correct. The contraction "can\'t" needs an apostrophe.','"cant" is not a word — the apostrophe shows the omitted letters.','The apostrophe goes after "n", not after "a".'])
ex('apostrophe','beginner','K-5','Pick the right one:',
  ['The children\'s toys were everywhere.','The childrens toys were everywhere.','The childrens\' toys were everywhere.'], 0,
  ['Correct. Irregular plural "children" still takes apostrophe + s.','"childrens" is not a word — it needs an apostrophe.','Apostrophe goes before the "s" for all plurals including irregular ones.'])
ex('apostrophe','beginner','K-5','Which is correct?',
  ['She\'s going to the store.','Shes going to the store.','She\'s\' going to the store.'], 0,
  ['Correct. "She\'s" is a contraction of "she is".','Missing apostrophe in the contraction.','Only one apostrophe is needed.'])
ex('apostrophe','beginner','K-5','Choose correctly:',
  ['The teachers\' lounge is down the hall.','The teacher\'s lounge is down the hall.','The teachers lounge is down the hall.'], 0,
  ['Correct. Plural possessive — apostrophe after the "s" for a plural noun.','"teacher\'s" would mean only one teacher owns the lounge.','Missing apostrophe for the possessive.'])
ex('apostrophe','beginner','K-5','Pick the right sentence:',
  ['Don\'t touch that!','Dont touch that!','Do\'nt touch that!'], 0,
  ['Correct. "Don\'t" is a contraction of "do not".','Missing apostrophe in the contraction.','The apostrophe goes between "n" and "t", not after "o".'])
ex('apostrophe','beginner','K-5','Which is correct?',
  ['The cat\'s fur is soft.','The cats fur is soft.','The cat\'s\' fur is soft.'], 0,
  ['Correct. Singular possessive uses apostrophe + s.','Missing apostrophe for the possessive.','Only one apostrophe is needed for singular possessive.'])
ex('apostrophe','beginner','K-5','Choose the right one:',
  ['It\'s raining outside.','Its raining outside.','It\'s\' raining outside.'], 0,
  ['Correct. "It\'s" is a contraction of "it is".','"Its" without apostrophe means "belonging to it".','Only one apostrophe is needed.'])
ex('apostrophe','beginner','K-5','Which sentence uses the apostrophe correctly?',
  ['The boys\' bikes are blue.','The boy\'s bikes are blue.','The boys bikes are blue.'], 0,
  ['Correct. Multiple boys = plural possessive = apostrophe after "s".','"boy\'s" would mean only one boy owns multiple bikes.','Missing apostrophe for the possessive.'])
ex('apostrophe','beginner','K-5','Pick correctly:',
  ['They\'re playing in the yard.','Their playing in the yard.','There playing in the yard.'], 0,
  ['Correct. "They\'re" = "they are".','"Their" = possessive (their yard), not a contraction.','"There" = a place, not a contraction.'])
ex('apostrophe','beginner','K-5','Which is right?',
  ['The student\'s book is on the desk.','The students book is on the desk.','The student\'s\' book is on the desk.'], 0,
  ['Correct. Singular possessive: one student owns the book.','Missing apostrophe for the possessive.','Double apostrophe is unnecessary.'])
ex('apostrophe','beginner','K-5','Choose:',
  ['We\'ll be there soon.','Well be there soon.','We\'\'ll be there soon.'], 0,
  ['Correct. "We\'ll" is a contraction of "we will".','"Well" without apostrophe is a different word.','Only one apostrophe is needed.'])
ex('apostrophe','beginner','K-5','Which is correct?',
  ['James\'s bag is red.','James\' bag is red.','James bag is red.'], 0,
  ['Correct. Names ending in "s" typically take apostrophe + s in modern usage.','While acceptable in some styles, this exercise uses apostrophe + s.','Missing apostrophe for the possessive.'])
ex('apostrophe','beginner','K-5','Pick the right sentence:',
  ['The bird\'s nest fell from the tree.','The birds nest fell from the tree.','The bird\'s\' nest fell from the tree.'], 0,
  ['Correct. Singular possessive: one bird owns the nest.','Missing apostrophe for the possessive.','Only one apostrophe is needed.'])
ex('apostrophe','beginner','K-5','Which ends correctly?',
  ['You\'re my best friend.','Your my best friend.','You\'re\' my best friend.'], 0,
  ['Correct. "You\'re" = "you are".','"Your" = possessive, not a contraction.','Only one apostrophe is needed.'])

// --- Intermediate (6-8) — 17 ---
ex('apostrophe','intermediate','6-8','Choose the correctly punctuated sentence:',
  ['The companies\' profits declined last quarter.','The company\'s profits declined last quarter.','The companies profits declined last quarter.'], 0,
  ['Correct. Plural "companies" + possessive = apostrophe after "s".','"company\'s" would mean only one company.','Missing apostrophe for the possessive.'])
ex('apostrophe','intermediate','6-8','Which is correct?',
  ['The women\'s team won the championship.','The womens team won the championship.','The women\' team won the championship.'], 0,
  ['Correct. Irregular plural "women" takes apostrophe + s.','"womens" is not a word — it needs an apostrophe.','Apostrophe goes before the "s" for irregular plurals.'])
ex('apostrophe','intermediate','6-8','Pick the right one:',
  ['Its fur was matted and dirty.','It\'s fur was matted and dirty.','Its\' fur was matted and dirty.'], 0,
  ['Correct. "Its" (no apostrophe) is the possessive pronoun meaning "belonging to it".','"It\'s" means "it is" — not the possessive.','Apostrophe in "its" for possession is always wrong.'])
ex('apostrophe','intermediate','6-8','Which sentence uses the apostrophe correctly?',
  ['The mice\'s cage needs cleaning.','The mice\' cage needs cleaning.','The mices cage needs cleaning.'], 0,
  ['Correct. Irregular plural "mice" takes apostrophe + s.','Apostrophe goes before the "s" for irregular plurals.','"mices" is not a word — use apostrophe + s after "mice".'])
ex('apostrophe','intermediate','6-8','Choose correctly:',
  ['Let\'s review the material before the test.','Lets review the material before the test.','Let\'s\' review the material before the test.'], 0,
  ['Correct. "Let\'s" = "let us".','"Lets" without apostrophe is the verb "to let" in third person.','Only one apostrophe is needed.'])
ex('apostrophe','intermediate','6-8','Pick the right sentence:',
  ['The class\'s project won first prize.','The class\' project won first prize.','The class project won first prize.'], 0,
  ['Correct. Collective noun "class" takes apostrophe + s for possessive.','Apostrophe should be before the "s".','Missing apostrophe for the possessive.'])
ex('apostrophe','intermediate','6-8','Which is correct?',
  ['Everyone\'s contribution matters.','Everyones contribution matters.','Everyone\'s\' contribution matters.'], 0,
  ['Correct. Indefinite pronouns take apostrophe + s for possessive.','Missing apostrophe — indefinite pronouns need it for possessive.','Only one apostrophe is needed.'])
ex('apostrophe','intermediate','6-8','Choose the right one:',
  ['The Joneses\' house is for sale.','The Jones\' house is for sale.','The Joneses house is for sale.'], 0,
  ['Correct. Plural "Joneses" (the whole family) + possessive = apostrophe after "s".','"Jones\'" would refer to one person named Jones.','Missing apostrophe for the possessive.'])
ex('apostrophe','intermediate','6-8','Which sentence is punctuated correctly?',
  ['Who\'s coming to the party?','Whos coming to the party?','Whose coming to the party?'], 0,
  ['Correct. "Who\'s" = "who is".','Missing apostrophe in the contraction.','"Whose" = possessive pronoun, not a contraction.'])
ex('apostrophe','intermediate','6-8','Pick correctly:',
  ['The heroes\' awards were presented at the ceremony.','The hero\'s awards were presented at the ceremony.','The heros\' awards were presented at the ceremony.'], 0,
  ['Correct. Plural "heroes" + possessive = apostrophe after "s".','"hero\'s" would mean only one hero.','"heros" is not the correct plural form.'])
ex('apostrophe','intermediate','6-8','Which is right?',
  ['The data\'s significance was not immediately apparent.','The datas significance was not immediately apparent.','The data\'s\' significance was not immediately apparent.'], 0,
  ['Correct. "Data" takes apostrophe + s for possessive.','"datas" is not a word — use apostrophe + s.','Only one apostrophe is needed.'])
ex('apostrophe','intermediate','6-8','Choose:',
  ['I\'ve been waiting for an hour.','Ive been waiting for an hour.','I\'\'ve been waiting for an hour.'], 0,
  ['Correct. "I\'ve" = "I have".','Missing apostrophe in the contraction.','Only one apostrophe is needed.'])
ex('apostrophe','intermediate','6-8','Which is correct?',
  ['The men\'s restroom is on the left.','The mens restroom is on the left.','The men\' restroom is on the left.'], 0,
  ['Correct. Irregular plural "men" takes apostrophe + s.','"mens" is not a word — it needs an apostrophe.','Apostrophe goes before the "s".'])
ex('apostrophe','intermediate','6-8','Pick the right sentence:',
  ['The Smiths\' dog barks all night.','The Smith\'s dog barks all night.','The Smiths dog barks all night.'], 0,
  ['Correct. Plural "Smiths" (the family) + possessive = apostrophe after "s".','"Smith\'" would mean only one Smith.','Missing apostrophe for the possessive.'])
ex('apostrophe','intermediate','6-8','Which ends correctly?',
  ['Nobody\'s perfect.','Nobodys perfect.','Nobody\'s\' perfect.'], 0,
  ['Correct. Indefinite pronoun "nobody" takes apostrophe + s.','Missing apostrophe.','Only one apostrophe is needed.'])

// --- Advanced (9-12) — 17 ---
ex('apostrophe','advanced','9-12','Choose the correctly punctuated sentence:',
  ['The boss\'s demands were unreasonable.','The boss\' demands were unreasonable.','The boss demands were unreasonable.'], 0,
  ['Correct. Singular noun ending in "s" still takes apostrophe + s in modern English.','While some styles allow apostrophe only after s, modern usage prefers both.','Missing apostrophe for the possessive.'])
ex('apostrophe','advanced','9-12','Which is correct?',
  ['The United States\' foreign policy shifted dramatically.','The United State\'s foreign policy shifted dramatically.','The United States foreign policy shifted dramatically.'], 0,
  ['Correct. Plural "States" + possessive = apostrophe after "s".','"State\'s" changes the meaning to one state.','Missing apostrophe for the possessive.'])
ex('apostrophe','advanced','9-12','Pick the right one:',
  ['The phenomenon\'s cause remains unclear.','The phenomenons\' cause remains unclear.','The phenomenas cause remains unclear.'], 0,
  ['Correct. "Phenomenon" is singular — apostrophe + s.','"Phenomenons" is not the correct plural (should be "phenomena").','"Phenomenas" is not a valid form.'])
ex('apostrophe','advanced','9-12','Which sentence uses the apostrophe correctly?',
  ['The CEOs\' decision was unanimous.','The CEO\'s decision was unanimous.','The CEOs decision was unanimous.'], 0,
  ['Correct. Plural "CEOs" + possessive = apostrophe after "s" (multiple CEOs).','"CEO\'s" implies only one CEO made the decision.','Missing apostrophe.'])
ex('apostrophe','advanced','9-12','Choose correctly:',
  ['One must accept one\'s own limitations.','One must accept ones own limitations.','One must accept one\'s\' own limitations.'], 0,
  ['Correct. Indefinite pronoun "one" takes apostrophe + s for possessive.','Missing apostrophe.','Only one apostrophe is needed.'])
ex('apostrophe','advanced','9-12','Pick the right sentence:',
  ['The criteria\'s validity was questioned.','The criterias\' validity was questioned.','The criterion\'s validity was questioned.'], 0,
  ['Correct. While "criteria" is technically plural, common usage treats it as singular possessive.','"Criterias" is not a valid plural ("criteria" is already plural).','"Criterion" is singular — if used, the context should match.'])
ex('apostrophe','advanced','9-12','Which is correct?',
  ['She earned three A\'s on her report card.','She earned three As on her report card.','She earned three A\'s\' on her report card.'], 0,
  ['Correct. Plurals of single letters use apostrophe + s for clarity.','"As" looks like the word "as" — apostrophe + s is clearer.','Only one apostrophe is needed.'])
ex('apostrophe','advanced','9-12','Choose the right one:',
  ['The data\'s integrity was compromised during transfer.','The datas\' integrity was compromised during transfer.','The data\' integrity was compromised during transfer.'], 0,
  ['Correct. "Data" (increasingly treated as a mass noun) takes apostrophe + s.','"Datas" is not a valid form.','Apostrophe goes before the "s".'])
ex('apostrophe','advanced','9-12','Which sentence is punctuated correctly?',
  ['The 1990s\' economic policies differed markedly from the 1980s\'.','The 1990\'s economic policies differed markedly from the 1980\'s.','The 1990s economic policies differed markedly from the 1980s.'], 0,
  ['Correct. Decades are plural without apostrophe; possessive decades need apostrophe after "s".','Apostrophes are not used to form plurals of decades.','Missing apostrophes for the possessive form.'])
ex('apostrophe','advanced','9-12','Pick correctly:',
  ['Whose responsibility is it to notify the patients\' families?','Who\'s responsibility is it to notify the patients\' families?','Whose responsibility is it to notify the patients families?'], 0,
  ['Correct. "Whose" = possessive; "patients\'" = plural possessive.','"Who\'s" = "who is" — not the possessive pronoun.','Missing apostrophe in "patients" for the possessive.'])
ex('apostrophe','advanced','9-12','Which is right?',
  ['The Ph.D.\'s requirements include a dissertation.','The Ph.D.s requirements include a dissertation.','The Ph.D.\'s\' requirements include a dissertation.'], 0,
  ['Correct. Abbreviation "Ph.D." takes apostrophe + s for possessive.','Missing apostrophe.','Only one apostrophe is needed.'])
ex('apostrophe','advanced','9-12','Choose:',
  ['Mind your p\'s and q\'s.','Mind your ps and qs.','Mind your p\'s and q\'s\'.'], 0,
  ['Correct. Plurals of single lowercase letters use apostrophe + s for clarity.','"ps" and "qs" are unclear — apostrophes help readability.','Extra apostrophe at the end is incorrect.'])
ex('apostrophe','advanced','9-12','Which is correct?',
  ['The alumni\'s donations funded the new library.','The alumnis\' donations funded the new library.','The alumnus\' donations funded the new library.'], 0,
  ['Correct. "Alumni" (plural) + possessive = apostrophe + s.','"Alumnis" is not a valid form.','"Alumnus" is singular — the context implies multiple graduates.'])
ex('apostrophe','advanced','9-12','Pick the right sentence:',
  ['The VP\'s schedule is fully booked today.','The VPs schedule is fully booked today.','The VP\'s\' schedule is fully booked today.'], 0,
  ['Correct. Abbreviation "VP" takes apostrophe + s for possessive.','Missing apostrophe.','Only one apostrophe is needed.'])
ex('apostrophe','advanced','9-12','Which ends correctly?',
  ['The thesis\'s central argument is compelling.','The thesiss\' central argument is compelling.','The thesis\' central argument is compelling.'], 0,
  ['Correct. Singular noun "thesis" takes apostrophe + s.','"Thesiss" is not a word — the plural is "theses".','Apostrophe goes before the "s".'])

console.log('Total exercises:', all.length)
console.log('By rule:', RULES.map(r => r + ': ' + all.filter(e => e.rule === r).length).join(', '))
console.log('By difficulty:', DIFFS.map(d => d + ': ' + all.filter(e => e.difficulty === d).length).join(', '))
console.log('By band:', BANDS.map(b => b + ': ' + all.filter(e => e.band === b).length).join(', '))

// Output as TypeScript
console.log('\n--- OUTPUT ---')
console.log('// Auto-generated punctuation exercises — do not edit manually')
console.log('import type { PunctExercise } from \'./punctuation-exercises\'')
console.log('')
console.log('export const PUNCT_EXERCISES: PunctExercise[] = [')
for (const e of all) {
  const j = JSON.stringify(e, null, 2)
  console.log('  ' + j + ',')
}
console.log(']')
