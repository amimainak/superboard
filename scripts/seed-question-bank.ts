// ============================================================
// Question Bank Seed Generator — Massive K-12 Question Database
// ============================================================
// Generates thousands of questions across all subjects, grade bands,
// difficulty levels, and test prep categories for Supabase PostgreSQL.
//
// Usage: npx tsx scripts/seed-question-bank.ts
// Requires: DATABASE_URL env var pointing to Supabase PostgreSQL
// ============================================================

import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Types
// ============================================================

interface SeedQuestion {
  subject: string;
  gradeBand: string;
  topic: string;
  difficulty: number;
  curriculum?: string;
  standardCode?: string;
  stem: string;
  answerKey: string;
  solutionSteps?: string;
  distractors?: string;
  questionType: QuestionType;
  tags: string;
  estimatedTimeSec?: number;
  testTypeName?: string;
}

// ============================================================
// Utility Functions
// ============================================================

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeDistractors(correct: string, wrongPool: string[], count: number = 3): string {
  const filtered = wrongPool.filter(w => w !== correct);
  return JSON.stringify(shuffle(filtered).slice(0, count));
}

function makeSolutionSteps(steps: string[]): string {
  return JSON.stringify(steps);
}

// ============================================================
// MATH QUESTION GENERATORS
// ============================================================

function generateMathK2(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];
  const topics = [
    { name: 'Counting', gen: genCounting },
    { name: 'Addition', gen: genAdditionK2 },
    { name: 'Subtraction', gen: genSubtractionK2 },
    { name: 'Shapes', gen: genShapesK2 },
    { name: 'Patterns', gen: genPatternsK2 },
    { name: 'Measurement', gen: genMeasurementK2 },
    { name: 'Comparing Numbers', gen: genComparingK2 },
    { name: 'Time', gen: genTimeK2 },
    { name: 'Money', gen: genMoneyK2 },
    { name: 'Place Value', gen: genPlaceValueK2 },
  ];

  for (const topic of topics) {
    for (let i = 0; i < 50; i++) {
      questions.push(topic.gen());
    }
  }
  return questions;
}

function genCounting(): SeedQuestion {
  const count = randInt(1, 20);
  const item = pick(['apples', 'stars', 'blocks', 'pencils', 'birds', 'cookies', 'flowers']);
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Counting',
    difficulty: count <= 5 ? 1 : count <= 10 ? 2 : 3,
    curriculum: 'CCSS', standardCode: `CCSS.MATH.CONTENT.K.CC.B.${count <= 5 ? '4' : '5'}`,
    stem: `How many ${item} are there? Count: ${'● '.repeat(count).trim()}`,
    answerKey: String(count),
    distractors: makeDistractors(String(count), Array.from({length: 20}, (_, i) => String(i + 1))),
    questionType: 'MCQ', tags: 'counting,early-math,visual', estimatedTimeSec: 30,
  };
}

function genAdditionK2(): SeedQuestion {
  const a = randInt(0, 20);
  const b = randInt(0, 20);
  const sum = a + b;
  const item1 = pick(['cats', 'dogs', 'marbles', 'crayons', 'stickers']);
  const item2 = pick(['more', 'additional']);
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Addition',
    difficulty: sum <= 10 ? 1 : sum <= 15 ? 2 : 3,
    curriculum: 'CCSS', standardCode: sum <= 10 ? 'CCSS.MATH.CONTENT.K.OA.A.5' : 'CCSS.MATH.CONTENT.1.OA.C.6',
    stem: `Sam has ${a} ${item1}. Then Sam gets ${b} ${item2} ${item1}. How many ${item1} does Sam have now?`,
    answerKey: String(sum),
    solutionSteps: makeSolutionSteps([`${a} + ${b} = ?`, `Start with ${a}`, `Add ${b} more`, `${a} + ${b} = ${sum}`]),
    distractors: makeDistractors(String(sum), [String(a), String(b), String(a - b >= 0 ? a - b : 0), String(sum + 1), String(sum - 1 >= 0 ? sum - 1 : 0)]),
    questionType: 'MCQ', tags: 'addition,word-problem,operations', estimatedTimeSec: 60,
  };
}

function genSubtractionK2(): SeedQuestion {
  const total = randInt(5, 20);
  const remove = randInt(1, total);
  const diff = total - remove;
  const item = pick(['cookies', 'balloons', 'toys', 'coins', 'candies']);
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Subtraction',
    difficulty: total <= 10 ? 1 : 2,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.1.OA.A.1',
    stem: `Maria had ${total} ${item}. She gave away ${remove} ${item}. How many ${item} does Maria have left?`,
    answerKey: String(diff),
    solutionSteps: makeSolutionSteps([`${total} - ${remove} = ?`, `Start with ${total}`, `Take away ${remove}`, `${total} - ${remove} = ${diff}`]),
    distractors: makeDistractors(String(diff), [String(total), String(remove), String(total + remove), String(diff + 2)]),
    questionType: 'MCQ', tags: 'subtraction,word-problem,operations', estimatedTimeSec: 60,
  };
}

function genShapesK2(): SeedQuestion {
  const shapes = ['circle', 'square', 'triangle', 'rectangle', 'hexagon', 'diamond', 'oval'];
  const shape = pick(shapes);
  const sides = { circle: 0, square: 4, triangle: 3, rectangle: 4, hexagon: 6, diamond: 4, oval: 0 };
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Shapes',
    difficulty: 1,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.K.G.A.2',
    stem: `How many sides does a ${shape} have?`,
    answerKey: String(sides[shape as keyof typeof sides]),
    distractors: makeDistractors(String(sides[shape as keyof typeof sides]), ['0', '3', '4', '5', '6']),
    questionType: 'MCQ', tags: 'geometry,shapes,properties', estimatedTimeSec: 20,
  };
}

function genPatternsK2(): SeedQuestion {
  const patterns = ['2, 4, 6, 8, ___', '1, 3, 5, 7, ___', '5, 10, 15, 20, ___', '3, 6, 9, 12, ___'];
  const answers = ['10', '9', '25', '15'];
  const rules = ['Add 2 each time', 'Add 2 each time (odd numbers)', 'Add 5 each time', 'Add 3 each time'];
  const idx = randInt(0, patterns.length - 1);
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Patterns',
    difficulty: 2,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.1.OA.C.5',
    stem: `What number comes next in the pattern?\n${patterns[idx]}`,
    answerKey: answers[idx],
    solutionSteps: makeSolutionSteps([`Look at the pattern: ${patterns[idx]}`, `Each number goes up by ${rules[idx].match(/\d+/)?.[0]}`, rules[idx], `The next number is ${answers[idx]}`]),
    distractors: makeDistractors(answers[idx], ['11', '12', '14', '16', '18', '20', '21', '26', '30', '8', '13', '17']),
    questionType: 'MCQ', tags: 'patterns,sequences,number-sense', estimatedTimeSec: 45,
  };
}

function genMeasurementK2(): SeedQuestion {
  const item = pick(['pencil', 'book', 'desk', 'eraser', 'ruler']);
  const unit = pick(['inches', 'centimeters']);
  const length = randInt(2, 12);
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Measurement',
    difficulty: 1,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.1.MD.A.2',
    stem: `A ${item} is ${length} ${unit} long. What is its length?`,
    answerKey: `${length} ${unit}`,
    distractors: makeDistractors(`${length} ${unit}`, [`${length + 1} ${unit}`, `${length - 1} ${unit}`, `${length + 2} ${unit}`]),
    questionType: 'MCQ', tags: 'measurement,length,units', estimatedTimeSec: 30,
  };
}

function genComparingK2(): SeedQuestion {
  const a = randInt(1, 50);
  const b = randInt(1, 50);
  const answer = a > b ? `${a} is greater than ${b}` : a < b ? `${b} is greater than ${a}` : 'They are equal';
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Comparing Numbers',
    difficulty: a < 20 && b < 20 ? 1 : 2,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.1.NBT.B.3',
    stem: `Which number is greater: ${a} or ${b}?`,
    answerKey: answer,
    distractors: makeDistractors(answer, [`${a} is greater than ${b}`, `${b} is greater than ${a}`, 'They are equal']),
    questionType: 'MCQ', tags: 'comparing,numbers,greater-than', estimatedTimeSec: 30,
  };
}

function genTimeK2(): SeedQuestion {
  const hours = randInt(1, 12);
  const mins = pick([0, 15, 30, 45]);
  const period = pick(['AM', 'PM']);
  const display = mins === 0 ? `${hours}:00` : `${hours}:${String(mins).padStart(2, '0')}`;
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Time',
    difficulty: mins === 0 ? 1 : 2,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.1.MD.B.3',
    stem: `What time does the clock show? The short hand points to ${hours} and the long hand points to ${mins === 0 ? '12' : String(mins / 5 + 1)}.`,
    answerKey: `${display} ${period}`,
    distractors: makeDistractors(`${display} ${period}`, [`${hours + 1}:${String(mins).padStart(2, '0')} ${period}`, `${display} ${period === 'AM' ? 'PM' : 'AM'}`]),
    questionType: 'MCQ', tags: 'time,clocks,reading-time', estimatedTimeSec: 45,
  };
}

function genMoneyK2(): SeedQuestion {
  const quarters = randInt(0, 3);
  const dimes = randInt(0, 3);
  const nickels = randInt(0, 3);
  const pennies = randInt(0, 4);
  const total = quarters * 25 + dimes * 10 + nickels * 5 + pennies;
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Money',
    difficulty: total <= 50 ? 1 : 2,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.2.MD.C.8',
    stem: `You have ${quarters} quarter(s), ${dimes} dime(s), ${nickels} nickel(s), and ${pennies} penny/pennies. How much money do you have in total?`,
    answerKey: `$${(total / 100).toFixed(2)}`,
    solutionSteps: makeSolutionSteps([`${quarters} quarters = $${(quarters * 25 / 100).toFixed(2)}`, `${dimes} dimes = $${(dimes * 10 / 100).toFixed(2)}`, `${nickels} nickels = $${(nickels * 5 / 100).toFixed(2)}`, `${pennies} pennies = $${(pennies / 100).toFixed(2)}`, `Total = $${(total / 100).toFixed(2)}`]),
    distractors: makeDistractors(`$${(total / 100).toFixed(2)}`, [`$${((total + 5) / 100).toFixed(2)}`, `$${((total - 5) / 100).toFixed(2)}`, `$${((total + 10) / 100).toFixed(2)}`]),
    questionType: 'MCQ', tags: 'money,coins,counting', estimatedTimeSec: 60,
  };
}

function genPlaceValueK2(): SeedQuestion {
  const num = randInt(10, 99);
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return {
    subject: 'MATH', gradeBand: 'K-2', topic: 'Place Value',
    difficulty: num < 30 ? 1 : 2,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.1.NBT.B.2',
    stem: `What is the value of the tens digit in the number ${num}?`,
    answerKey: String(tens * 10),
    distractors: makeDistractors(String(tens * 10), [String(tens), String(ones), String(ones * 10), String(num)]),
    questionType: 'MCQ', tags: 'place-value,tens,ones', estimatedTimeSec: 30,
  };
}

// ============================================================
// Math 3-5
// ============================================================

function generateMath35(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];
  const topics = [
    { name: 'Multiplication', gen: genMultiplication35 },
    { name: 'Division', gen: genDivision35 },
    { name: 'Fractions', gen: genFractions35 },
    { name: 'Decimals', gen: genDecimals35 },
    { name: 'Area and Perimeter', gen: genAreaPerimeter35 },
    { name: 'Word Problems', gen: genWordProblems35 },
    { name: 'Rounding', gen: genRounding35 },
    { name: 'Factors and Multiples', gen: genFactors35 },
  ];

  for (const topic of topics) {
    for (let i = 0; i < 120; i++) {
      questions.push(topic.gen());
    }
  }
  return questions;
}

function genMultiplication35(): SeedQuestion {
  const a = randInt(2, 12);
  const b = randInt(2, 12);
  const product = a * b;
  const items = pick(['bags of marbles (each has', 'boxes of crayons (each has', 'packs of cards (each has', 'rows of chairs (each row has')];
  return {
    subject: 'MATH', gradeBand: '3-5', topic: 'Multiplication',
    difficulty: a <= 5 && b <= 5 ? 2 : a <= 9 && b <= 9 ? 3 : 4,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.3.OA.A.1',
    stem: `There are ${b} ${items} ${a} items). How many items in total?`,
    answerKey: String(product),
    solutionSteps: makeSolutionSteps([`We need to multiply: ${a} × ${b}`, `${a} groups of ${b}`, `${a} × ${b} = ${product}`]),
    distractors: makeDistractors(String(product), [String(a + b), String(a * b + a), String(a * b - a), String(Math.abs(a - b) * 10)]),
    questionType: 'MCQ', tags: 'multiplication,word-problem,times-tables', estimatedTimeSec: 60,
  };
}

function genDivision35(): SeedQuestion {
  const b = randInt(2, 12);
  const quotient = randInt(2, 12);
  const a = b * quotient;
  return {
    subject: 'MATH', gradeBand: '3-5', topic: 'Division',
    difficulty: a <= 30 ? 2 : a <= 60 ? 3 : 4,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.3.OA.A.2',
    stem: `${a} items are divided equally into ${b} groups. How many items are in each group?`,
    answerKey: String(quotient),
    solutionSteps: makeSolutionSteps([`Divide ${a} by ${b}`, `${a} ÷ ${b} = ?`, `${b} × ${quotient} = ${a}`, `So ${a} ÷ ${b} = ${quotient}`]),
    distractors: makeDistractors(String(quotient), [String(a), String(b), String(a + b), String(quotient + 1)]),
    questionType: 'MCQ', tags: 'division,sharing,word-problem', estimatedTimeSec: 60,
  };
}

function genFractions35(): SeedQuestion {
  const denoms = [2, 3, 4, 5, 6, 8, 10, 12];
  const denom = pick(denoms);
  const num = randInt(1, denom - 1);
  const frac = `${num}/${denom}`;
  const scenarios = [
    { stem: `What fraction of the shape is shaded if ${num} out of ${denom} equal parts are colored?`, answer: frac },
    { stem: `Simplify or identify: what is ${num}/${denom} as a fraction of a whole?`, answer: frac },
    { stem: `If you eat ${num} out of ${denom} equal slices of pizza, what fraction did you eat?`, answer: frac },
  ];
  const s = pick(scenarios);
  return {
    subject: 'MATH', gradeBand: '3-5', topic: 'Fractions',
    difficulty: denom <= 4 ? 2 : denom <= 8 ? 3 : 4,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.3.NF.A.1',
    stem: s.stem, answerKey: s.answer,
    distractors: makeDistractors(frac, [`${denom}/${num}`, `${num - 1}/${denom}`, `${num}/${denom + 1}`, `${num + 1}/${denom}`]),
    questionType: 'MCQ', tags: 'fractions,parts-of-a-whole,numerator-denominator', estimatedTimeSec: 45,
  };
}

function genDecimals35(): SeedQuestion {
  const a = (randInt(10, 99) / 10);
  const b = (randInt(10, 99) / 10);
  const op = pick(['+', '-']);
  const result = op === '+' ? +(a + b).toFixed(1) : +(a - b).toFixed(1);
  return {
    subject: 'MATH', gradeBand: '3-5', topic: 'Decimals',
    difficulty: 3,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.5.NBT.B.7',
    stem: `Calculate: ${a} ${op} ${b}`,
    answerKey: String(result),
    solutionSteps: makeSolutionSteps([`Line up the decimals: ${a} ${op} ${b}`, `Calculate: ${op === '+' ? a + b : a - b}`, `Result: ${result}`]),
    distractors: makeDistractors(String(result), [String(+(result + 0.1).toFixed(1)), String(+(result - 0.1).toFixed(1)), String(a + b + 0.2)]),
    questionType: 'MCQ', tags: 'decimals,addition-subtraction,decimal-operations', estimatedTimeSec: 60,
  };
}

function genAreaPerimeter35(): SeedQuestion {
  const type = pick(['area', 'perimeter']);
  const l = randInt(3, 15);
  const w = randInt(3, 15);
  const answer = type === 'area' ? l * w : 2 * (l + w);
  return {
    subject: 'MATH', gradeBand: '3-5', topic: 'Area and Perimeter',
    difficulty: l * w <= 50 ? 2 : 3,
    curriculum: 'CCSS', standardCode: type === 'area' ? 'CCSS.MATH.CONTENT.3.MD.C.7' : 'CCSS.MATH.CONTENT.3.MD.D.8',
    stem: `A rectangle has a length of ${l} units and a width of ${w} units. What is the ${type}?`,
    answerKey: String(answer),
    solutionSteps: makeSolutionSteps([type === 'area' ? `${type} = length × width` : `${type} = 2 × (length + width)`, `${type === 'area' ? `${l} × ${w}` : `2 × (${l} + ${w})`}`, `= ${answer} square units`]),
    distractors: makeDistractors(String(answer), [String(l * w), String(2 * (l + w)), String(l + w), String(answer + l)]),
    questionType: 'MCQ', tags: `${type},geometry,rectangles`, estimatedTimeSec: 60,
  };
}

function genWordProblems35(): SeedQuestion {
  const type = pick(['multi-step', 'comparison', 'extra-info']);
  if (type === 'multi-step') {
    const a = randInt(5, 20);
    const b = randInt(3, 10);
    const c = randInt(2, 8);
    const answer = a + b - c;
    return {
      subject: 'MATH', gradeBand: '3-5', topic: 'Word Problems',
      difficulty: 4,
      curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.4.OA.A.3',
      stem: `A store had ${a} notebooks. They received ${b} more notebooks, then sold ${c} notebooks. How many notebooks are left?`,
      answerKey: String(answer),
      solutionSteps: makeSolutionSteps([`Start: ${a} notebooks`, `Add ${b} more: ${a} + ${b} = ${a + b}`, `Subtract ${c} sold: ${a + b} - ${c} = ${answer}`]),
      distractors: makeDistractors(String(answer), [String(a + b), String(a - c), String(a + b + c)]),
      questionType: 'MCQ', tags: 'word-problem,multi-step,operations', estimatedTimeSec: 90,
    };
  } else if (type === 'comparison') {
    const a = randInt(10, 50);
    const b = randInt(10, 50);
    const diff = Math.abs(a - b);
    return {
      subject: 'MATH', gradeBand: '3-5', topic: 'Word Problems',
      difficulty: 3,
      curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.4.OA.A.2',
      stem: `Team A scored ${a} points. Team B scored ${b} points. How many more points did the winning team score?`,
      answerKey: String(diff),
      distractors: makeDistractors(String(diff), [String(a + b), String(a), String(b)]),
      questionType: 'MCQ', tags: 'word-problem,comparison,difference', estimatedTimeSec: 60,
    };
  }
  // extra-info
  const a = randInt(3, 12);
  const b = randInt(2, 8);
  const extra = randInt(10, 30);
  const answer = a * b;
  return {
    subject: 'MATH', gradeBand: '3-5', topic: 'Word Problems',
    difficulty: 4,
    stem: `Each box contains ${a} toy cars. There are ${b} boxes. The boxes cost $${extra} total. How many toy cars are there in all?`,
    answerKey: String(answer),
    solutionSteps: makeSolutionSteps([`Ignore the cost — we need total toy cars`, `Each box has ${a} cars`, `${b} boxes`, `${a} × ${b} = ${answer}`]),
    distractors: makeDistractors(String(answer), [String(extra), String(a + b), String(extra + a)]),
    questionType: 'MCQ', tags: 'word-problem,extra-information,multiplication', estimatedTimeSec: 90,
  };
}

function genRounding35(): SeedQuestion {
  const num = randInt(10, 999);
  const place = pick(['nearest 10', 'nearest 100']);
  const rounded = place === 'nearest 10' ? Math.round(num / 10) * 10 : Math.round(num / 100) * 100;
  return {
    subject: 'MATH', gradeBand: '3-5', topic: 'Rounding',
    difficulty: num < 100 ? 2 : 3,
    curriculum: 'CCSS', standardCode: place === 'nearest 10' ? 'CCSS.MATH.CONTENT.3.NBT.A.1' : 'CCSS.MATH.CONTENT.4.NBT.A.3',
    stem: `Round ${num} to the ${place}.`,
    answerKey: String(rounded),
    solutionSteps: makeSolutionSteps([`Look at the digit ${place === 'nearest 10' ? 'to the right of the tens place' : 'to the right of the hundreds place'}`, `If it is 5 or more, round up`, `If less than 5, round down`, `${num} rounded to ${place} = ${rounded}`]),
    distractors: makeDistractors(String(rounded), [String(rounded + 10), String(rounded - 10), String(num)]),
    questionType: 'MCQ', tags: 'rounding,estimation,place-value', estimatedTimeSec: 45,
  };
}

function genFactors35(): SeedQuestion {
  const num = pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 48]);
  const factor = pick([2, 3, 4, 5, 6]);
  const isFactor = num % factor === 0;
  return {
    subject: 'MATH', gradeBand: '3-5', topic: 'Factors and Multiples',
    difficulty: 3,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.4.OA.B.4',
    stem: `Is ${factor} a factor of ${num}?`,
    answerKey: isFactor ? 'Yes' : 'No',
    solutionSteps: makeSolutionSteps([`${num} ÷ ${factor} = ${num / factor}`, num % factor === 0 ? 'There is no remainder, so yes' : `There is a remainder of ${num % factor}, so no`]),
    distractors: makeDistractors(isFactor ? 'Yes' : 'No', ['Yes', 'No']),
    questionType: 'TRUE_FALSE', tags: 'factors,multiples,divisibility', estimatedTimeSec: 30,
  };
}

// ============================================================
// Math 6-8
// ============================================================

function generateMath68(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];
  const topics = [
    { name: 'Ratios and Proportions', gen: genRatios68 },
    { name: 'Pre-Algebra', gen: genPreAlgebra68 },
    { name: 'Geometry', gen: genGeometry68 },
    { name: 'Statistics', gen: genStatistics68 },
    { name: 'Probability', gen: genProbability68 },
    { name: 'Integers', gen: genIntegers68 },
    { name: 'Percents', gen: genPercents68 },
    { name: 'Equations', gen: genEquations68 },
  ];

  for (const topic of topics) {
    for (let i = 0; i < 120; i++) {
      questions.push(topic.gen());
    }
  }
  return questions;
}

function genRatios68(): SeedQuestion {
  const a = randInt(2, 12);
  const b = randInt(2, 12);
  const scale = randInt(2, 5);
  const answer = a * scale;
  const scenarios = [
    `A recipe calls for ${a} cups of flour for every ${b} cups of sugar. If you use ${answer} cups of flour, how many cups of sugar do you need?`,
    `The ratio of boys to girls in a class is ${a}:${b}. If there are ${answer} boys, how many girls are there?`,
  ];
  return {
    subject: 'MATH', gradeBand: '6-8', topic: 'Ratios and Proportions',
    difficulty: 3,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.6.RP.A.3',
    stem: pick(scenarios),
    answerKey: String(b * scale),
    solutionSteps: makeSolutionSteps([`Ratio is ${a}:${b}`, `Scale factor: ${answer} ÷ ${a} = ${scale}`, `Missing value: ${b} × ${scale} = ${b * scale}`]),
    distractors: makeDistractors(String(b * scale), [String(b), String(a * b), String(b * scale + b)]),
    questionType: 'MCQ', tags: 'ratios,proportions,scale', estimatedTimeSec: 90,
  };
}

function genPreAlgebra68(): SeedQuestion {
  const x = randInt(-10, 10);
  const a = randInt(2, 8);
  const b = a * x;
  return {
    subject: 'MATH', gradeBand: '6-8', topic: 'Pre-Algebra',
    difficulty: Math.abs(x) <= 5 ? 3 : 4,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.6.EE.B.5',
    stem: `Solve for x: ${a}x = ${b}`,
    answerKey: String(x),
    solutionSteps: makeSolutionSteps([`${a}x = ${b}`, `Divide both sides by ${a}`, `x = ${b} ÷ ${a}`, `x = ${x}`]),
    distractors: makeDistractors(String(x), [String(-x), String(x + 1), String(b)]),
    questionType: 'MCQ', tags: 'pre-algebra,solve-for-x,equations', estimatedTimeSec: 60,
  };
}

function genGeometry68(): SeedQuestion {
  const type = pick(['triangle-angle-sum', 'circle-area', 'angle-types']);
  if (type === 'triangle-angle-sum') {
    const a = randInt(30, 120);
    const b = randInt(20, 150 - a);
    const c = 180 - a - b;
    return {
      subject: 'MATH', gradeBand: '6-8', topic: 'Geometry',
      difficulty: 3,
      curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.8.G.A.5',
      stem: `A triangle has angles measuring ${a}° and ${b}°. What is the measure of the third angle?`,
      answerKey: `${c}°`,
      solutionSteps: makeSolutionSteps(['Triangle angles sum to 180°', `${a} + ${b} + x = 180`, `x = 180 - ${a} - ${b}`, `x = ${c}°`]),
      distractors: makeDistractors(`${c}°`, [`${a + b}°`, `${180 - a}°`, `${180 - b}°`]),
      questionType: 'MCQ', tags: 'geometry,triangles,angle-sum', estimatedTimeSec: 60,
    };
  } else if (type === 'circle-area') {
    const r = randInt(2, 10);
    const area = Math.PI * r * r;
    return {
      subject: 'MATH', gradeBand: '6-8', topic: 'Geometry',
      difficulty: 3,
      curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.7.G.B.4',
      stem: `What is the area of a circle with radius ${r}? (Use π ≈ 3.14)`,
      answerKey: `${(3.14 * r * r).toFixed(2)}`,
      distractors: makeDistractors(`${(3.14 * r * r).toFixed(2)}`, [`${(2 * 3.14 * r).toFixed(2)}`, `${(3.14 * r * r * 2).toFixed(2)}`, String(r * r)]),
      questionType: 'MCQ', tags: 'geometry,circles,area', estimatedTimeSec: 60,
    };
  }
  const angle = randInt(10, 170);
  const types = angle < 90 ? 'acute' : angle === 90 ? 'right' : angle < 180 ? 'obtuse' : 'straight';
  return {
    subject: 'MATH', gradeBand: '6-8', topic: 'Geometry',
    difficulty: 2,
    stem: `An angle measures ${angle}°. What type of angle is this?`,
    answerKey: types,
    distractors: makeDistractors(types, ['acute', 'right', 'obtuse', 'straight', 'reflex']),
    questionType: 'MCQ', tags: 'geometry,angles,classification', estimatedTimeSec: 30,
  };
}

function genStatistics68(): SeedQuestion {
  const nums = Array.from({ length: 6 }, () => randInt(1, 20));
  const mean = (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(1);
  const sorted = [...nums].sort((a, b) => a - b);
  const median = nums.length % 2 === 0 ? ((sorted[2] + sorted[3]) / 2).toFixed(1) : String(sorted[3]);
  return {
    subject: 'MATH', gradeBand: '6-8', topic: 'Statistics',
    difficulty: 3,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.6.SP.B.5',
    stem: `Find the mean of this data set: {${nums.join(', ')}}`,
    answerKey: mean,
    solutionSteps: makeSolutionSteps([`Sum: ${nums.join(' + ')} = ${nums.reduce((s, n) => s + n, 0)}`, `Count: ${nums.length} values`, `Mean = ${nums.reduce((s, n) => s + n, 0)} ÷ ${nums.length} = ${mean}`]),
    distractors: makeDistractors(mean, [median, String(sorted[0]), String(sorted[sorted.length - 1])]),
    questionType: 'MCQ', tags: 'statistics,mean,average,data-analysis', estimatedTimeSec: 90,
  };
}

function genProbability68(): SeedQuestion {
  const colors = ['red', 'blue', 'green', 'yellow'];
  const counts = [randInt(2, 8), randInt(2, 8), randInt(2, 8), randInt(2, 8)];
  const targetIdx = randInt(0, 3);
  const total = counts.reduce((s, c) => s + c, 0);
  const prob = counts[targetIdx] / total;
  return {
    subject: 'MATH', gradeBand: '6-8', topic: 'Probability',
    difficulty: 3,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.7.SP.C.7',
    stem: `A bag contains ${colors.map((c, i) => `${counts[i]} ${c}`).join(', ')} marbles. What is the probability of drawing a ${colors[targetIdx]} marble?`,
    answerKey: `${counts[targetIdx]}/${total}`,
    distractors: makeDistractors(`${counts[targetIdx]}/${total}`, [`${total}/${counts[targetIdx]}`, `${counts[(targetIdx + 1) % 4]}/${total}`, '1/2']),
    questionType: 'MCQ', tags: 'probability,fractions,likelihood', estimatedTimeSec: 60,
  };
}

function genIntegers68(): SeedQuestion {
  const a = randInt(-15, 15);
  const b = randInt(-15, 15);
  const op = pick(['+', '-']);
  const result = op === '+' ? a + b : a - b;
  return {
    subject: 'MATH', gradeBand: '6-8', topic: 'Integers',
    difficulty: Math.abs(a) <= 10 && Math.abs(b) <= 10 ? 2 : 3,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.7.NS.A.1',
    stem: `Evaluate: (${a}) ${op} (${b})`,
    answerKey: String(result),
    solutionSteps: makeSolutionSteps([`(${a}) ${op} (${b})`, op === '+' ? `Same signs: add and keep the sign / Different signs: subtract and keep the sign of the larger` : `Change the sign of the second number and add`, `= ${result}`]),
    distractors: makeDistractors(String(result), [String(-result), String(Math.abs(a) + Math.abs(b)), String(result + 2)]),
    questionType: 'MCQ', tags: 'integers,negative-numbers,operations', estimatedTimeSec: 45,
  };
}

function genPercents68(): SeedQuestion {
  const percent = pick([10, 20, 25, 30, 40, 50, 60, 75]);
  const whole = pick([20, 40, 50, 80, 100, 120, 200, 250, 500]);
  const part = whole * percent / 100;
  const scenarios = [
    `What is ${percent}% of ${whole}?`,
    `${percent}% of the students in a school of ${whole} students brought lunch from home. How many students brought lunch?`,
  ];
  return {
    subject: 'MATH', gradeBand: '6-8', topic: 'Percents',
    difficulty: percent % 25 === 0 ? 2 : 3,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.6.RP.A.3',
    stem: pick(scenarios),
    answerKey: String(part),
    solutionSteps: makeSolutionSteps([`${percent}% of ${whole}`, `= ${percent}/100 × ${whole}`, `= ${part}`]),
    distractors: makeDistractors(String(part), [String(whole), String(whole - part), String(part / 2)]),
    questionType: 'MCQ', tags: 'percents,calculations,applications', estimatedTimeSec: 60,
  };
}

function genEquations68(): SeedQuestion {
  const x = randInt(-10, 10);
  const a = randInt(2, 6);
  const b = randInt(-15, 15);
  const c = a * x + b;
  return {
    subject: 'MATH', gradeBand: '6-8', topic: 'Equations',
    difficulty: 3,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.7.EE.B.4',
    stem: `Solve for x: ${a}x + ${b >= 0 ? b : `(${b})`} = ${c}`,
    answerKey: String(x),
    solutionSteps: makeSolutionSteps([`${a}x + ${b} = ${c}`, `Subtract ${b} from both sides: ${a}x = ${c - b}`, `Divide by ${a}: x = ${c - b} ÷ ${a}`, `x = ${x}`]),
    distractors: makeDistractors(String(x), [String(-x), String(x + 1), String((c + b) / a)]),
    questionType: 'MCQ', tags: 'equations,linear,solve-for-x', estimatedTimeSec: 90,
  };
}

// ============================================================
// Math 9-12 (Algebra, Geometry, Trig, Pre-Calc)
// ============================================================

function generateMath912(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];
  const topics = [
    { name: 'Linear Equations', gen: genLinearEq912 },
    { name: 'Quadratic Equations', gen: genQuadratic912 },
    { name: 'Systems of Equations', gen: genSystems912 },
    { name: 'Functions', gen: genFunctions912 },
    { name: 'Trigonometry', gen: genTrig912 },
    { name: 'Polynomials', gen: genPolynomials912 },
    { name: 'Exponents', gen: genExponents912 },
    { name: 'Geometry Proofs', gen: genGeoProofs912 },
    { name: 'Sequences and Series', gen: genSequences912 },
    { name: 'Matrices', gen: genMatrices912 },
  ];

  for (const topic of topics) {
    for (let i = 0; i < 150; i++) {
      questions.push(topic.gen());
    }
  }
  return questions;
}

function genLinearEq912(): SeedQuestion {
  const m = randInt(-5, 5);
  const b = randInt(-10, 10);
  if (m === 0) return genLinearEq912(); // avoid horizontal
  const scenarios = [
    `What is the slope of the line y = ${m}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}?`,
    `What is the y-intercept of the line y = ${m}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}?`,
    `Find the x-intercept of the line y = ${m}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}.`,
  ];
  const idx = randInt(0, 2);
  const answers = [String(m), String(b), b !== 0 ? `${(-b / m).toFixed(2)}` : '0'];
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Linear Equations',
    difficulty: 4,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.HSA.SSE.A.1',
    stem: scenarios[idx], answerKey: answers[idx],
    distractors: makeDistractors(answers[idx], [String(m), String(b), String(-m), String(-b), '0']),
    questionType: 'MCQ', tags: 'linear-equations,slope,y-intercept,x-intercept', estimatedTimeSec: 60,
  };
}

function genQuadratic912(): SeedQuestion {
  const a = pick([1, 1, 1, 2]);
  const bCoeff = randInt(-6, 6);
  const c = randInt(-8, 8);
  const discriminant = bCoeff * bCoeff - 4 * a * c;
  const roots = discriminant >= 0
    ? `(${(-bCoeff + Math.sqrt(discriminant)) / (2 * a)}), ${(-bCoeff - Math.sqrt(discriminant)) / (2 * a)}`
    : 'No real roots';
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Quadratic Equations',
    difficulty: discriminant >= 0 && Math.sqrt(discriminant) % 1 === 0 ? 4 : 5,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.HSA.REI.B.4',
    stem: `Find the roots of ${a === 1 ? '' : a + '}'}x² ${bCoeff >= 0 ? '+ ' + bCoeff : '- ' + Math.abs(bCoeff)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = 0`,
    answerKey: roots,
    solutionSteps: makeSolutionSteps([
      `a=${a}, b=${bCoeff}, c=${c}`,
      `Discriminant = b²-4ac = ${bCoeff}²-4(${a})(${c}) = ${discriminant}`,
      discriminant >= 0 ? `x = (-b ± √D) / 2a` : 'Discriminant is negative, no real roots',
    ]),
    questionType: 'SHORT_ANSWER', tags: 'quadratic-equations,roots,discriminant', estimatedTimeSec: 120,
  };
}

function genSystems912(): SeedQuestion {
  const x = randInt(-5, 5);
  const y = randInt(-5, 5);
  const a1 = randInt(1, 3); const b1 = randInt(1, 3);
  const a2 = randInt(1, 3); const b2 = randInt(1, 3);
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Systems of Equations',
    difficulty: 5,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.HSA.REI.C.6',
    stem: `Solve the system:\n${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}`,
    answerKey: `x = ${x}, y = ${y}`,
    solutionSteps: makeSolutionSteps([`Use substitution or elimination`, `From eq 1: ${a1}x + ${b1}y = ${c1}`, `From eq 2: ${a2}x + ${b2}y = ${c2}`, `Solution: x = ${x}, y = ${y}`]),
    questionType: 'SHORT_ANSWER', tags: 'systems-of-equations,simultaneous,elimination', estimatedTimeSec: 180,
  };
}

function genFunctions912(): SeedQuestion {
  const a = randInt(-3, 3);
  const k = randInt(-3, 3);
  if (a === 0 || k === 0) return genFunctions912();
  const x = randInt(1, 5);
  const fx = a * x + k;
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Functions',
    difficulty: 3,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.HSF.IF.A.1',
    stem: `Given f(x) = ${a}x ${k >= 0 ? '+ ' + k : '- ' + Math.abs(k)}, find f(${x}).`,
    answerKey: String(fx),
    solutionSteps: makeSolutionSteps([`f(x) = ${a}x ${k >= 0 ? '+ ' + k : '- ' + Math.abs(k)}`, `f(${x}) = ${a}(${x}) ${k >= 0 ? '+ ' + k : '- ' + Math.abs(k)}`, `f(${x}) = ${a * x} ${k >= 0 ? '+ ' + k : '- ' + Math.abs(k)}`, `f(${x}) = ${fx}`]),
    distractors: makeDistractors(String(fx), [String(a + k), String(a * x), String(k)]),
    questionType: 'MCQ', tags: 'functions,evaluation,f-of-x', estimatedTimeSec: 60,
  };
}

function genTrig912(): SeedQuestion {
  const angle = pick([0, 30, 45, 60, 90]);
  const func = pick(['sin', 'cos', 'tan']);
  const values: Record<string, Record<number, string>> = {
    sin: { 0: '0', 30: '1/2', 45: '√2/2', 60: '√3/2', 90: '1' },
    cos: { 0: '1', 30: '√3/2', 45: '√2/2', 60: '1/2', 90: '0' },
    tan: { 0: '0', 30: '√3/3', 45: '1', 60: '√3', 90: 'undefined' },
  };
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Trigonometry',
    difficulty: 4,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.HSF.TF.A.3',
    stem: `What is ${func}(${angle}°)?`,
    answerKey: values[func][angle],
    distractors: makeDistractors(values[func][angle], ['0', '1', '1/2', '√2/2', '√3/2', '√3/3', '1/√3', '√3', 'undefined']),
    questionType: 'MCQ', tags: 'trigonometry,sin-cos-tan,special-angles', estimatedTimeSec: 30,
  };
}

function genPolynomials912(): SeedQuestion {
  const a = randInt(1, 4);
  const b = randInt(-6, 6);
  const c = randInt(-6, 6);
  const x = randInt(-3, 3);
  const result = a * x * x + b * x + c;
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Polynomials',
    difficulty: 4,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.HSA.APR.A.1',
    stem: `Evaluate ${a}x² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}x ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} when x = ${x}.`,
    answerKey: String(result),
    solutionSteps: makeSolutionSteps([`Substitute x = ${x}`, `${a}(${x})² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}(${x}) ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)}`, `= ${a * x * x} ${b * x >= 0 ? '+ ' + b * x : '- ' + Math.abs(b * x)} ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)}`, `= ${result}`]),
    distractors: makeDistractors(String(result), [String(a + b + c), String(x), String(result + 1)]),
    questionType: 'MCQ', tags: 'polynomials,evaluation,quadratic', estimatedTimeSec: 90,
  };
}

function genExponents912(): SeedQuestion {
  const base = pick([2, 3, 4, 5, 10]);
  const exp = randInt(2, 5);
  const result = Math.pow(base, exp);
  const law = pick(['product', 'quotient', 'power']);
  if (law === 'product') {
    const exp2 = randInt(1, 4);
    return {
      subject: 'MATH', gradeBand: '9-12', topic: 'Exponents',
      difficulty: 3,
      curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.HSN.RN.A.2',
      stem: `Simplify: ${base}^${exp} × ${base}^${exp2}`,
      answerKey: `${base}^${exp + exp2} = ${result * Math.pow(base, exp2)}`,
      distractors: makeDistractors(`${base}^${exp + exp2}`, [`${base}^${exp * exp2}`, `${(base * base)}^${exp + exp2}`, `${base}^${exp - exp2}`]),
      questionType: 'MCQ', tags: 'exponents,power-rules,simplification', estimatedTimeSec: 60,
    };
  }
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Exponents',
    difficulty: 3,
    stem: `Evaluate: ${base}^${exp}`,
    answerKey: String(result),
    solutionSteps: makeSolutionSteps([`${base}^${exp} = ${base} × ${base} × ... (${exp} times)`, `= ${result}`]),
    distractors: makeDistractors(String(result), [String(base * exp), String(base + exp), String(Math.pow(base, exp - 1))]),
    questionType: 'MCQ', tags: 'exponents,evaluation,powers', estimatedTimeSec: 45,
  };
}

function genGeoProofs912(): SeedQuestion {
  const proofs = [
    { stem: 'Given: Two parallel lines cut by a transversal. Alternate interior angles are congruent. Prove: The lines are parallel.', answer: 'Converse of the Alternate Interior Angles Theorem', topic: 'Parallel Lines' },
    { stem: 'Given: Triangle ABC with AB = AC. Prove: Angle B = Angle C.', answer: 'Base Angles Theorem (isosceles triangle)', topic: 'Triangles' },
    { stem: 'Given: Quadrilateral ABCD with all sides equal and one right angle. Prove: ABCD is a square.', answer: 'If a rhombus has one right angle, all angles are right angles → square', topic: 'Quadrilaterals' },
  ];
  const p = pick(proofs);
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Geometry Proofs',
    difficulty: 5,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.HSG.CO.C.9',
    stem: `What theorem or postulate would you use to complete this proof?\n\n${p.stem}`,
    answerKey: p.answer,
    distractors: makeDistractors(p.answer, ['SSS Postulate', 'SAS Postulate', 'Corresponding Angles Postulate', 'Vertical Angles Theorem']),
    questionType: 'MCQ', tags: 'geometry,proofs,theorems', estimatedTimeSec: 180,
  };
}

function genSequences912(): SeedQuestion {
  const a1 = randInt(1, 10);
  const d = randInt(1, 5);
  const n = randInt(5, 15);
  const an = a1 + (n - 1) * d;
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Sequences and Series',
    difficulty: 4,
    curriculum: 'CCSS', standardCode: 'CCSS.MATH.CONTENT.HSF.BF.A.2',
    stem: `Find the ${n}th term of the arithmetic sequence: ${a1}, ${a1 + d}, ${a1 + 2 * d}, ...`,
    answerKey: String(an),
    solutionSteps: makeSolutionSteps([`First term a₁ = ${a1}`, `Common difference d = ${d}`, `Formula: aₙ = a₁ + (n-1)d`, `a${n} = ${a1} + (${n}-1)(${d})`, `a${n} = ${a1} + ${(n - 1) * d}`, `a${n} = ${an}`]),
    distractors: makeDistractors(String(an), [String(a1 + n * d), String(a1 * d), String(an + d)]),
    questionType: 'MCQ', tags: 'sequences,arithmetic,nth-term', estimatedTimeSec: 90,
  };
}

function genMatrices912(): SeedQuestion {
  const a = randInt(-3, 3); const b = randInt(-3, 3);
  const c = randInt(-3, 3); const d = randInt(-3, 3);
  const det = a * d - b * c;
  return {
    subject: 'MATH', gradeBand: '9-12', topic: 'Matrices',
    difficulty: 4,
    stem: `Find the determinant of matrix:\n| ${a}  ${b} |\n| ${c}  ${d} |`,
    answerKey: String(det),
    solutionSteps: makeSolutionSteps([`det = ad - bc`, `= (${a})(${d}) - (${b})(${c})`, `= ${a * d} - ${b * c}`, `= ${det}`]),
    distractors: makeDistractors(String(det), [String(a * d + b * c), String(a + b + c + d), String(-det)]),
    questionType: 'MCQ', tags: 'matrices,determinant,2x2', estimatedTimeSec: 60,
  };
}

// ============================================================
// Test Prep Questions (SAT, ACT, AP)
// ============================================================

function generateTestPrep(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];

  // SAT Math
  for (let i = 0; i < 400; i++) questions.push(genSATMath());
  // SAT Reading
  for (let i = 0; i < 300; i++) questions.push(genSATReading());
  // SAT Writing
  for (let i = 0; i < 200; i++) questions.push(genSATWriting());
  // ACT Math
  for (let i = 0; i < 300; i++) questions.push(genACTMath());
  // ACT English
  for (let i = 0; i < 200; i++) questions.push(genACTEnglish());
  // ACT Reading
  for (let i = 0; i < 200; i++) questions.push(genACTReading());
  // ACT Science
  for (let i = 0; i < 200; i++) questions.push(genACTScience());

  return questions;
}

function genSATMath(): SeedQuestion {
  const gen = pick([genLinearEq912, genQuadratic912, genFunctions912, genExponents912, genTrig912, genStatistics68, genPercents68]);
  const q = gen();
  q.gradeBand = '9-12';
  q.testTypeName = 'SAT';
  q.tags = `${q.tags},sat-math,test-prep`;
  q.curriculum = 'SAT';
  q.difficulty = Math.min(q.difficulty + 1, 5);
  return q;
}

function genSATReading(): SeedQuestion {
  const passages = [
    { topic: 'Science', passage: 'The discovery of penicillin by Alexander Fleming revolutionized medicine. Fleming noticed that a mold had contaminated one of his bacterial cultures and was killing the bacteria.', question: 'Based on the passage, what was the significance of the mold contaminating the culture?', answer: 'It led to the discovery of a bacteria-killing substance' },
    { topic: 'History', passage: 'The Renaissance was a period of cultural rebirth in Europe from the 14th to 17th century. It began in Italy and spread throughout Europe, marking a transition from the Medieval period.', question: 'Where did the Renaissance begin?', answer: 'Italy' },
    { topic: 'Literature', passage: 'In "The Great Gatsby," F. Scott Fitzgerald explores the American Dream through the eyes of Jay Gatsby, a wealthy man who throws extravagant parties to win back his lost love, Daisy Buchanan.', question: 'What is Gatsby\'s primary motivation for throwing parties?', answer: 'To win back Daisy Buchanan' },
  ];
  const p = pick(passages);
  return {
    subject: 'LANGUAGE', gradeBand: '9-12', topic: `SAT Reading - ${p.topic}`,
    difficulty: 4, curriculum: 'SAT', testTypeName: 'SAT',
    stem: `${p.passage}\n\n${p.question}`,
    answerKey: p.answer,
    distractors: makeDistractors(p.answer, ['To become famous', 'To make money', 'It was an accident', 'France', 'England', 'Germany', 'To impress his neighbors', 'To find new friends']),
    questionType: 'MCQ', tags: 'sat-reading,comprehension,test-prep,evidence-based', estimatedTimeSec: 90,
  };
}

function genSATWriting(): SeedQuestion {
  const errors = [
    { sentence: 'The team of players <ERROR>is</ERROR> ready for the championship game.', corrections: ['are', 'were', 'has been'], answer: 'No error — "is" is correct', correct: true },
    { sentence: 'Neither the students nor the teacher <ERROR>were</ERROR> prepared for the fire drill.', corrections: ['was', 'is', 'are'], answer: 'was', correct: false },
    { sentence: 'Each of the cars <ERROR>have</ERROR> been washed and detailed.', corrections: ['has', 'had', 'having'], answer: 'has', correct: false },
  ];
  const e = pick(errors);
  return {
    subject: 'LANGUAGE', gradeBand: '9-12', topic: 'SAT Writing - Grammar',
    difficulty: 4, curriculum: 'SAT', testTypeName: 'SAT',
    stem: `Identify the error in the following sentence (or select "No error"):\n\n"${e.sentence.replace('<ERROR>', '').trim()}"`,
    answerKey: e.answer,
    distractors: e.corrections,
    questionType: 'MCQ', tags: 'sat-writing,grammar,subject-verb-agreement,test-prep', estimatedTimeSec: 45,
  };
}

function genACTMath(): SeedQuestion {
  const gen = pick([genLinearEq912, genGeometry68, genTrig912, genProbability68, genPreAlgebra68, genPercents68]);
  const q = gen();
  q.gradeBand = '9-12';
  q.testTypeName = 'ACT';
  q.tags = `${q.tags},act-math,test-prep`;
  q.curriculum = 'ACT';
  q.difficulty = Math.min(q.difficulty + 1, 5);
  return q;
}

function genACTEnglish(): SeedQuestion {
  const rules = [
    { sentence: 'The dog, <ERROR>which</ERROR> was barking loudly, woke up the neighbors.', options: ['who', 'that', 'whom'], answer: 'that', explanation: '"That" is preferred for animals' },
    { sentence: 'She runs <ERROR>more faster</ERROR> than anyone on the team.', options: ['more fast', 'fastest', 'faster'], answer: 'faster', explanation: 'Double comparative error' },
    { sentence: 'The affect <ERROR>of</ERROR> the medication was immediate.', options: ['effect', 'affects', 'effects'], answer: 'effect', explanation: '"Effect" is a noun meaning result' },
  ];
  const r = pick(rules);
  return {
    subject: 'LANGUAGE', gradeBand: '9-12', topic: 'ACT English - Usage',
    difficulty: 3, curriculum: 'ACT', testTypeName: 'ACT',
    stem: `Choose the best replacement for the underlined word/phrase:\n\n"${r.sentence.replace('<ERROR>', '___').trim()}"`,
    answerKey: r.answer,
    distractors: makeDistractors(r.answer, r.options),
    questionType: 'MCQ', tags: 'act-english,grammar,usage,test-prep', estimatedTimeSec: 45,
  };
}

function genACTReading(): SeedQuestion {
  const passages = [
    { topic: 'Natural Science', passage: 'Photosynthesis is the process by which green plants convert sunlight into chemical energy. This process occurs primarily in the leaves, where chlorophyll captures light energy.', question: 'Where does photosynthesis primarily occur?', answer: 'In the leaves' },
    { topic: 'Social Science', passage: 'The Industrial Revolution transformed economies from agriculture-based to manufacturing-based systems. This shift began in England in the late 18th century.', question: 'Which country was the birthplace of the Industrial Revolution?', answer: 'England' },
  ];
  const p = pick(passages);
  return {
    subject: 'LANGUAGE', gradeBand: '9-12', topic: `ACT Reading - ${p.topic}`,
    difficulty: 3, curriculum: 'ACT', testTypeName: 'ACT',
    stem: `${p.passage}\n\n${p.question}`,
    answerKey: p.answer,
    distractors: makeDistractors(p.answer, ['In the roots', 'In the flowers', 'In the United States', 'In France', 'In the stem', 'In Germany']),
    questionType: 'MCQ', tags: 'act-reading,comprehension,test-prep', estimatedTimeSec: 90,
  };
}

function genACTScience(): SeedQuestion {
  const scenarios = [
    { topic: 'Chemistry', passage: 'Experiment: A student mixed 50 mL of HCl with 50 mL of NaOH. The temperature of the solution increased from 22°C to 35°C.', question: 'What type of reaction occurred?', answer: 'Exothermic reaction' },
    { topic: 'Biology', passage: 'A study measured the growth rate of bacteria at different temperatures. At 25°C, the population doubled every 20 minutes. At 40°C, no growth was observed.', question: 'What can be concluded about bacteria growth at 40°C?', answer: 'The temperature is too high for growth (proteins may be denatured)' },
    { topic: 'Physics', passage: 'A ball was dropped from a height of 10 meters. It hit the ground after 1.43 seconds. A second ball was dropped from 20 meters.', question: 'Approximately how long will the second ball take to hit the ground?', answer: 'About 2.02 seconds' },
  ];
  const s = pick(scenarios);
  return {
    subject: 'SCIENCE', gradeBand: '9-12', topic: `ACT Science - ${s.topic}`,
    difficulty: 4, curriculum: 'ACT', testTypeName: 'ACT',
    stem: `${s.passage}\n\n${s.question}`,
    answerKey: s.answer,
    distractors: makeDistractors(s.answer, ['Endothermic reaction', 'No reaction', 'Optimal growth temperature', 'About 1.43 seconds', 'About 2.86 seconds', 'Neutralization']),
    questionType: 'MCQ', tags: 'act-science,data-interpretation,test-prep', estimatedTimeSec: 60,
  };
}

// ============================================================
// Science Questions
// ============================================================

function generateScience(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];

  for (let i = 0; i < 300; i++) questions.push(genScienceK2());
  for (let i = 0; i < 600; i++) questions.push(genScience35());
  for (let i = 0; i < 700; i++) questions.push(genScience68());
  for (let i = 0; i < 1400; i++) questions.push(genScience912());

  return questions;
}

function genScienceK2(): SeedQuestion {
  const topics = [
    { topic: 'Living Things', q: pick(['Which of these is a living thing?', 'Which of these needs food and water to survive?']), options: ['Rock', 'Cloud', 'Tree', 'River'], answer: 'Tree', tags: 'living-things,biology' },
    { topic: 'Five Senses', q: 'Which sense do you use to smell flowers?', options: ['Sight', 'Hearing', 'Smell', 'Touch'], answer: 'Smell', tags: 'five-senses,human-body' },
    { topic: 'Weather', q: 'What do we call water that falls from clouds?', options: ['Evaporation', 'Precipitation', 'Condensation', 'Collection'], answer: 'Precipitation', tags: 'weather,water-cycle' },
    { topic: 'Seasons', q: 'In which season do leaves change color and fall from trees?', options: ['Spring', 'Summer', 'Fall', 'Winter'], answer: 'Fall', tags: 'seasons,nature' },
    { topic: 'Plants', q: 'What do plants need to make their own food?', options: ['Darkness', 'Sunlight', 'Sugar', 'Meat'], answer: 'Sunlight', tags: 'plants,photosynthesis' },
  ];
  const t = pick(topics);
  return {
    subject: 'SCIENCE', gradeBand: 'K-2', topic: t.topic,
    difficulty: 1, curriculum: 'NGSS',
    stem: t.q, answerKey: t.answer,
    distractors: JSON.stringify(t.options.filter(o => o !== t.answer)),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 30,
  };
}

function genScience35(): SeedQuestion {
  const topics = [
    { topic: 'Forces', q: 'What force pulls objects toward the Earth?', answer: 'Gravity', distractors: ['Friction', 'Magnetism', 'Electricity'], tags: 'forces,gravity,physics' },
    { topic: 'Matter', q: 'What are the three states of matter?', answer: 'Solid, Liquid, Gas', distractors: ['Hard, Soft, Medium', 'Hot, Cold, Warm', 'Big, Small, Tiny'], tags: 'matter,states,chemistry' },
    { topic: 'Ecosystems', q: 'What is a food chain?', answer: 'A sequence of organisms where each is food for the next', distractors: ['A chain made of food', 'A restaurant menu', 'A list of ingredients'], tags: 'ecosystems,food-chain,biology' },
    { topic: 'Solar System', q: 'How many planets are in our solar system?', answer: '8', distractors: ['7', '9', '10'], tags: 'solar-system,planets,astronomy' },
    { topic: 'Water Cycle', q: 'What is evaporation?', answer: 'Water turning from liquid to gas (vapor)', distractors: ['Water freezing', 'Water flowing', 'Rain falling'], tags: 'water-cycle,evaporation,earth-science' },
    { topic: 'Energy', q: 'What form of energy does the Sun produce?', answer: 'Light and thermal energy', distractors: ['Only light energy', 'Only heat energy', 'Sound energy'], tags: 'energy,solar,physics' },
  ];
  const t = pick(topics);
  return {
    subject: 'SCIENCE', gradeBand: '3-5', topic: t.topic,
    difficulty: randInt(2, 3), curriculum: 'NGSS',
    stem: t.q, answerKey: t.answer,
    distractors: JSON.stringify(t.distractors),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 45,
  };
}

function genScience68(): SeedQuestion {
  const topics = [
    { topic: 'Cells', q: 'What is the basic unit of all living organisms?', answer: 'Cell', distractors: ['Atom', 'Organ', 'Molecule'], tags: 'cells,biology,structure' },
    { topic: 'Genetics', q: 'What molecule carries genetic information?', answer: 'DNA', distractors: ['RNA', 'ATP', 'Protein'], tags: 'genetics,dna,heredity' },
    { topic: 'Chemical Reactions', q: 'In a chemical reaction, what happens to atoms?', answer: 'They are rearranged to form new substances', distractors: ['They are destroyed', 'They are created', 'They stay the same'], tags: 'chemical-reactions,chemistry,conservation' },
    { topic: 'Earth Science', q: 'What layer of the Earth do we live on?', answer: 'Crust', distractors: ['Mantle', 'Outer core', 'Inner core'], tags: 'earth-science,layers,geology' },
    { topic: 'Photosynthesis', q: 'What gas do plants release during photosynthesis?', answer: 'Oxygen', distractors: ['Carbon dioxide', 'Nitrogen', 'Hydrogen'], tags: 'photosynthesis,plants,biology' },
    { topic: 'Newton\'s Laws', q: 'Newton\'s Third Law states that for every action there is...', answer: 'An equal and opposite reaction', distractors: ['A greater reaction', 'No reaction', 'A smaller reaction'], tags: 'newtons-laws,physics,forces' },
  ];
  const t = pick(topics);
  return {
    subject: 'SCIENCE', gradeBand: '6-8', topic: t.topic,
    difficulty: randInt(3, 4), curriculum: 'NGSS',
    stem: t.q, answerKey: t.answer,
    distractors: JSON.stringify(t.distractors),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 60,
  };
}

function genScience912(): SeedQuestion {
  const topics = [
    { topic: 'Cell Division', q: 'What is mitosis?', answer: 'Cell division that produces two identical daughter cells', distractors: ['Cell death', 'Formation of gametes', 'Protein synthesis'], tags: 'cell-division,mitosis,biology' },
    { topic: 'Chemical Bonding', q: 'What type of bond involves sharing of electrons?', answer: 'Covalent bond', distractors: ['Ionic bond', 'Metallic bond', 'Hydrogen bond'], tags: 'chemical-bonding,covalent,chemistry' },
    { topic: 'Kinematics', q: 'What is the formula for velocity?', answer: 'v = d/t (displacement divided by time)', distractors: ['v = d × t', 'v = d + t', 'v = a × t'], tags: 'kinematics,velocity,physics' },
    { topic: 'Thermodynamics', q: 'What is the first law of thermodynamics about?', answer: 'Conservation of energy', distractors: ['Entropy always increases', 'Absolute zero is unreachable', 'Heat flows from cold to hot'], tags: 'thermodynamics,energy,physics' },
    { topic: 'Ecology', q: 'What is a keystone species?', answer: 'A species whose removal dramatically changes the ecosystem', distractors: ['The largest species', 'The most common species', 'A species at the top of the food chain'], tags: 'ecology,keystone-species,environmental-science' },
    { topic: 'Organic Chemistry', q: 'What is a hydrocarbon?', answer: 'A compound made of only hydrogen and carbon atoms', distractors: ['A compound containing water', 'A compound with nitrogen', 'A compound with oxygen'], tags: 'organic-chemistry,hydrocarbons,chemistry' },
  ];
  const t = pick(topics);
  return {
    subject: 'SCIENCE', gradeBand: '9-12', topic: t.topic,
    difficulty: randInt(4, 5), curriculum: pick(['NGSS', 'AP', 'IB']),
    stem: t.q, answerKey: t.answer,
    distractors: JSON.stringify(t.distractors),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 90,
  };
}

// ============================================================
// Language/ELA Questions
// ============================================================

function generateLanguage(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];
  for (let i = 0; i < 500; i++) questions.push(genLanguageK2());
  for (let i = 0; i < 800; i++) questions.push(genLanguage35());
  for (let i = 0; i < 800; i++) questions.push(genLanguage68());
  for (let i = 0; i < 900; i++) questions.push(genLanguage912());
  return questions;
}

function genLanguageK2(): SeedQuestion {
  const topics = [
    { topic: 'Phonics', q: `Which word starts with the "ch" sound?`, options: ['Chair', 'Ship', 'Thin', 'Cat'], answer: 'Chair', tags: 'phonics,consonant-digraphs' },
    { topic: 'Sight Words', q: `Which word is spelled correctly?`, options: ['teh', 'the', 'thi', 'tha'], answer: 'the', tags: 'sight-words,spelling' },
    { topic: 'Grammar', q: 'Which word is a noun?', options: ['Run', 'Happy', 'Dog', 'Quickly'], answer: 'Dog', tags: 'grammar,parts-of-speech,nouns' },
    { topic: 'Reading Comprehension', q: 'What is the main idea of a story?', options: ['The most important point the author wants to make', 'The longest paragraph', 'The first word', 'The title only'], answer: 'The most important point the author wants to make', tags: 'reading-comprehension,main-idea' },
    { topic: 'Vocabulary', q: 'What does the word "enormous" mean?', options: ['Very big', 'Very small', 'Very fast', 'Very old'], answer: 'Very big', tags: 'vocabulary,adjectives,meaning' },
  ];
  const t = pick(topics);
  return {
    subject: 'LANGUAGE', gradeBand: 'K-2', topic: t.topic,
    difficulty: 1, stem: t.q, answerKey: t.answer,
    distractors: JSON.stringify(t.options.filter(o => o !== t.answer)),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 30,
  };
}

function genLanguage35(): SeedQuestion {
  const topics = [
    { topic: 'Vocabulary', q: 'What is a synonym for "happy"?', answer: 'Joyful', distractors: ['Sad', 'Angry', 'Tired'], tags: 'vocabulary,synonyms' },
    { topic: 'Grammar', q: 'What is the past tense of "run"?', answer: 'Ran', distractors: ['Runned', 'Running', 'Runed'], tags: 'grammar,verb-tenses,past-tense' },
    { topic: 'Reading Comprehension', q: 'What is an inference?', answer: 'A conclusion based on evidence and reasoning', distractors: ['A fact stated directly in the text', 'The title of a story', 'A character\'s name'], tags: 'reading-comprehension,inference' },
    { topic: 'Writing Mechanics', q: 'Which sentence is correctly punctuated?', answer: 'The dog, which is brown, barked loudly.', distractors: ['The dog which is brown barked loudly.', 'The dog, which is brown barked loudly.', 'The, dog which is brown, barked loudly.'], tags: 'writing,punctuation,commas' },
  ];
  const t = pick(topics);
  return {
    subject: 'LANGUAGE', gradeBand: '3-5', topic: t.topic,
    difficulty: randInt(2, 3), stem: t.q, answerKey: t.answer,
    distractors: JSON.stringify(t.distractors),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 45,
  };
}

function genLanguage68(): SeedQuestion {
  const topics = [
    { topic: 'Literary Analysis', q: 'What is a metaphor?', answer: 'A comparison between two unlike things without using "like" or "as"', distractors: ['A comparison using "like" or "as"', 'An exaggeration', 'A sound word'], tags: 'literary-analysis,figurative-language,metaphor' },
    { topic: 'Grammar', q: 'What is a dependent clause?', answer: 'A group of words with a subject and verb that cannot stand alone as a sentence', distractors: ['A complete sentence', 'A phrase without a verb', 'A list of items'], tags: 'grammar,clauses,sentence-structure' },
    { topic: 'Vocabulary in Context', q: 'In the sentence "The austere room had bare walls and no furniture," what does "austere" most likely mean?', answer: 'Plain and without decoration', distractors: ['Colorful', 'Large', 'Crowded'], tags: 'vocabulary,context-clues,inference' },
  ];
  const t = pick(topics);
  return {
    subject: 'LANGUAGE', gradeBand: '6-8', topic: t.topic,
    difficulty: randInt(3, 4), stem: t.q, answerKey: t.answer,
    distractors: JSON.stringify(t.distractors),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 60,
  };
}

function genLanguage912(): SeedQuestion {
  const topics = [
    { topic: 'Rhetorical Analysis', q: 'What is ethos in persuasive writing?', answer: 'An appeal to credibility and authority', distractors: ['An appeal to emotion', 'An appeal to logic', 'A type of figurative language'], tags: 'rhetorical-analysis,ethos,persuasion' },
    { topic: 'Research Skills', q: 'What is a primary source?', answer: 'An original document or firsthand account from the time period', distractors: ['A textbook summary', 'An encyclopedia entry', 'A Wikipedia article'], tags: 'research,sources,citation' },
    { topic: 'Advanced Grammar', q: 'What is the subjunctive mood used for?', answer: 'Expressing wishes, hypotheticals, or demands', distractors: ['Stating facts', 'Asking questions', 'Giving commands'], tags: 'grammar,subjunctive,verb-mood' },
  ];
  const t = pick(topics);
  return {
    subject: 'LANGUAGE', gradeBand: '9-12', topic: t.topic,
    difficulty: randInt(4, 5), stem: t.q, answerKey: t.answer,
    distractors: JSON.stringify(t.distractors),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 60,
  };
}

// ============================================================
// Social Studies / History Questions
// ============================================================

function generateSocialStudies(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];
  for (let i = 0; i < 250; i++) questions.push(genSocialStudiesQ());
  return questions;
}

function genSocialStudiesQ(): SeedQuestion {
  const topics = [
    { topic: 'US History', q: 'In which year did the Declaration of Independence get signed?', answer: '1776', gradeBand: '6-8', tags: 'us-history,declaration-independence' },
    { topic: 'World History', q: 'Which ancient civilization built the pyramids at Giza?', answer: 'Ancient Egypt', gradeBand: '3-5', tags: 'world-history,ancient-civilizations' },
    { topic: 'Geography', q: 'What is the largest continent by area?', answer: 'Asia', gradeBand: '3-5', tags: 'geography,continents' },
    { topic: 'Civics', q: 'What are the three branches of the US government?', answer: 'Executive, Legislative, Judicial', gradeBand: '6-8', tags: 'civics,government,branches' },
    { topic: 'US History', q: 'Who was the first President of the United States?', answer: 'George Washington', gradeBand: 'K-2', tags: 'us-history,presidents' },
    { topic: 'World History', q: 'What event started World War I?', answer: 'The assassination of Archduke Franz Ferdinand', gradeBand: '9-12', tags: 'world-history,wwi,causes' },
    { topic: 'Economics', q: 'What is supply and demand?', answer: 'An economic model where price is determined by availability (supply) and consumer desire (demand)', gradeBand: '9-12', tags: 'economics,supply-demand' },
  ];
  const t = pick(topics);
  return {
    subject: 'GENERAL', gradeBand: t.gradeBand, topic: t.topic,
    difficulty: t.gradeBand === 'K-2' ? 1 : t.gradeBand === '3-5' ? 2 : t.gradeBand === '6-8' ? 3 : 4,
    stem: t.q, answerKey: t.answer,
    distractors: makeDistractors(t.answer, ['1789', '1787', '1812', 'Ancient Rome', 'Ancient Greece', 'Mesopotamia', 'Africa', 'Europe', 'North America', 'Executive, Senate, Supreme Court', 'President, Cabinet, Congress', 'Abraham Lincoln', 'Thomas Jefferson', 'The invasion of Poland', 'The bombing of Pearl Harbor']),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 60,
  };
}

// ============================================================
// ESL Questions
// ============================================================

function generateESL(): SeedQuestion[] {
  const questions: SeedQuestion[] = [];
  for (let i = 0; i < 250; i++) questions.push(genESLQ());
  return questions;
}

function genESLQ(): SeedQuestion {
  const topics = [
    { topic: 'Grammar Basics', q: 'Choose the correct form: "She ___ to school every day."', answer: 'goes', distractors: ['go', 'going', 'gone'], level: '3-5', tags: 'esl,grammar,present-tense' },
    { topic: 'Vocabulary', q: 'What is the opposite of "hot"?', answer: 'Cold', distractors: ['Warm', 'Cool', 'Wet'], level: 'K-2', tags: 'esl,vocabulary,antonyms' },
    { topic: 'Sentence Structure', q: 'Which is a complete sentence?', answer: 'The cat sat on the mat.', distractors: ['Sat on the mat.', 'The big cat.', 'Quickly ran.'], level: '3-5', tags: 'esl,sentence-structure,complete-sentence' },
    { topic: 'Prepositions', q: 'The book is ___ the table. (Choose the correct preposition)', answer: 'on', distractors: ['in', 'at', 'by'], level: '3-5', tags: 'esl,prepositions,location' },
  ];
  const t = pick(topics);
  return {
    subject: 'ESL', gradeBand: t.level, topic: t.topic,
    difficulty: t.level === 'K-2' ? 1 : 2,
    stem: t.q, answerKey: t.answer,
    distractors: JSON.stringify(t.distractors),
    questionType: 'MCQ', tags: t.tags, estimatedTimeSec: 30,
  };
}

// ============================================================
// Main Seed Function
// ============================================================

async function seedQuestionBank() {
  console.log('Starting question bank seed...\n');

  // Create test prep categories first
  const testPrepCategories = [
    { name: 'SAT Math', testType: 'SAT', subject: 'MATH', gradeLevel: '9-12', description: 'SAT Mathematics section questions covering algebra, geometry, data analysis, and advanced math.' },
    { name: 'SAT Evidence-Based Reading', testType: 'SAT', subject: 'ENGLISH', gradeLevel: '9-12', description: 'SAT Reading section with passage-based comprehension questions.' },
    { name: 'SAT Writing and Language', testType: 'SAT', subject: 'ENGLISH', gradeLevel: '9-12', description: 'SAT Writing section testing grammar, usage, and expression.' },
    { name: 'ACT Math', testType: 'ACT', subject: 'MATH', gradeLevel: '9-12', description: 'ACT Mathematics section covering pre-algebra through trigonometry.' },
    { name: 'ACT English', testType: 'ACT', subject: 'ENGLISH', gradeLevel: '9-12', description: 'ACT English section testing usage, mechanics, and rhetorical skills.' },
    { name: 'ACT Reading', testType: 'ACT', subject: 'ENGLISH', gradeLevel: '9-12', description: 'ACT Reading section with passage-based comprehension.' },
    { name: 'ACT Science', testType: 'ACT', subject: 'SCIENCE', gradeLevel: '9-12', description: 'ACT Science section testing data interpretation and scientific reasoning.' },
    { name: 'AP Calculus AB', testType: 'AP', subject: 'MATH', gradeLevel: '9-12', description: 'AP Calculus AB covering limits, derivatives, and integrals.' },
    { name: 'AP Biology', testType: 'AP', subject: 'SCIENCE', gradeLevel: '9-12', description: 'AP Biology covering cell biology, genetics, evolution, and ecology.' },
    { name: 'AP Chemistry', testType: 'AP', subject: 'SCIENCE', gradeLevel: '9-12', description: 'AP Chemistry covering atomic structure, bonding, thermodynamics, and kinetics.' },
    { name: 'AP Physics 1', testType: 'AP', subject: 'SCIENCE', gradeLevel: '9-12', description: 'AP Physics 1 covering mechanics, energy, waves, and electricity.' },
    { name: 'AP US History', testType: 'AP', subject: 'GENERAL', gradeLevel: '9-12', description: 'AP US History covering colonial era through present day.' },
    { name: 'AP English Language', testType: 'AP', subject: 'ENGLISH', gradeLevel: '9-12', description: 'AP English Language covering rhetoric, composition, and argument.' },
  ];

  console.log('Creating test prep categories...');
  const categoryMap = new Map<string, string>();
  for (const cat of testPrepCategories) {
    const created = await prisma.testPrepCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryMap.set(cat.name, created.id);
    console.log(`  ✓ ${cat.name}`);
  }

  // Generate all questions
  console.log('\nGenerating questions...\n');

  const allQuestions: SeedQuestion[] = [
    ...generateMathK2(),
    ...generateMath35(),
    ...generateMath68(),
    ...generateMath912(),
    ...generateScience(),
    ...generateLanguage(),
    ...generateSocialStudies(),
    ...generateESL(),
    ...generateTestPrep(),
  ];

  console.log(`Total questions generated: ${allQuestions.length}`);

  // Batch insert (500 at a time to avoid timeout)
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const batch = allQuestions.slice(i, i + BATCH_SIZE);

    // Map test type names to category IDs
    const createData = batch.map(q => {
      const data: Record<string, unknown> = {
        subject: q.subject,
        gradeBand: q.gradeBand,
        topic: q.topic,
        difficulty: q.difficulty,
        curriculum: q.curriculum || null,
        standardCode: q.standardCode || null,
        stem: q.stem,
        answerKey: q.answerKey,
        solutionSteps: q.solutionSteps || null,
        distractors: q.distractors || null,
        questionType: q.questionType,
        tags: q.tags,
        estimatedTimeSec: q.estimatedTimeSec || null,
      };

      // Link to test prep category if applicable
      if (q.testTypeName) {
        const catName = `${q.testTypeName} Math`;
        const catId = categoryMap.get(catName)
          || categoryMap.get(`${q.testTypeName} Evidence-Based Reading`)
          || categoryMap.get(`${q.testTypeName} Writing and Language`)
          || categoryMap.get(`${q.testTypeName} English`)
          || categoryMap.get(`${q.testTypeName} Reading`)
          || categoryMap.get(`${q.testTypeName} Science`);
        if (catId) data.testPrepCategoryId = catId;
      }

      return data;
    });

    const result = await prisma.questionItem.createMany({
      data: createData as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      skipDuplicates: true,
    });

    inserted += result.count;
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${result.count} questions (total: ${inserted})`);
  }

  // Create some curriculum standards
  console.log('\nCreating curriculum standards...');
  const standards = [
    { code: 'CCSS.MATH.CONTENT.K.CC.A.1', framework: 'CCSS', subject: 'MATH', gradeBand: 'K-2', topic: 'Counting', description: 'Count to 100 by ones and by tens' },
    { code: 'CCSS.MATH.CONTENT.1.OA.C.6', framework: 'CCSS', subject: 'MATH', gradeBand: 'K-2', topic: 'Addition', description: 'Add and subtract within 20' },
    { code: 'CCSS.MATH.CONTENT.3.OA.A.1', framework: 'CCSS', subject: 'MATH', gradeBand: '3-5', topic: 'Multiplication', description: 'Interpret products of whole numbers' },
    { code: 'CCSS.MATH.CONTENT.4.NBT.B.4', framework: 'CCSS', subject: 'MATH', gradeBand: '3-5', topic: 'Multi-Digit Arithmetic', description: 'Fluently add and subtract multi-digit whole numbers' },
    { code: 'CCSS.MATH.CONTENT.6.RP.A.1', framework: 'CCSS', subject: 'MATH', gradeBand: '6-8', topic: 'Ratios', description: 'Understand ratio concepts and use ratio reasoning' },
    { code: 'CCSS.MATH.CONTENT.7.EE.B.4', framework: 'CCSS', subject: 'MATH', gradeBand: '6-8', topic: 'Equations', description: 'Use variables to represent quantities in real-world problems' },
    { code: 'CCSS.MATH.CONTENT.HSA.REI.B.4', framework: 'CCSS', subject: 'MATH', gradeBand: '9-12', topic: 'Quadratic Equations', description: 'Solve quadratic equations in one variable' },
    { code: 'CCSS.MATH.CONTENT.HSF.IF.A.1', framework: 'CCSS', subject: 'MATH', gradeBand: '9-12', topic: 'Functions', description: 'Understand that a function from one set to another set assigns to each element exactly one element' },
    { code: 'NGSS.MS-LS1-1', framework: 'NGSS', subject: 'SCIENCE', gradeBand: '6-8', topic: 'Cells', description: 'Conduct an investigation to provide evidence that living things are made of cells' },
    { code: 'NGSS.MS-PS2-2', framework: 'NGSS', subject: 'SCIENCE', gradeBand: '6-8', topic: 'Forces', description: 'Plan an investigation to provide evidence that the change in an object\'s motion depends on the sum of the forces on the object' },
    { code: 'NGSS.HS-PS1-2', framework: 'NGSS', subject: 'SCIENCE', gradeBand: '9-12', topic: 'Chemical Reactions', description: 'Construct and revise an explanation for the outcome of a simple chemical reaction' },
  ];

  for (const std of standards) {
    await prisma.curriculumStandard.upsert({
      where: { code: std.code },
      update: {},
      create: std,
    });
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   Questions: ${inserted}`);
  console.log(`   Test Prep Categories: ${categoryMap.size}`);
  console.log(`   Curriculum Standards: ${standards.length}`);
}

// Run
seedQuestionBank()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
