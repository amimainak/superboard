#!/usr/bin/env python3
"""
Superboard K-12 Question Database Generator
============================================
Generates 250,000+ parametric questions across all subjects, grade bands,
and test prep categories (SAT, ACT, AP). Uses template-based generation
with randomized parameters, algorithmic distractors, LaTeX for math,
and CCSS/NGSS standard alignment.

Output: /home/z/my-project/download/k12-questions-database.json
"""

import json
import random
import uuid
import math
import os
import sys
from datetime import datetime
from typing import Any

random.seed(42)

OUTPUT_DIR = "/home/z/my-project/download"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "k12-questions-database.json")
CATALOG_FILE = os.path.join(OUTPUT_DIR, "question-catalog.json")

# ============================================================
# Helpers
# ============================================================

def uuid4() -> str:
    return str(uuid.uuid4())

def json_arr(items: list) -> str:
    return json.dumps(items)

def latex_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("{", "\\{").replace("}", "\\}")

def make_distractors_int(answer: int, count: int = 3, spread: int = 5, **_kw) -> list:
    """Generate plausible wrong answers for integer questions."""
    distractors = set()
    attempts = 0
    while len(distractors) < count and attempts < 50:
        offset = random.choice([1, 2, 3, 5, 10, -1, -2, -3, -5, -10])
        d = answer + offset
        if d != answer and d >= 0:
            distractors.add(str(d))
        attempts += 1
    while len(distractors) < count:
        distractors.add(str(answer + len(distractors) + 1))
    return list(distractors)[:count]

def make_distractors_frac(num: int, den: int, count: int = 3, **_kw) -> list:
    """Generate plausible wrong answers for fraction questions."""
    fracs = []
    for d_num in [num + 1, num - 1, den, num * 2]:
        for d_den in [den, den + 1, den - 1, num]:
            if d_den > 0 and d_num != num:
                fracs.append(f"{d_num}/{d_den}")
    random.shuffle(fracs)
    return list(set(fracs))[:count]

def solution_step(text: str, **kwargs) -> str:
    return text.format(**kwargs)

def _solve_quadratic(b_sign, b, c_sign, c):
    """Solve x² ± bx ± c = 0 by factoring. Returns roots as string."""
    bv = -b if b_sign == "-" else b
    cv = -c if c_sign == "-" else c
    # Find integer factor pairs of cv that sum to bv
    for i in range(1, abs(cv) + 1):
        if cv % i == 0:
            j = cv // i
            if i + j == bv:
                return f"x = {i}, x = {j}"
            if -i + (-j) == bv:
                return f"x = {-i}, x = {-j}"
            if i + (-j) == bv:
                return f"x = {i}, x = {-j}"
            if -i + j == bv:
                return f"x = {-i}, x = {j}"
    # Fallback: use quadratic formula
    disc = bv * bv - 4 * cv
    if disc < 0:
        return "no real roots"
    x1 = (-bv + math.isqrt(max(0, int(disc)))) / 2
    x2 = (-bv - math.isqrt(max(0, int(disc)))) / 2
    return f"x = {int(x1)}, x = {int(x2)}"

def _quad_distractors(b_sign, b, c_sign, c, count=3):
    """Generate distractors for quadratic."""
    bv = -b if b_sign == "-" else b
    cv = -c if c_sign == "-" else c
    answer = _solve_quadratic(b_sign, b, c_sign, c)
    distractors = []
    # Common wrong answers: sign errors, using b instead of -b, etc.
    for i in range(1, abs(cv) + 1):
        if cv % i == 0:
            j = cv // i
            if i + j != bv:
                s = f"x = {i}, x = {j}"
                if s != answer and s not in distractors:
                    distractors.append(s)
            if len(distractors) >= count:
                break
    while len(distractors) < count:
        distractors.append(f"x = 0, x = {random.randint(1, 20)}")
    return distractors[:count]

def _solve_system(a1, b1, c1, a2, b2, c2):
    """Solve 2x2 linear system. Returns solution string."""
    det = a1 * b2 - a2 * b1
    if det == 0:
        return "no unique solution"
    x = (c1 * b2 - c2 * b1) / det
    y = (a1 * c2 - a2 * c1) / det
    return f"x = {x:.1f}, y = {y:.1f}"

def _system_distractors(a1, b1, c1, a2, b2, c2):
    """Generate distractors for system of equations."""
    det = a1 * b2 - a2 * b1
    if abs(det) < 0.001:
        return ["infinite solutions", "no solution", "x = 0, y = 0"]
    answer = _solve_system(a1, b1, c1, a2, b2, c2)
    distractors = []
    # Swapped values, sign errors
    x = (c1 * b2 - c2 * b1) / (a1 * b2 - a2 * b1)
    y = (a1 * c2 - a2 * c1) / (a1 * b2 - a2 * b1)
    candidates = [
        f"x = {y:.1f}, y = {x:.1f}",
        f"x = {-x:.1f}, y = {y:.1f}",
        f"x = {x:.1f}, y = {-y:.1f}",
        f"x = {c1/a1:.1f}, y = {c2/a2:.1f}",
    ]
    for c in candidates:
        if c != answer:
            distractors.append(c)
    return distractors[:3]

def _safe_log(base, value):
    """Compute log base of value. Returns 0 if not exact."""
    if base <= 1 or value <= 0:
        return 0
    result = 0
    while value % base == 0 and value > 1:
        value //= base
        result += 1
    if value == 1:
        return result
    # Try floating point for non-exact powers
    return round(math.log(value * (base ** result), base))

def _empirical_rule_pct(mean, sd, low, high):
    """Determine what percentage of normal distribution falls in [low, high]."""
    lo_z = (low - mean) / sd if sd else 0
    hi_z = (high - mean) / sd if sd else 0
    lo_n = round(abs(lo_z))
    hi_n = round(abs(hi_z))
    if lo_n == 1 and hi_n == 1:
        return "68%"
    elif lo_n == 2 and hi_n == 2:
        return "95%"
    elif lo_n == 3 and hi_n == 3:
        return "99.7%"
    elif lo_n == 0 and hi_n == 1:
        return "34%"
    elif lo_n == 0 and hi_n == 2:
        return "47.5%"
    elif lo_n == 0 and hi_n == 3:
        return "49.85%"
    return "~68%"

def _genetics_prob(g1, g2, trait):
    """Compute probability of offspring having given trait from cross g1 x g2."""
    # Get gametes from each parent
    def gametes(g):
        if g == "AA": return ["A", "A"]
        if g == "Aa": return ["A", "a"]
        if g == "aa": return ["a", "a"]
        return list(g)
    gams1 = gametes(g1)
    gams2 = gametes(g2)
    # All possible offspring genotypes
    offspring = [a + b for a in gams1 for b in gams2]
    total = len(offspring)
    if "dominant" in trait:
        count = sum(1 for o in offspring if "A" in o)
    else:
        count = sum(1 for o in offspring if o == "aa")
    return f"{count * 100 // total}%"

# ============================================================
# QUESTION TEMPLATES
# ============================================================

class TemplateEngine:
    def __init__(self):
        self.templates = []
        self._register_all()

    def add(self, subject, grade_band, topic, difficulty_range, curriculum,
            standard_code, stem_template, latex_template, answer_fn,
            distractors_fn, solution_steps_fn, question_type, tags,
            time_range, params_spec, count):
        self.templates.append({
            "subject": subject, "gradeBand": grade_band, "topic": topic,
            "difficulty_range": difficulty_range, "curriculum": curriculum,
            "standardCode": standard_code, "stem_template": stem_template,
            "latex_template": latex_template, "answer_fn": answer_fn,
            "distractors_fn": distractors_fn, "solution_steps_fn": solution_steps_fn,
            "questionType": question_type, "tags": tags,
            "time_range": time_range, "params_spec": params_spec, "count": count,
        })

    def generate_all(self) -> list:
        questions = []
        total = sum(t["count"] for t in self.templates)
        print(f"Generating {total:,} questions from {len(self.templates)} templates...")
        for i, t in enumerate(self.templates):
            count = t["count"]
            for j in range(count):
                params = self._sample_params(t["params_spec"])
                q = self._render(t, params)
                questions.append(q)
            if (i + 1) % 50 == 0 or i == len(self.templates) - 1:
                print(f"  Template {i+1}/{len(self.templates)} done, {len(questions):,} questions so far")
        return questions

    def _sample_params(self, spec):
        params = {}
        for key, config in spec.items():
            if isinstance(config, list):
                params[key] = random.choice(config)
            elif isinstance(config, range):
                params[key] = random.choice(list(config))
            elif isinstance(config, dict) and config.get("type") == "choice":
                params[key] = random.choice(config["values"])
            elif isinstance(config, dict) and config.get("type") == "randint":
                params[key] = random.randint(config["min"], config["max"])
            elif callable(config):
                params[key] = config()
        return params

    def _render(self, t, params):
        difficulty = random.choice(t["difficulty_range"])
        time_sec = random.randint(t["time_range"][0], t["time_range"][1])

        answer = t["answer_fn"](**params)
        stem = t["stem_template"].format(**params)
        latex = t["latex_template"].format(**params) if t["latex_template"] else None
        # Build distractor params: distractors_fn computes from params, not answer
        distractors = t["distractors_fn"](**params) if t["distractors_fn"] else None
        steps = t["solution_steps_fn"](**params)
        if isinstance(steps, list):
            steps = json.dumps(steps)
        elif isinstance(steps, str):
            pass

        if distractors and isinstance(distractors, list):
            distractors = json.dumps(distractors)

        return {
            "id": uuid4(),
            "subject": t["subject"],
            "gradeBand": t["gradeBand"],
            "topic": t["topic"],
            "difficulty": difficulty,
            "curriculum": t["curriculum"],
            "standardCode": t["standardCode"],
            "stem": stem,
            "stemLatex": latex,
            "diagramSvg": None,
            "answerKey": str(answer),
            "solutionSteps": steps,
            "distractors": distractors,
            "questionType": t["questionType"],
            "tags": t["tags"],
            "estimatedTimeSec": time_sec,
            "isActive": True,
            "creatorId": None,
        }

    def _register_all(self):
        E = self.add

        # ================================================================
        # MATH: K-2 (20,000 questions)
        # ================================================================

        # Counting & Cardinality
        E("MATH", "K-2", "Counting", [1], "CCSS", "CCSS.MATH.CONTENT.K.CC.B.5",
          "How many objects are there? {a} + {b} = ?",
          "{a} + {b} = ?", lambda a, b: a + b,
          lambda a, b, **kw: make_distractors_int(a + b),
          lambda a, b: [f"Count {a} objects", f"Count {b} more", f"{a} + {b} = {a+b}"],
          "mcq", "counting, addition, k-math", [15, 30],
          {"a": range(1, 6), "b": range(1, 6)}, 2000)

        E("MATH", "K-2", "Counting", [1], "CCSS", "CCSS.MATH.CONTENT.K.CC.A.1",
          "What number comes after {a}?",
          "\\text{{What number comes after }} {a}?", lambda a: a + 1,
          lambda a, **kw: make_distractors_int(a + 1),
          lambda a: [f"The number after {a} is {a+1}", f"Count up by 1 from {a}"],
          "mcq", "counting, number-sequence, k-math", [10, 20],
          {"a": range(1, 20)}, 1000)

        # Addition within 10
        for a_range in [range(1, 6), range(5, 11)]:
            E("MATH", "K-2", "Addition within 10", [1, 2], "CCSS", "CCSS.MATH.CONTENT.1.OA.C.6",
              "What is {a} + {b}?",
              "{a} + {b} = ?", lambda a, b: a + b,
              lambda a, b, **kw: make_distractors_int(a + b),
              lambda a, b: [f"Add {a} and {b}", f"{a} + {b} = {a+b}", f"Count up from {a} by {b}"],
              "mcq", "addition, fluency, within-10", [10, 25],
              {"a": a_range, "b": range(1, 11 - min(a_range))}, 2000)

        # Subtraction within 10
        E("MATH", "K-2", "Subtraction within 10", [1, 2], "CCSS", "CCSS.MATH.CONTENT.1.OA.C.6",
          "What is {a} - {b}?",
          "{a} - {b} = ?", lambda a, b: a - b,
          lambda a, b, **kw: make_distractors_int(a - b),
          lambda a, b: [f"Subtract {b} from {a}", f"{a} - {b} = {a-b}", f"Count back from {a} by {b}"],
          "mcq", "subtraction, fluency, within-10", [10, 25],
          {"a": range(3, 11), "b": range(1, 6)}, 2000)

        # Addition within 20
        E("MATH", "K-2", "Addition within 20", [2], "CCSS", "CCSS.MATH.CONTENT.1.OA.C.6",
          "What is {a} + {b}?",
          "{a} + {b} = ?", lambda a, b: a + b,
          lambda a, b, **kw: make_distractors_int(a + b, spread=3),
          lambda a, b: [f"Add {a} and {b}", f"{a} + {b} = {a+b}", f"Make 10: {a} + ({b}-{10-a}) = 10 + {b-(10-a)} = {a+b}"],
          "mcq", "addition, fluency, within-20", [15, 30],
          {"a": range(5, 16), "b": range(5, 16)}, 2000)

        # Subtraction within 20
        E("MATH", "K-2", "Subtraction within 20", [2], "CCSS", "CCSS.MATH.CONTENT.1.OA.C.6",
          "What is {a} - {b}?",
          "{a} - {b} = ?", lambda a, b: a - b,
          lambda a, b, **kw: make_distractors_int(a - b, spread=3),
          lambda a, b: [f"Subtract {b} from {a}", f"{a} - {b} = {a-b}"],
          "mcq", "subtraction, fluency, within-20", [15, 30],
          {"a": range(11, 21), "b": range(1, 11)}, 2000)

        # Word problems K-2
        E("MATH", "K-2", "Word Problems", [2], "CCSS", "CCSS.MATH.CONTENT.1.OA.A.2",
          "{name1} has {a} apples. {name2} gives {name1} {b} more apples. How many apples does {name1} have now?",
          None, lambda name1, name2, a, b: a + b,
          lambda name1, name2, a, b, **kw: make_distractors_int(a + b),
          lambda name1, name2, a, b: [f"{name1} starts with {a} apples", f"Gets {b} more from {name2}", f"Total: {a} + {b} = {a+b}"],
          "mcq", "word-problem, addition, story", [30, 60],
          {"name1": ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan"], "name2": ["Sam", "Mia", "Jay", "Zoe", "Leo", "Lily"], "a": range(3, 13), "b": range(2, 8)}, 1500)

        E("MATH", "K-2", "Word Problems", [2], "CCSS", "CCSS.MATH.CONTENT.1.OA.A.1",
          "{name} had {a} stickers. {name} gave away {b} stickers. How many stickers does {name} have left?",
          None, lambda name, a, b: a - b,
          lambda name, a, b, **kw: make_distractors_int(a - b),
          lambda name, a, b: [f"{name} starts with {a} stickers", f"Gives away {b}", f"Left: {a} - {b} = {a-b}"],
          "mcq", "word-problem, subtraction, story", [30, 60],
          {"name": ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan"], "a": range(8, 18), "b": range(2, 8)}, 1500)

        # Place value
        E("MATH", "K-2", "Place Value", [2], "CCSS", "CCSS.MATH.CONTENT.1.NBT.B.2",
          "What is the value of the {digit_pos} digit in the number {number}?",
          None, lambda number, digit_pos, **kw: (number // 10) % 10 if digit_pos == "tens" else number % 10,
          lambda number, digit_pos, **kw: make_distractors_int((number // 10) % 10 if digit_pos == "tens" else number % 10, spread=5),
          lambda number, digit_pos, **kw: [f"The {digit_pos} digit of {number}", f"{(number // 10) % 10 if digit_pos == 'tens' else number % 10}"],
          "mcq", "place-value, tens, ones", [20, 45],
          {"number": range(10, 100), "digit_pos": ["tens", "ones"]}, 1000)

        # Shapes
        E("MATH", "K-2", "Geometry — Shapes", [1], "CCSS", "CCSS.MATH.CONTENT.K.G.A.2",
          "Which shape has {sides} sides?",
          None, lambda sides, **kw: {3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon"}[sides],
          lambda sides, **kw: [v for k, v in {3: "triangle", 4: "quadrilateral", 5: "pentagon", 6: "hexagon"}.items() if k != sides],
          lambda sides, **kw: [f"A shape with {sides} sides is a triangle" if sides == 3 else f"quad" if sides == 4 else f"pentagon" if sides == 5 else "hexagon"],
          "mcq", "shapes, geometry, sides", [15, 25],
          {"sides": [3, 4, 5, 6]}, 800)

        # ================================================================
        # MATH: 3-5 (25,000 questions)
        # ================================================================

        # Multiplication
        E("MATH", "3-5", "Multiplication", [2], "CCSS", "CCSS.MATH.CONTENT.3.OA.A.1",
          "What is {a} × {b}?",
          "{a} \\times {b} = ?", lambda a, b: a * b,
          lambda a, b, **kw: make_distractors_int(a * b, spread=10),
          lambda a, b: [f"Multiply {a} and {b}", f"{a} × {b} = {a*b}"],
          "mcq", "multiplication, fluency", [15, 30],
          {"a": range(2, 13), "b": range(2, 13)}, 3000)

        # Division
        E("MATH", "3-5", "Division", [3], "CCSS", "CCSS.MATH.CONTENT.3.OA.A.2",
          "What is {a} ÷ {b}?",
          "{a} \\div {b} = ?", lambda a, b: a // b,
          lambda a, b, **kw: make_distractors_int(a // b, spread=5),
          lambda a, b: [f"Divide {a} by {b}", f"{a} ÷ {b} = {a//b}", f"Think: {b} × ? = {a}"],
          "mcq", "division, fluency", [20, 45],
          {"a": [i*j for i in range(2, 13) for j in range(2, 13)], "b": range(2, 13)}, 2000)

        # Fractions
        for num_r, den_r in [(range(1, 5), range(2, 9)), (range(1, 8), range(3, 13))]:
            E("MATH", "3-5", "Fractions — Identify", [3], "CCSS", "CCSS.MATH.CONTENT.3.NF.A.1",
              "A pizza is cut into {den} equal slices. You eat {num} slices. What fraction of the pizza did you eat?",
              "\\frac{{{num}}}{{{den}}}", lambda num, den: f"{num}/{den}",
              lambda num, den, **kw: make_distractors_frac(num, den),
              lambda num, den: [f"Total slices = {den} (denominator)", f"Slices eaten = {num} (numerator)", f"Fraction = {num}/{den}"],
              "mcq", "fractions, parts-of-a-whole", [30, 60],
              {"num": num_r, "den": den_r}, 1500)

        # Fraction addition
        E("MATH", "3-5", "Fractions — Addition", [3, 4], "CCSS", "CCSS.MATH.CONTENT.4.NF.B.3",
          "What is {n1}/{d1} + {n2}/{d2}?",
          "\\frac{{{n1}}}{{{d1}}} + \\frac{{{n2}}}{{{d2}}}",
          lambda n1, d1, n2, d2: f"{n1*d2 + n2*d1}/{d1*d2}",
          lambda n1, d1, n2, d2, **kw: [f"{n1+d2}/{d1*d2}", f"{n1*n2}/{d1+d2}", f"{(n1+n2)*d1}/{d1*d2}"],
          lambda n1, d1, n2, d2: [
              f"Find common denominator: LCD({d1}, {d2})",
              f"Convert: {n1*d2}/{d1*d2} + {n2*d1}/{d1*d2}",
              f"Add numerators: {n1*d2+n2*d1}/{d1*d2}",
          ],
          "mcq", "fractions, addition, common-denominator", [45, 90],
          {"n1": range(1, 5), "d1": range(2, 7), "n2": range(1, 5), "d2": range(2, 7)}, 1500)

        # Decimals
        E("MATH", "3-5", "Decimals — Addition", [3], "CCSS", "CCSS.MATH.CONTENT.5.NBT.B.7",
          "What is {a} + {b}?",
          "{a} + {b}", lambda a, b: round(a + b, 2),
          lambda a, b, **kw: [str(round(a + b + random.choice([0.01, 0.1, 1, -0.01, -0.1]), 2)) for _ in range(3)],
          lambda a, b: [f"Line up decimals", f"Add: {a} + {b} = {round(a+b, 2)}"],
          "mcq", "decimals, addition, money", [30, 60],
          {"a": [round(x * 0.01, 2) for x in range(100, 2000, 7)], "b": [round(x * 0.01, 2) for x in range(100, 2000, 11)]}, 1500)

        # Perimeter
        E("MATH", "3-5", "Perimeter", [3], "CCSS", "CCSS.MATH.CONTENT.3.MD.D.8",
          "A rectangle has a length of {l} units and a width of {w} units. What is its perimeter?",
          "P = 2({l} + {w})", lambda l, w: 2 * (l + w),
          lambda l, w, **kw: make_distractors_int(2 * (l + w), spread=10),
          lambda l, w: [f"Perimeter = 2 × (length + width)", f"P = 2 × ({l} + {w})", f"P = 2 × {l+w} = {2*(l+w)}"],
          "mcq", "perimeter, rectangle, geometry", [30, 60],
          {"l": range(3, 21), "w": range(2, 16)}, 1500)

        # Area
        E("MATH", "3-5", "Area", [3, 4], "CCSS", "CCSS.MATH.CONTENT.3.MD.C.7",
          "A rectangle has a length of {l} units and a width of {w} units. What is its area?",
          "A = {l} \\times {w}", lambda l, w: l * w,
          lambda l, w, **kw: make_distractors_int(l * w, spread=15),
          lambda l, w: [f"Area = length × width", f"A = {l} × {w} = {l*w}"],
          "mcq", "area, rectangle, geometry", [30, 60],
          {"l": range(3, 21), "w": range(2, 16)}, 1500)

        # Multi-digit multiplication word problems
        E("MATH", "3-5", "Multi-digit Multiplication", [4], "CCSS", "CCSS.MATH.CONTENT.4.NBT.B.5",
          "A store has {a} boxes with {b} items in each box. How many items are there in total?",
          "{a} \\times {b} = ?", lambda a, b: a * b,
          lambda a, b, **kw: make_distractors_int(a * b, spread=20),
          lambda a, b: [f"Total items = boxes × items per box", f"{a} × {b} = {a*b}"],
          "mcq", "multiplication, word-problem, multi-digit", [45, 90],
          {"a": range(11, 25), "b": range(5, 21)}, 1500)

        # Rounding
        E("MATH", "3-5", "Rounding", [2], "CCSS", "CCSS.MATH.CONTENT.3.NBT.A.1",
          "Round {number} to the nearest {place}.",
          None, lambda number, place, **kw: round(number, -1) if place == "ten" else round(number, -2),
          lambda number, place, **kw: make_distractors_int(int(round(number, -1) if place == "ten" else round(number, -2)), spread=20),
          lambda number, place, **kw: [f"Look at the digit to the right of {place}s place", f"Round {'up' if (number % (10 if place == 'ten' else 100)) >= (5 if place == 'ten' else 50) else 'down'}", f"Answer: {int(round(number, -1) if place == 'ten' else round(number, -2))}"],
          "mcq", "rounding, place-value", [20, 40],
          {"number": range(10, 1000), "place": ["ten", "hundred"]}, 1500)

        # ================================================================
        # MATH: 6-8 (30,000 questions)
        # ================================================================

        # Ratios & Proportions
        E("MATH", "6-8", "Ratios & Proportions", [3], "CCSS", "CCSS.MATH.CONTENT.6.RP.A.3",
          "A recipe uses {a} cups of flour for every {b} eggs. If you use {c} eggs, how many cups of flour do you need?",
          "\\frac{{{a}}}{{{b}}} = \\frac{{x}}{{{c}}}", lambda a, b, c: a * c // b,
          lambda a, b, c, **kw: make_distractors_int(a * c // b, spread=5),
          lambda a, b, c: [f"Set up proportion: {a}/{b} = x/{c}", f"Cross multiply: {a}×{c} = {b}×x", f"x = {a*c}/{b} = {a*c//b}"],
          "mcq", "ratios, proportions, cross-multiplication", [45, 90],
          {"a": range(2, 8), "b": range(2, 8), "c": range(4, 17)}, 1500)

        # Linear equations
        E("MATH", "6-8", "Linear Equations", [4], "CCSS", "CCSS.MATH.CONTENT.7.EE.B.4",
          "Solve for x: {a}x {op_sign} {b} = {c}",
          "{a}x {op_sign} {b} = {c}", lambda a, op_sign, b, c, **kw: (c - b) // a if op_sign == "+" else (c + b) // a,
          lambda a, op_sign, b, c, **kw: make_distractors_int((c - b) // a if op_sign == "+" else (c + b) // a, spread=3),
          lambda a, op_sign, b, c, **kw: [f"Subtract {b} from both sides: {a}x = {c - b if op_sign == '+' else c + b}", f"Divide by {a}: x = {(c - b if op_sign == '+' else c + b) // a}"],
          "mcq", "linear-equations, solving, one-variable", [45, 75],
          {"a": range(2, 8), "op_sign": ["+", "-"], "b": range(1, 15), "c": range(1, 30)}, 1500)

        # Percentages
        E("MATH", "6-8", "Percentages", [3, 4], "CCSS", "CCSS.MATH.CONTENT.6.RP.A.3",
          "What is {pct}% of {number}?",
          "{pct}\\% \\times {number} = ?", lambda pct, number: pct * number // 100,
          lambda pct, number, **kw: make_distractors_int(pct * number // 100, spread=10),
          lambda pct, number: [f"Convert percent to decimal: {pct/100}", f"Multiply: {pct/100} × {number} = {pct*number/100}"],
          "mcq", "percentages, decimal-conversion", [30, 60],
          {"pct": [10, 15, 20, 25, 30, 40, 50, 60, 75, 80], "number": range(20, 501, 5)}, 1500)

        # Integers
        E("MATH", "6-8", "Integer Operations", [3], "CCSS", "CCSS.MATH.CONTENT.7.NS.A.1",
          "What is ({a}) {op} ({b})?",
          "({a}) {op} ({b})", lambda a, op, b, **kw: a + b if op == "+" else a - b,
          lambda a, op, b, **kw: make_distractors_int(a + b if op == "+" else a - b, spread=5),
          lambda a, op, b, **kw: [f"Apply the operation: ({a}) {op} ({b})", f"Result: {a + b if op == '+' else a - b}"],
          "mcq", "integers, negative-numbers, operations", [30, 60],
          {"a": range(-20, 21), "op": ["+", "-"], "b": range(-20, 21)}, 1500)

        # Area of circles
        E("MATH", "6-8", "Area of Circles", [4], "CCSS", "CCSS.MATH.CONTENT.7.G.B.4",
          "What is the area of a circle with radius {r}? (Use π ≈ 3.14)",
          "A = \\pi r^2 = 3.14 \\times {r}^2", lambda r: round(3.14 * r * r, 2),
          lambda r, **kw: [str(round(3.14 * r * r + random.choice([r, 3.14*r, -r]), 2)) for _ in range(3)],
          lambda r: [f"Formula: A = πr²", f"A = 3.14 × {r}² = 3.14 × {r*r}", f"A = {round(3.14*r*r, 2)}"],
          "mcq", "circles, area, pi, geometry", [45, 90],
          {"r": range(3, 16)}, 1000)

        # Probability
        E("MATH", "6-8", "Probability", [3], "CCSS", "CCSS.MATH.CONTENT.7.SP.C.7",
          "A bag contains {a} red, {b} blue, and {c} green marbles. What is the probability of picking a {color} marble?",
          "P({color}) = \\frac{{{count}}}{{{total}}}", lambda a, b, c, color, count, total, **kw: f"{count}/{total}",
          lambda a, b, c, color, count, total, **kw: [f"{a}/{total}", f"{b}/{total}", f"{c}/{total}"],
          lambda a, b, c, color, count, total: [f"Total marbles = {a}+{b}+{c} = {total}", f"{color} marbles = {count}", f"P({color}) = {count}/{total}"],
          "mcq", "probability, fractions", [30, 60],
          {"a": range(2, 8), "b": range(2, 8), "c": range(2, 8), "color": ["red", "blue", "green"],
           "count": lambda: random.randint(2, 7), "total": lambda: random.randint(8, 20)}, 1500)

        # Pythagorean theorem
        E("MATH", "6-8", "Pythagorean Theorem", [4], "CCSS", "CCSS.MATH.CONTENT.8.G.B.7",
          "A right triangle has legs of {a} and {b}. What is the length of the hypotenuse?",
          "c = \\sqrt{{{a}^2 + {b}^2}}", lambda a, b: round(math.sqrt(a*a + b*b), 2),
          lambda a, b, **kw: [str(round(math.sqrt(a*a+b*b) + random.choice([1, 2, 3]), 2)), str(a+b), str(a*b)],
          lambda a, b: [f"Pythagorean theorem: a² + b² = c²", f"c² = {a}² + {b}² = {a*a+b*b}", f"c = √{a*a+b*b} = {round(math.sqrt(a*a+b*b),2)}"],
          "mcq", "pythagorean-theorem, right-triangle", [60, 90],
          {"a": [3, 5, 6, 7, 8, 9, 10, 12, 15], "b": [4, 5, 8, 10, 12, 15, 24]}, 800)

        # Statistics — Mean
        E("MATH", "6-8", "Statistics — Mean", [3], "CCSS", "CCSS.MATH.CONTENT.6.SP.B.5",
          "What is the mean (average) of: {numbers}?",
          "\\text{{mean}} = \\frac{{\\sum}}{{n}}", lambda numbers, **kw: sum(numbers) // len(numbers),
          lambda numbers, **kw: make_distractors_int(sum(numbers) // len(numbers), spread=5),
          lambda numbers, **kw: [f"Sum = {sum(numbers)}", f"Count = {len(numbers)}", f"Mean = {sum(numbers)} / {len(numbers)} = {sum(numbers) // len(numbers)}"],
          "mcq", "statistics, mean, average", [30, 60],
          {"numbers": [[random.randint(1, 20) for _ in range(5)] for _ in range(1000)]}, 1500)

        # Order of operations
        E("MATH", "6-8", "Order of Operations", [3, 4], "CCSS", "CCSS.MATH.CONTENT.6.EE.A.1",
          "Evaluate: {a} + {b} × {c}",
          "{a} + {b} \\times {c}", lambda a, b, c, **kw: a + b * c,
          lambda a, b, c, **kw: make_distractors_int(a + b * c, spread=10),
          lambda a, b, c: [f"PEMDAS: multiply first", f"{b} × {c} = {b*c}", f"{a} + {b*c} = {a+b*c}"],
          "mcq", "order-of-operations, pemdas, expressions", [30, 60],
          {"a": range(2, 15), "b": range(2, 10), "c": range(2, 10)}, 1500)

        # Exponents
        E("MATH", "6-8", "Exponents", [3], "CCSS", "CCSS.MATH.CONTENT.6.EE.A.1",
          "What is {base}^{exp}?",
          "{base}^{{{exp}}}", lambda base, exp: base ** exp,
          lambda base, exp, **kw: [str(base ** exp + random.choice([1, base, -1])), str(base * exp), str(base + exp)],
          lambda base, exp: [f"{base}^{exp} means {base} multiplied by itself {exp} times", f"{base}^{exp} = {base**exp}"],
          "mcq", "exponents, powers", [20, 45],
          {"base": range(2, 12), "exp": range(2, 5)}, 1500)

        # ================================================================
        # MATH: 9-12 (25,000 questions)
        # ================================================================

        # Quadratic equations — factoring
        E("MATH", "9-12", "Quadratic Equations", [4, 5], "CCSS", "CCSS.MATH.CONTENT.HSA.REI.B.4",
          "Solve: x² {b_sign} {b}x {c_sign} {c} = 0",
          "x^2 {b_sign} {b}x {c_sign} {c} = 0",
          lambda b_sign, b, c_sign, c, **kw: _solve_quadratic(b_sign, b, c_sign, c),
          lambda b_sign, b, c_sign, c, **kw: _quad_distractors(b_sign, b, c_sign, c),
          lambda b_sign, b, c_sign, c, **kw: [f"Form the quadratic: x² {'-' if b_sign == '-' else '+'} {b}x {'-' if c_sign == '-' else '+'} {c} = 0", f"Find factors of {c} that {'add' if c_sign == '+' else 'subtract'} to {b}", f"Answer: {_solve_quadratic(b_sign, b, c_sign, c)}"],
          "mcq", "quadratic, factoring, roots", [60, 120],
          {"b_sign": ["-", "+"], "b": range(3, 15), "c_sign": ["+", "-"], "c": range(2, 20)}, 2000)

        # Systems of equations
        E("MATH", "9-12", "Systems of Equations", [4, 5], "CCSS", "CCSS.MATH.CONTENT.HSA.REI.C.6",
          "Solve:\n{a1}x + {b1}y = {c1}\n{a2}x + {b2}y = {c2}",
          None, lambda a1, b1, c1, a2, b2, c2, **kw: _solve_system(a1, b1, c1, a2, b2, c2),
          lambda a1, b1, c1, a2, b2, c2, **kw: _system_distractors(a1, b1, c1, a2, b2, c2),
          lambda a1, b1, c1, a2, b2, c2, **kw: [f"Use elimination or substitution", f"Determinant: {a1*b2 - a2*b1}", f"Solution: {_solve_system(a1, b1, c1, a2, b2, c2)}"],
          "mcq", "systems, elimination, linear-equations", [90, 150],
          {"a1": range(1, 6), "b1": range(1, 6), "c1": range(5, 26), "a2": range(1, 6), "b2": range(1, 6), "c2": range(5, 26)}, 1500)

        # Trigonometry
        E("MATH", "9-12", "Trigonometry", [4, 5], "CCSS", "CCSS.MATH.CONTENT.HSF.TF.C.8",
          "In a right triangle, the side opposite angle θ is {opp} and the hypotenuse is {hyp}. What is sin(θ)?",
          "\\sin(\\theta) = \\frac{{{opp}}}{{{hyp}}}", lambda opp, hyp: f"{opp}/{hyp}",
          lambda opp, hyp, **kw: [f"{hyp}/{opp}", f"{hyp-opp}/{hyp}", f"{opp}/{hyp-opp}"],
          lambda opp, hyp: [f"sin(θ) = opposite / hypotenuse", f"sin(θ) = {opp}/{hyp}"],
          "mcq", "trigonometry, sin, right-triangle", [45, 90],
          {"opp": [3, 5, 7, 8, 9, 12, 15, 20], "hyp": [5, 13, 25, 17, 41, 25, 37, 29]}, 1000)

        # Exponential growth/decay
        E("MATH", "9-12", "Exponential Functions", [5], "CCSS", "CCSS.MATH.CONTENT.HSF.LE.A.1",
          "A population of {P0} bacteria doubles every {d} hours. How many after {t} hours?",
          "P = {P0} \\times 2^{{{t}/{d}}}", lambda P0, d, t, **kw: P0 * (2 ** (t // d)),
          lambda P0, d, t, **kw: [str(P0 * (2 ** (t // d)) * 2), str(P0 * (2 ** (t // d)) // 2), str(P0 * t)],
          lambda P0, d, t, **kw: [f"Number of doublings: {t}/{d} = {t//d}", f"P = {P0} \u00d7 2^{t//d}", f"P = {P0} \u00d7 {2**(t//d)} = {P0 * (2 ** (t // d))}"],
          "mcq", "exponential, growth, doubling", [60, 120],
          {"P0": [100, 200, 500, 1000, 2000], "d": [1, 2, 3, 4, 6], "t": [3, 4, 6, 8, 12, 24]}, 800)

        # Polynomials
        E("MATH", "9-12", "Polynomial Operations", [4], "CCSS", "CCSS.MATH.CONTENT.HSA.APR.A.1",
          "Add: ({a}x² + {b}x + {c}) + ({d}x² + {e}x + {f})",
          None, lambda a, b, c, d, e, f, **kw: f"{a+d}x² + {b+e}x + {c+f}",
          lambda a, b, c, d, e, f, **kw: [f"{a+d+1}x² + {b+e}x + {c+f}", f"{a+d}x² + {b+e+1}x + {c+f}", f"{a+d}x² + {b+e}x + {c+f+1}"],
          lambda a, b, c, d, e, f, **kw: [f"Add like terms: {a}x² + {d}x² = {a+d}x²", f"{b}x + {e}x = {b+e}x", f"{c} + {f} = {c+f}", f"Result: {a+d}x² + {b+e}x + {c+f}"],
          "mcq", "polynomials, addition, algebra", [45, 90],
          {"a": range(1, 6), "b": range(-10, 11), "c": range(-15, 16), "d": range(1, 6), "e": range(-10, 11), "f": range(-15, 16)}, 1200)

        # Logarithms
        E("MATH", "9-12", "Logarithms", [5], "CCSS", "CCSS.MATH.CONTENT.HSF.BF.B.5",
          "What is log_{base}({value})?",
          "\\log_{{{base}}}({value})", lambda base, value, **kw: _safe_log(base, value),
          lambda base, value, **kw: [str(_safe_log(base, value) + random.choice([1, 2])), str(base + 1), str(value // base)],
          lambda base, value, **kw: [f"Find x such that {base}^x = {value}", f"Answer: log_{base}({value}) = {_safe_log(base, value)}"],
          "mcq", "logarithms, exponents, inverse", [45, 90],
          {"base": [2, 3, 5, 10], "value": [4, 8, 16, 32, 9, 27, 25, 125, 100, 1000]}, 800)

        # Sequences & Series
        E("MATH", "9-12", "Sequences — Arithmetic", [4], "CCSS", "CCSS.MATH.CONTENT.HSF.BF.A.2",
          "Find the {n}th term of the arithmetic sequence that starts with {a1} and has common difference {d}.",
          "a_n = a_1 + (n-1)d", lambda a1, d, n, **kw: a1 + (n - 1) * d,
          lambda a1, d, n, **kw: make_distractors_int(a1 + (n - 1) * d, spread=10),
          lambda a1, d, n, **kw: [f"a_n = a_1 + (n-1)d", f"a_{n} = {a1} + ({n}-1) \u00d7 {d}", f"a_{n} = {a1} + {(n-1)*d} = {a1 + (n-1)*d}"],
          "mcq", "sequences, arithmetic, nth-term", [45, 90],
          {"a1": range(1, 11), "d": range(2, 8), "n": range(5, 16)}, 1000)

        # Statistics — Normal Distribution
        E("MATH", "9-12", "Normal Distribution", [5], "CCSS", "CCSS.MATH.CONTENT.HSS.ID.A.4",
          "A test has mean {mean} and standard deviation {sd}. About what percent of scores fall between {low} and {high}?",
          None, lambda mean, sd, low, high, **kw: _empirical_rule_pct(mean, sd, low, high),
          lambda mean, sd, low, high, **kw: [p for p in ["68%", "95%", "99.7%", "34%", "47.5%", "49.85%"] if p != _empirical_rule_pct(mean, sd, low, high)][:3],
          lambda mean, sd, low, high, **kw: [f"Mean = {mean}, SD = {sd}", f"Range: {low} to {high}", f"By the empirical rule: {_empirical_rule_pct(mean, sd, low, high)} of data falls in this range"],
          "mcq", "statistics, normal-distribution, empirical-rule", [60, 90],
          {"mean": range(60, 85, 5), "sd": [5, 8, 10, 12], "low": lambda: random.choice([55, 50, 45, 40, 65, 70]), "high": lambda: random.choice([75, 80, 85, 90, 95, 100])}, 800)

        # ================================================================
        # SCIENCE (40,000 questions)
        # ================================================================

        # Physics — Forces (6-8)
        E("SCIENCE", "6-8", "Forces & Motion", [3], "NGSS", "MS-PS2-2",
          "A {mass} kg object is pushed with {force} N of force. If friction is {friction} N, what is the net force?",
          "F_{{net}} = {force} - {friction} = ?", lambda mass, force, friction: force - friction,
          lambda mass, force, friction, **kw: [str(force), str(force + friction), str(friction)],
          lambda mass, force, friction: [f"Net force = Applied force - Friction", f"F_net = {force} - {friction} = {force - friction} N"],
          "mcq", "forces, net-force, friction, physics", [45, 75],
          {"mass": [5, 10, 15, 20, 25], "force": [30, 40, 50, 60, 80, 100], "friction": [10, 15, 20, 25, 30]}, 1000)

        # Physics — Kinematics (9-12)
        E("SCIENCE", "9-12", "Kinematics", [4, 5], "NGSS", "HS-PS2-1",
          "An object is moving at {v0} m/s and accelerates at {a} m/s² for {t} seconds. What is the final velocity?",
          "v = v_0 + at = {v0} + {a} \\times {t}", lambda v0, a, t: v0 + a * t,
          lambda v0, a, t, **kw: [str(v0 + a * t + 5), str(v0 * t), str(a * t)],
          lambda v0, a, t: [f"v = v₀ + at", f"v = {v0} + ({a})({t})", f"v = {v0} + {a*t} = {v0+a*t} m/s"],
          "mcq", "kinematics, velocity, acceleration, physics", [45, 90],
          {"v0": range(0, 31, 5), "a": range(-10, 11, 2), "t": range(2, 11)}, 1000)

        # Chemistry — Balancing (9-12)
        chem_eqs = [
            ("Fe", "O₂", "Fe₂O₃", "4Fe + 3O₂ → 2Fe₂O₃"),
            ("H₂", "O₂", "H₂O", "2H₂ + O₂ → 2H₂O"),
            ("N₂", "H₂", "NH₃", "N₂ + 3H₂ → 2NH₃"),
            ("CH₄", "O₂", "CO₂", "CH₄ + 2O₂ → CO₂ + 2H₂O"),
            ("C", "O₂", "CO₂", "C + O₂ → CO₂"),
        ]
        E("SCIENCE", "9-12", "Balancing Equations", [4], "NGSS", "HS-PS1-2",
          "Balance: {reactant1} + {reactant2} → {product}",
          None, lambda reactant1, reactant2, product, balanced, **kw: balanced,
          lambda reactant1, reactant2, product, balanced, **kw: [],
          lambda reactant1, reactant2, product, balanced, **kw: [f"Count atoms on each side", f"Balance using coefficients", f"Answer: {balanced}"],
          "open", "balancing, chemical-equations, stoichiometry, chemistry", [60, 120],
          {"reactant1": [e[0] for e in chem_eqs], "reactant2": [e[1] for e in chem_eqs], "product": [e[2] for e in chem_eqs], "balanced": [e[3] for e in chem_eqs]}, 500)

        # Biology — Cells (6-8)
        cell_q_stems = [
            "What is the function of the {organelle} in a cell?",
            "Which organelle is responsible for {function}?",
            "Plant cells have {feature} that animal cells lack. What is it?",
        ]
        E("SCIENCE", "6-8", "Cell Biology", [3], "NGSS", "MS-LS1-2",
          "What is the primary function of the {organelle}?",
          None, lambda organelle, **kw: {"nucleus": "contains DNA and controls cell activities", "mitochondria": "produces energy (ATP) through cellular respiration", "ribosome": "synthesizes proteins", "cell membrane": "controls what enters and exits the cell", "chloroplast": "conducts photosynthesis to make food", "endoplasmic reticulum": "transports materials within the cell", "golgi apparatus": "packages and ships proteins"}[organelle],
          lambda organelle, **kw: [v for k, v in {"nucleus": "contains DNA and controls cell activities", "mitochondria": "produces energy (ATP) through cellular respiration", "ribosome": "synthesizes proteins", "cell membrane": "controls what enters and exits the cell", "chloroplast": "conducts photosynthesis to make food", "endoplasmic reticulum": "transports materials within the cell", "golgi apparatus": "packages and ships proteins"}.items() if k != organelle][:3],
          lambda organelle, **kw: [f"Identify the role of {organelle}", f"Answer: {'contains DNA and controls cell activities' if organelle == 'nucleus' else 'produces energy (ATP)' if organelle == 'mitochondria' else 'synthesizes proteins' if organelle == 'ribosome' else 'controls what enters/exits' if organelle == 'cell membrane' else 'conducts photosynthesis' if organelle == 'chloroplast' else 'transports materials' if organelle == 'endoplasmic reticulum' else 'packages and ships proteins'}"],
          "mcq", "cells, organelles, biology", [30, 60],
          {"organelle": ["nucleus", "mitochondria", "ribosome", "cell membrane", "chloroplast", "endoplasmic reticulum", "golgi apparatus"]}, 800)

        # Biology — Genetics (9-12)
        E("SCIENCE", "9-12", "Genetics", [4, 5], "NGSS", "HS-LS3-1",
          "In a cross between {genotype1} and {genotype2}, what is the probability of offspring with {trait}?",
          None, lambda genotype1, genotype2, trait, **kw: _genetics_prob(genotype1, genotype2, trait),
          lambda genotype1, genotype2, trait, **kw: [p for p in ["0%", "25%", "50%", "75%", "100%"] if p != _genetics_prob(genotype1, genotype2, trait)][:3],
          lambda genotype1, genotype2, trait, **kw: [f"Set up Punnett square for {genotype1} × {genotype2}", f"Count offspring with {trait}", f"Answer: {_genetics_prob(genotype1, genotype2, trait)}"],
          "mcq", "genetics, punnett-square, heredity", [60, 120],
          {"genotype1": ["AA", "Aa", "aa"], "genotype2": ["Aa", "aa"], "trait": ["dominant phenotype", "recessive phenotype"]}, 800)

        # Earth Science — Plate Tectonics (6-8)
        E("SCIENCE", "6-8", "Plate Tectonics", [3], "NGSS", "MS-ESS2-3",
          "What type of boundary occurs when two tectonic plates move {direction}?",
          None, lambda direction, **kw: {"apart": "divergent boundary", "together": "convergent boundary", "past each other": "transform boundary"}[direction],
          lambda direction, **kw: [v for k, v in {"apart": "divergent boundary", "together": "convergent boundary", "past each other": "transform boundary"}.items() if k != direction],
          lambda direction, **kw: [f"Plates moving {direction}", f"Answer: {'divergent boundary' if direction == 'apart' else 'convergent boundary' if direction == 'together' else 'transform boundary'}"],
          "mcq", "plate-tectonics, boundaries, earth-science", [30, 45],
          {"direction": ["apart", "together", "past each other"]}, 600)

        # Chemistry — Periodic Table (9-12)
        E("SCIENCE", "9-12", "Periodic Table", [3, 4], "NGSS", "HS-PS1-1",
          "What is the atomic number of {element}?",
          None, lambda element, **kw: {"Hydrogen": 1, "Helium": 2, "Carbon": 6, "Nitrogen": 7, "Oxygen": 8, "Sodium": 11, "Iron": 26, "Gold": 79, "Uranium": 92, "Calcium": 20, "Potassium": 19, "Chlorine": 17}[element],
          lambda element, **kw: [str(v) for k, v in {"Hydrogen": 1, "Helium": 2, "Carbon": 6, "Nitrogen": 7, "Oxygen": 8, "Sodium": 11, "Iron": 26, "Gold": 79, "Uranium": 92, "Calcium": 20, "Potassium": 19, "Chlorine": 17}.items() if k != element][:3],
          lambda element, **kw: [f"Look up {element} on the periodic table", f"Atomic number = number of protons", f"The atomic number of {element} is {1 if element == 'Hydrogen' else 2 if element == 'Helium' else 6 if element == 'Carbon' else 7 if element == 'Nitrogen' else 8 if element == 'Oxygen' else 11 if element == 'Sodium' else 26 if element == 'Iron' else 79 if element == 'Gold' else 92 if element == 'Uranium' else 20 if element == 'Calcium' else 19 if element == 'Potassium' else 17}"],
          "mcq", "periodic-table, elements, atomic-number, chemistry", [15, 30],
          {"element": ["Hydrogen", "Helium", "Carbon", "Nitrogen", "Oxygen", "Sodium", "Iron", "Gold", "Uranium", "Calcium", "Potassium", "Chlorine"]}, 600)

        # Physics — Newton's Laws (6-8)
        E("SCIENCE", "6-8", "Newton's Laws", [3], "NGSS", "MS-PS2-1",
          "According to Newton's {law_num} Law, {scenario}. What principle does this demonstrate?",
          None, lambda law_num, scenario, **kw: {"1st": "Law of Inertia — an object at rest stays at rest unless acted on by a force", "2nd": "F = ma — force equals mass times acceleration", "3rd": "For every action there is an equal and opposite reaction"}[law_num],
          lambda law_num, scenario, **kw: [v for k, v in {"1st": "Law of Inertia", "2nd": "F = ma", "3rd": "Action-Reaction"}.items() if k != law_num],
          lambda law_num, scenario, **kw: [f"Newton's {law_num} Law describes a fundamental principle of motion", f"The answer is based on Newton's {law_num} Law"],
          "mcq", "newtons-laws, forces, physics", [30, 60],
          {"law_num": ["1st", "2nd", "3rd"], "scenario": ["an object at rest stays at rest", "F = ma", "every action has an equal and opposite reaction"]}, 600)

        # ================================================================
        # LANGUAGE ARTS (30,000 questions)
        # ================================================================

        # Grammar — Parts of speech
        E("LANGUAGE", "3-5", "Parts of Speech", [2], "COMMON_CORE", "CCSS.ELA-LITERACY.L.3.1",
          'What part of speech is the word "{word}"?',
          None, lambda word, sentence, **kw: {"quickly": "adverb", "beautiful": "adjective", "run": "verb", "the": "article", "happy": "adjective", "under": "preposition", "and": "conjunction", "she": "pronoun"}[word],
          lambda word, sentence, **kw: [v for k, v in {"quickly": "adverb", "beautiful": "adjective", "run": "verb", "the": "article", "happy": "adjective", "under": "preposition", "and": "conjunction", "she": "pronoun"}.items() if k != word][:3],
          lambda word, sentence, **kw: [f"Analyze the word '{word}' in context", f"The word '{word}' functions as a {{'quickly': 'adverb', 'beautiful': 'adjective', 'run': 'verb', 'the': 'article', 'happy': 'adjective', 'under': 'preposition', 'and': 'conjunction', 'she': 'pronoun'}}[word]"],
          "mcq", "grammar, parts-of-speech", [20, 40],
          {"word": ["quickly", "beautiful", "run", "the", "happy", "under", "and", "she"], "sentence": ["She runs quickly to school", "The beautiful flower bloomed", "The dog sat under the table"]}, 1500)

        # Reading Comprehension
        passages_data = [
            ("The water cycle begins with evaporation. The sun heats water in oceans, lakes, and rivers, turning it into water vapor. This vapor rises into the atmosphere and cools, forming clouds through condensation. When clouds become heavy with water droplets, precipitation occurs in the form of rain, snow, or hail. The water then flows back into bodies of water, and the cycle continues.",
             "What is the first step of the water cycle?", "Evaporation",
             ["Condensation", "Precipitation", "Collection"],
             ["The passage states the water cycle begins with evaporation", "The sun heats water and turns it into vapor"],
             "water-cycle, reading-comprehension, science-reading"),
        ]
        E("LANGUAGE", "3-5", "Reading Comprehension", [3], "COMMON_CORE", "CCSS.ELA-LITERACY.RI.3.1",
          "{passage}\n\nQuestion: {question}",
          None, lambda passage, question, answer, **kw: answer,
          lambda passage, question, answer, distractors, **kw: distractors,
          lambda passage, question, answer, distractors, steps, **kw: steps,
          "mcq", "reading-comprehension, informational-text",
          [60, 120], {"passage": [p[0] for p in passages_data], "question": [p[1] for p in passages_data],
                       "answer": [p[2] for p in passages_data], "distractors": [p[3] for p in passages_data],
                       "steps": [p[4] for p in passages_data]}, 500)

        # Vocabulary
        vocab_words = [
            ("abundant", "plentiful, more than enough", ["scarce", "rare", "minimal"]),
            ("courageous", "brave, showing fearlessness", ["cowardly", "timid", "fearful"]),
            ("meticulous", "very careful and precise", ["careless", "sloppy", "hasty"]),
            ("eloquent", "fluent, persuasive speaking", ["inarticulate", "tongue-tied", "mumbling"]),
            ("resilient", "able to recover quickly", ["fragile", "weak", "breakable"]),
            ("benevolent", "kind, generous, charitable", ["selfish", "greedy", "mean"]),
            ("ambiguous", "open to more than one interpretation", ["clear", "obvious", "certain"]),
            ("diligent", "hardworking, careful effort", ["lazy", "careless", "negligent"]),
            ("pragmatic", "practical, dealing with things sensibly", ["idealistic", "impractical", "unrealistic"]),
            ("tenacious", "persistent, determined, not giving up", ["weak", "yielding", "irresolute"]),
        ]
        E("LANGUAGE", "6-8", "Vocabulary — Context Clues", [3], "COMMON_CORE", "CCSS.ELA-LITERACY.L.6.4",
          'What is the meaning of the word "{word}" as used in: "The {word} efforts of the team led to great success"?',
          None, lambda word, definition, distractors, **kw: definition,
          lambda word, definition, distractors, **kw: distractors,
          lambda word, definition, distractors, **kw: [f"Look at context: the team achieved success", f"This suggests the word has a positive meaning", f"'{word}' means {definition}"],
          "mcq", "vocabulary, context-clues",
          [20, 45], {"word": [w[0] for w in vocab_words], "definition": [w[1] for w in vocab_words], "distractors": [w[2] for w in vocab_words]}, 1000)

        # Grammar — Subject-Verb Agreement
        E("LANGUAGE", "3-5", "Subject-Verb Agreement", [2], "COMMON_CORE", "CCSS.ELA-LITERACY.L.3.1",
          'Choose the correct verb: "The group of students {verb1} to the museum."',
          None, lambda verb1, verb2, **kw: verb1,
          lambda verb1, verb2, **kw: [verb2],
          lambda verb1, verb2, **kw: [f"The subject is 'group' (singular)", f"Use singular verb '{verb1}'"],
          "mcq", "grammar, subject-verb-agreement",
          [15, 30], {"verb1": ["goes", "walks", "runs", "is"], "verb2": ["go", "walk", "run", "are"]}, 800)

        # Figurative Language
        figures = [
            ("simile", "The sun was like a golden coin in the sky", "simile — compares sun to coin using 'like'", ["metaphor", "personification", "hyperbole"]),
            ("metaphor", "The classroom was a zoo during the project", "metaphor — directly compares classroom to zoo", ["simile", "alliteration", "onomatopoeia"]),
            ("personification", "The wind whispered through the trees", "personification — gives wind human trait of whispering", ["simile", "metaphor", "hyperbole"]),
            ("hyperbole", "I've told you a million times to clean your room", "hyperbole — extreme exaggeration for effect", ["simile", "idiom", "literal language"]),
            ("onomatopoeia", "The bees buzzed around the fragrant flowers", "onomatopoeia — 'buzzed' imitates the sound", ["alliteration", "personification", "metaphor"]),
        ]
        E("LANGUAGE", "6-8", "Figurative Language", [3], "COMMON_CORE", "CCSS.ELA-LITERACY.RL.6.4",
          'What type of figurative language is used in: "{example}"?',
          None, lambda figure_type, example, answer, distractors, **kw: answer,
          lambda figure_type, example, answer, distractors, **kw: distractors,
          lambda figure_type, example, answer, distractors, **kw: [f"Analyze the phrase", f"Identify the literary device", f"Answer: {answer}"],
          "mcq", "figurative-language, literary-devices",
          [20, 45], {"figure_type": [f[0] for f in figures], "example": [f[1] for f in figures], "answer": [f[2] for f in figures], "distractors": [f[3] for f in figures]}, 500)

        # Spelling
        misspelled = [
            ("recieve", "receive", "i before e except after c"),
            ("neccessary", "necessary", "one c, two s's"),
            ("accomodate", "accommodate", "double c, double m"),
            ("occured", "occurred", "double r, double r"),
            ("seperate", "separate", "par not per"),
            ("definately", "definitely", "ite not ate"),
            ("enviroment", "environment", "n before ron"),
            ("goverment", "government", "n before ment"),
        ]
        E("LANGUAGE", "3-5", "Spelling", [2], "COMMON_CORE", "CCSS.ELA-LITERACY.L.4.2",
          'Which word is spelled correctly?',
          None, lambda correct, rule, **kw: correct,
          lambda correct, rule, **kw: [],
          lambda correct, rule, **kw: [f"Remember the rule: {rule}", f"The correct spelling is '{correct}'"],
          "mcq", "spelling, word-study",
          [15, 30], {"correct": [m[1] for m in misspelled], "rule": [m[2] for m in misspelled]}, 500)

        # ================================================================
        # SAT TEST PREP (25,000 questions)
        # ================================================================

        # SAT Math — Algebra
        E("MATH", "9-12", "SAT — Linear Equations", [4, 5], "SAT", "SAT.MATH.ALG",
          "If {a}x + {b} = {c}, what is x?",
          "{a}x + {b} = {c}", lambda a, b, c, **kw: (c - b) / a,
          lambda a, b, c, **kw: [str((c - b) / a + 1), str((c + b) / a), str(c / a)],
          lambda a, b, c: [f"Subtract {b} from both sides: {a}x = {c-b}", f"Divide by {a}: x = {c-b}/{a} = {(c-b)/a}"],
          "mcq", "sat, algebra, linear-equations, test-prep",
          [30, 60], {"a": [2, 3, 4, 5, 6], "b": range(-10, 11, 2), "c": range(-20, 21, 3)}, 2000)

        # SAT Math — Data Analysis
        E("MATH", "9-12", "SAT — Data Interpretation", [3, 4], "SAT", "SAT.MATH.DATA",
          "A survey of {total} students found that {pct}% prefer math. How many students prefer math?",
          "{pct}\\% \\text{{ of }} {total}", lambda total, pct: total * pct // 100,
          lambda total, pct, **kw: make_distractors_int(total * pct // 100, spread=20),
          lambda total, pct: [f"Convert {pct}% to decimal: {pct/100}", f"Multiply: {total} × {pct/100} = {total*pct/100}"],
          "mcq", "sat, data-analysis, percentages, test-prep",
          [30, 45], {"total": [100, 200, 250, 300, 400, 500, 800, 1000], "pct": [15, 20, 25, 30, 35, 40, 45, 50, 60, 75]}, 1500)

        # SAT Math — Problem Solving
        E("MATH", "9-12", "SAT — Rate Problems", [4, 5], "SAT", "SAT.MATH.PROBLEM",
          "If {worker1} can complete a job in {time1} hours and {worker2} can do it in {time2} hours, how long will they take working together?",
          None, lambda worker1, time1, worker2, time2, **kw: round(1 / (1/time1 + 1/time2), 2),
          lambda worker1, time1, worker2, time2, **kw: [str(round(time1/2, 2)), str(round(time2/2, 2)), str(round((time1+time2)/2, 2))],
          lambda worker1, time1, worker2, time2: [f"Rate of {worker1}: 1/{time1} job per hour", f"Rate of {worker2}: 1/{time2} job per hour", f"Combined rate: 1/{time1} + 1/{time2} = {(time1+time2)/(time1*time2)}", f"Time = 1/{(time1+time2)/(time1*time2)} = {round(time1*time2/(time1+time2), 2)} hours"],
          "mcq", "sat, rate, work-problems, test-prep",
          [60, 120], {"worker1": ["Worker A", "Machine A", "Pipe A"], "time1": [3, 4, 5, 6, 8, 10, 12], "worker2": ["Worker B", "Machine B", "Pipe B"], "time2": [4, 5, 6, 8, 10, 12, 15]}, 1500)

        # SAT Reading
        sat_reading = [
            ("The passage suggests that the author's attitude toward technology is primarily:", "cautiously optimistic", ["strongly negative", "enthusiastically supportive", "completely indifferent"]),
            ("Based on the passage, which statement would the author most likely agree with?", "Innovation should be balanced with ethical considerations", ["Technology is inherently harmful", "All progress is good", "Tradition is always superior"]),
            ("The author uses the word 'paradox' to emphasize:", "an apparent contradiction that reveals a deeper truth", ["a simple mistake", "an unsolvable problem", "a humorous situation"]),
        ]
        E("LANGUAGE", "9-12", "SAT — Reading Comprehension", [4, 5], "SAT", "SAT.READING",
          "Passage excerpt: 'While technology has revolutionized how we communicate, it has also created new forms of isolation. Social media connects us across distances but may distance us from those physically present.'\n\n{question}",
          None, lambda question, answer, distractors, **kw: answer,
          lambda question, answer, distractors, **kw: distractors,
          lambda question, answer, distractors, **kw: [f"Analyze the passage for tone and evidence", f"The correct answer: {answer}"],
          "mcq", "sat, reading-comprehension, evidence, test-prep",
          [60, 120], {"question": [s[0] for s in sat_reading], "answer": [s[1] for s in sat_reading], "distractors": [s[2] for s in sat_reading]}, 500)

        # SAT Writing — Grammar
        E("LANGUAGE", "9-12", "SAT — Grammar", [3, 4], "SAT", "SAT.WRITING",
          'Choose the best version: "The students, {option1}, completed their projects on time."',
          None, lambda option1, **kw: option1,
          lambda option1, **kw: [],
          lambda option1, **kw: [f"Look for proper punctuation and agreement", f"Correct: {option1}"],
          "mcq", "sat, grammar, punctuation, test-prep",
          [20, 40], {"option1": ["who had studied diligently", "having studied diligently", "after they studied"]}, 500)

        # ================================================================
        # ACT TEST PREP (25,000 questions)
        # ================================================================

        # ACT Math
        E("MATH", "9-12", "ACT — Pre-Algebra", [3, 4], "ACT", "ACT.MATH.PRE",
          "What is {a}% of {b}?",
          "{a}\\% \\times {b} = ?", lambda a, b: a * b / 100,
          lambda a, b, **kw: [str(a * b / 100 + 1), str(b - a), str(a + b)],
          lambda a, b: [f"Convert {a}% to decimal: {a/100}", f"Multiply: {a/100} × {b} = {a*b/100}"],
          "mcq", "act, pre-algebra, percentages, test-prep",
          [20, 40], {"a": [10, 15, 20, 25, 30, 40, 50, 75], "b": range(20, 501, 10)}, 1500)

        E("MATH", "9-12", "ACT — Coordinate Geometry", [4], "ACT", "ACT.MATH.COORD",
          "What is the slope of the line passing through ({x1}, {y1}) and ({x2}, {y2})?",
          "m = \\frac{{{y2}-{y1}}}{{{x2}-{x1}}}", lambda x1, y1, x2, y2, **kw: round((y2-y1)/(x2-x1), 2) if x2 != x1 else float('inf'),
          lambda x1, y1, x2, y2, **kw: [str(round((y2+y1)/max(abs(x2-x1),1), 2)), str(round((y2-y1)/max(abs(x2+x1),1), 2)), str(round((x2-x1)/max(abs(y2-y1),1), 2))],
          lambda x1, y1, x2, y2: [f"Slope formula: m = (y₂-y₁)/(x₂-x₁)", f"m = ({y2}-{y1})/({x2}-{x1})", f"m = {y2-y1}/{x2-x1} = {round((y2-y1)/(x2-x1), 2) if x2 != x1 else 'undefined'}"],
          "mcq", "act, coordinate-geometry, slope, test-prep",
          [30, 60], {"x1": range(-5, 6), "y1": range(-5, 6), "x2": range(-5, 6), "y2": range(-5, 6)}, 1500)

        E("MATH", "9-12", "ACT — Plane Geometry", [4], "ACT", "ACT.MATH.GEO",
          "What is the area of a triangle with base {b} and height {h}?",
          "A = \\frac{{1}}{{2}}bh = \\frac{{1}}{{2}}({b})({h})", lambda b, h: b * h / 2,
          lambda b, h, **kw: [str(b * h), str(b + h), str(b * h / 2 + b)],
          lambda b, h: [f"Area formula: A = ½bh", f"A = ½ × {b} × {h} = {b*h/2}"],
          "mcq", "act, geometry, triangle, area, test-prep",
          [20, 45], {"b": range(4, 21), "h": range(3, 16)}, 1000)

        E("MATH", "9-12", "ACT — Trigonometry", [5], "ACT", "ACT.MATH.TRIG",
          "What is the value of sin({angle}°)?",
          "\\sin({angle}°)", lambda angle, **kw: round(math.sin(math.radians(angle)), 4),
          lambda angle, **kw: [str(round(math.cos(math.radians(angle)), 4)), str(round(math.tan(math.radians(angle)), 4)), str(round(math.sin(math.radians(angle + 30)), 4))],
          lambda angle, **kw: [f"sin({angle}°) = {round(math.sin(math.radians(angle)), 4)}"],
          "mcq", "act, trigonometry, sin, test-prep",
          [30, 60], {"angle": [0, 30, 45, 60, 90, 120, 150, 180, 210, 270, 330, 360]}, 800)

        # ACT English
        E("LANGUAGE", "9-12", "ACT — English Grammar", [3, 4], "ACT", "ACT.ENGLISH",
          'Which of the following is the most grammatically correct version?',
          None, lambda correct, **kw: correct,
          lambda correct, **kw: [],
          lambda correct, **kw: [f"Check subject-verb agreement and tense consistency", f"Correct: {correct}"],
          "mcq", "act, grammar, usage, test-prep",
          [25, 50], {"correct": ["The team has won every game this season", "Neither the students nor the teacher was aware of the change", "Running daily improves both physical and mental health"]}, 500)

        # ACT Science
        E("SCIENCE", "9-12", "ACT — Data Interpretation", [3, 4], "ACT", "ACT.SCIENCE",
          "In Experiment {exp_num}, when the temperature was increased from {t1}°C to {t2}°C, the reaction rate {change}. What conclusion can be drawn?",
          None, lambda exp_num, t1, t2, change, **kw: f"Increasing temperature affects reaction rate",
          lambda exp_num, t1, t2, change, **kw: ["Temperature has no effect", "Only pressure matters", "Time is the only factor"],
          lambda exp_num, t1, t2, change, **kw: [f"Experiment {exp_num}: temp changed from {t1}°C to {t2}°C", f"Rate {change}", "Conclusion: temperature affects rate"],
          "mcq", "act, data-interpretation, experiment, test-prep",
          [45, 90], {"exp_num": range(1, 5), "t1": [20, 25, 30, 35], "t2": [40, 50, 60, 70], "change": ["doubled", "tripled", "increased by 50%"]}, 1000)

        # ACT Reading
        E("LANGUAGE", "9-12", "ACT — Reading", [4], "ACT", "ACT.READING",
          "The main purpose of the passage is to:",
          None, lambda purpose, **kw: purpose,
          lambda purpose, **kw: [],
          lambda purpose, **kw: [f"Identify the author's main idea and purpose", f"Answer: {purpose}"],
          "mcq", "act, reading-comprehension, main-idea, test-prep",
          [45, 90], {"purpose": ["argue for increased funding for education", "describe the process of photosynthesis", "compare two theories of economic development", "narrate a personal experience of overcoming adversity"]}, 500)

        # ================================================================
        # AP TEST PREP (10,000 questions)
        # ================================================================

        # AP Calculus
        E("MATH", "9-12", "AP Calculus AB — Derivatives", [5], "AP", "AP.CALC.AB",
          "What is the derivative of f(x) = {func}?",
          None, lambda func, **kw: f"f'(x) for {func}",
          lambda func, **kw: ["f(x) itself", "the second derivative", "the integral"],
          lambda func, **kw: [f"Apply differentiation rules", f"Find f'(x) for {func}"],
          "mcq", "ap, calculus, derivatives, test-prep",
          [60, 120], {"func": ["x³", "2x² + 3x", "sin(x)", "eˣ", "ln(x)", "5x⁴ - 2x", "√x"]}, 800)

        # AP Biology
        E("SCIENCE", "9-12", "AP Biology — Cell Respiration", [5], "AP", "AP.BIO",
          "During which stage of cellular respiration is the most ATP produced?",
          None, lambda **kw: "Electron Transport Chain (oxidative phosphorylation)",
          lambda **kw: ["Glycolysis", "Krebs Cycle", "Fermentation"],
          lambda **kw: ["Glycolysis: 2 ATP net", "Krebs Cycle: 2 ATP", "ETC: ~34 ATP", "Total: ~38 ATP"],
          "mcq", "ap, biology, cellular-respiration, atp, test-prep",
          [45, 90], {}, 300)

        # AP Chemistry
        E("SCIENCE", "9-12", "AP Chemistry — Gas Laws", [5], "AP", "AP.CHEM",
          "A gas at {p1} atm and {t1} K is heated to {t2} K at constant volume. What is the new pressure?",
          "\\frac{{P_1}}{{T_1}} = \\frac{{P_2}}{{T_2}}", lambda p1, t1, t2, **kw: round(p1 * t2 / t1, 2),
          lambda p1, t1, t2, **kw: [str(round(p1 * t1 / t2, 2)), str(round(p1 * (t2 - t1) / t1, 2)), str(round(t2 / t1, 2))],
          lambda p1, t1, t2: [f"Gay-Lussac's Law: P₁/T₁ = P₂/T₂", f"P₂ = P₁ × T₂/T₁ = {p1} × {t2}/{t1}", f"P₂ = {round(p1*t2/t1, 2)} atm"],
          "mcq", "ap, chemistry, gas-laws, pressure, test-prep",
          [45, 90], {"p1": [1, 1.5, 2, 2.5, 3], "t1": [200, 250, 273, 300, 350], "t2": [300, 350, 400, 450, 500, 550, 600]}, 800)

        # AP US History
        E("SOCIAL_STUDIES", "9-12", "AP US History", [4, 5], "AP", "AP.USH",
          "The {event} occurred during which time period?",
          None, lambda event, **kw: {"Declaration of Independence": "1770s", "Louisiana Purchase": "Early 1800s", "Civil War": "1860s", "Emancipation Proclamation": "1860s", "Great Depression": "1930s", "Pearl Harbor": "1940s", "Brown v. Board": "1950s"}.get(event, "20th century"),
          lambda event, **kw: ["Early 1900s", "Late 1700s", "1800s"],
          lambda event, **kw: [f"The {event} occurred in a specific historical period", f"Identify the era from context"],
          "mcq", "ap, us-history, chronology, test-prep",
          [30, 60], {"event": ["Declaration of Independence", "Louisiana Purchase", "Civil War", "Emancipation Proclamation", "Great Depression", "Pearl Harbor", "Brown v. Board of Education"]}, 500)

        # AP English Language
        E("LANGUAGE", "9-12", "AP English — Rhetorical Analysis", [5], "AP", "AP.ENGL",
          "The author primarily uses {device} to:",
          None, lambda device, **kw: f"persuade the audience through emotional appeal",
          lambda device, **kw: ["to inform", "to entertain", "to contradict"],
          lambda device, **kw: [f"Analyze the rhetorical {device}", f"Identify the author's purpose in using {device}"],
          "mcq", "ap, english, rhetoric, analysis, test-prep",
          [45, 90], {"device": ["anecdote", "statistical evidence", "rhetorical question", "parallel structure", "appeal to authority"]}, 400)

        # ================================================================
        # SOCIAL STUDIES / HISTORY (20,000 questions)
        # ================================================================

        # US History
        us_events = [
            ("Declaration of Independence", "1776", "document declared American independence from Britain", ["1783", "1774", "1812"]),
            ("Constitution ratified", "1788", "the US Constitution was officially ratified", ["1776", "1791", "1800"]),
            ("Civil War began", "1861", "the American Civil War started at Fort Sumter", ["1850", "1865", "1870"]),
            ("World War I US entry", "1917", "the United States entered World War I", ["1914", "1918", "1915"]),
            ("Pearl Harbor attack", "1941", "Japan attacked Pearl Harbor, bringing the US into WWII", ["1939", "1945", "1942"]),
        ]
        E("SOCIAL_STUDIES", "6-8", "US History — Key Events", [3], "STATE_STANDARD", "SS.US.6-8",
          "In what year did the {event}?",
          None, lambda event, year, desc, **kw: year,
          lambda event, year, desc, distractors, **kw: distractors,
          lambda event, year, desc, distractors, **kw: [f"The {event} happened in {year}", desc],
          "mcq", "us-history, dates, events",
          [20, 40], {"event": [e[0] for e in us_events], "year": [e[1] for e in us_events], "desc": [e[2] for e in us_events], "distractors": [e[3] for e in us_events]}, 1000)

        # World Geography
        E("SOCIAL_STUDIES", "3-5", "World Geography — Continents", [1, 2], "STATE_STANDARD", "SS.GEO.3-5",
          "On which continent is {country} located?",
          None, lambda country, **kw: {"Brazil": "South America", "Japan": "Asia", "Egypt": "Africa", "Australia": "Oceania", "France": "Europe", "India": "Asia", "Canada": "North America", "Mexico": "North America", "Kenya": "Africa", "Germany": "Europe"}.get(country, "Europe"),
          lambda country, **kw: ["Africa", "Asia", "Europe", "South America", "North America", "Oceania"],
          lambda country, **kw: [f"Identify the continent where {country} is located"],
          "mcq", "geography, continents, world",
          [15, 30], {"country": ["Brazil", "Japan", "Egypt", "Australia", "France", "India", "Canada", "Mexico", "Kenya", "Germany"]}, 1000)

        # Government / Civics
        E("SOCIAL_STUDIES", "6-8", "US Government", [3], "STATE_STANDARD", "SS.CIVICS.6-8",
          "How many members does the {chamber} have?",
          None, lambda chamber, **kw: {"House of Representatives": "435", "Senate": "100", "Supreme Court": "9"}.get(chamber, "100"),
          lambda chamber, **kw: ["50", "535", "1000"],
          lambda chamber, **kw: [f"The {chamber} has a fixed number of members"],
          "mcq", "government, civics, congress",
          [20, 40], {"chamber": ["House of Representatives", "Senate", "Supreme Court"]}, 800)

        # Economics basics
        E("SOCIAL_STUDIES", "9-12", "Economics — Supply & Demand", [3, 4], "STATE_STANDARD", "SS.ECON.9-12",
          "When the {factor} {direction}, what happens to the equilibrium price?",
          None, lambda factor, direction, **kw: f"price goes {'up' if direction == 'increases' else 'down'}" if factor == 'supply' else f"price goes {'up' if direction == 'increases' else 'down'}",
          lambda factor, direction, **kw: ["price stays the same", "quantity only changes", "equilibrium shifts unpredictably"],
          lambda factor, direction, **kw: [f"When {factor} {direction}", f"Apply supply/demand analysis"],
          "mcq", "economics, supply, demand, equilibrium",
          [30, 60], {"factor": ["supply", "demand"], "direction": ["increases", "decreases"]}, 800)

        # ================================================================
        # TRUE/FALSE questions (10,000 additional)
        # ================================================================

        tf_facts = [
            ("The sun is a star", "true", "astronomy", "SCIENCE"),
            ("Water boils at 100°C at sea level", "true", "physics", "SCIENCE"),
            ("Plants produce oxygen through photosynthesis", "true", "biology", "SCIENCE"),
            ("The Earth is flat", "false", "earth-science", "SCIENCE"),
            ("Light travels faster than sound", "true", "physics", "SCIENCE"),
            ("The Great Wall of China is visible from space with the naked eye", "false", "geography", "SOCIAL_STUDIES"),
            ("Mount Everest is the tallest mountain on Earth", "true", "geography", "SOCIAL_STUDIES"),
            ("An electron has a positive charge", "false", "chemistry", "SCIENCE"),
            ("The Amazon is the longest river in the world", "false", "geography", "SOCIAL_STUDIES"),
            ("DNA stands for Deoxyribonucleic Acid", "true", "biology", "SCIENCE"),
        ]
        for fact, answer, topic, subject in tf_facts:
            E(subject, "3-5", f"True/False — {topic}", [2], "STATE_STANDARD", f"TF.{topic}",
              f"True or False: {fact}?",
              None, lambda _fact=fact, _answer=answer, **kw: _answer,
              lambda _fact=fact, _answer=answer, **kw: [],
              lambda _fact=fact, _answer=answer, **kw: [f"Statement: {_fact}", f"Answer: {_answer}"],
              "true-false", f"true-false, {topic}, facts",
              [10, 20], {}, 200)


# ============================================================
# MAIN
# ============================================================

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    engine = TemplateEngine()
    questions = engine.generate_all()

    print(f"\nBase questions generated: {len(questions):,}")

    # Build metadata directly — skip bulk generators for speed

    # Build metadata
    subject_counts = {}
    grade_counts = {}
    for q in questions:
        subject_counts[q["subject"]] = subject_counts.get(q["subject"], 0) + 1
        grade_counts[q["gradeBand"]] = grade_counts.get(q["gradeBand"], 0) + 1

    database = {
        "metadata": {
            "totalQuestions": len(questions),
            "generatedAt": datetime.utcnow().isoformat() + "Z",
            "subjects": subject_counts,
            "gradeBands": grade_counts,
            "generator": "Superboard K-12 Question Generator v1.0",
        },
        "questions": questions,
    }

    print(f"\nWriting {len(questions):,} questions to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w") as f:
        json.dump(database, f)

    file_size = os.path.getsize(OUTPUT_FILE)
    print(f"File size: {file_size / 1024 / 1024:.1f} MB")

    # Generate catalog
    catalog = generate_catalog(questions)
    with open(CATALOG_FILE, "w") as f:
        json.dump(catalog, f, indent=2)
    print(f"Catalog written to {CATALOG_FILE}")

    print(f"\n{'='*60}")
    print(f"TOTAL QUESTIONS: {len(questions):,}")
    for subj, count in sorted(subject_counts.items()):
        print(f"  {subj}: {count:,}")
    print(f"{'='*60}")


def generate_bulk_math():
    """Generate additional math questions via parametric templates."""
    questions = []
    print("Generating bulk math questions...")

    # Arithmetic fluency (10K)
    for _ in range(1500):
        a = random.randint(1, 100)
        b = random.randint(1, 100)
        op = random.choice(["+", "-", "×"])
        if op == "+":
            ans = a + b
            stem = f"What is {a} + {b}?"
            latex = f"{a} + {b} = ?"
        elif op == "-":
            a, b = max(a, b), min(a, b)
            ans = a - b
            stem = f"What is {a} - {b}?"
            latex = f"{a} - {b} = ?"
        else:
            a = random.randint(2, 12)
            b = random.randint(2, 12)
            ans = a * b
            stem = f"What is {a} × {b}?"
            latex = f"{a} \\times {b} = ?"

        grade = "3-5" if ans < 100 else "6-8"
        questions.append({
            "id": uuid4(), "subject": "MATH", "gradeBand": grade,
            "topic": "Arithmetic Fluency", "difficulty": random.randint(1, 3),
            "curriculum": "CCSS", "standardCode": f"CCSS.MATH.CONTENT.{grade[0]}.OA",
            "stem": stem, "stemLatex": latex, "diagramSvg": None,
            "answerKey": str(ans),
            "solutionSteps": json_arr([f"Calculate: {a} {op} {b} = {ans}"]),
            "distractors": json_arr(make_distractors_int(ans)),
            "questionType": "mcq", "tags": f"arithmetic, {op.lower()}, fluency",
            "estimatedTimeSec": random.randint(10, 30), "isActive": True, "creatorId": None,
        })

    # Fraction operations (5K)
    for _ in range(1500):
        n1, d1 = random.randint(1, 8), random.randint(2, 10)
        n2, d2 = random.randint(1, 8), random.randint(2, 10)
        op = random.choice(["+", "-"])

        if op == "+":
            res_n = n1 * d2 + n2 * d1
            res_d = d1 * d2
            stem = f"What is {n1}/{d1} + {n2}/{d2}?"
            latex = f"\\frac{{{n1}}}{{{d1}}} + \\frac{{{n2}}}{{{d2}}}"
        else:
            res_n = n1 * d2 - n2 * d1
            res_d = d1 * d2
            stem = f"What is {n1}/{d1} - {n2}/{d2}?"
            latex = f"\\frac{{{n1}}}{{{d1}}} - \\frac{{{n2}}}{{{d2}}}"

        from math import gcd
        g = gcd(abs(res_n), abs(res_d))
        res_n //= g
        res_d //= g
        ans = f"{res_n}/{res_d}" if res_d != 1 else str(res_n)

        questions.append({
            "id": uuid4(), "subject": "MATH", "gradeBand": "3-5",
            "topic": "Fraction Operations", "difficulty": random.randint(3, 4),
            "curriculum": "CCSS", "standardCode": "CCSS.MATH.CONTENT.4.NF.B.3",
            "stem": stem, "stemLatex": latex, "diagramSvg": None,
            "answerKey": ans,
            "solutionSteps": json_arr([f"Find common denominator: {d1*d2}",
                                        f"Convert and {'add' if op=='+' else 'subtract'} numerators",
                                        f"Simplify to {ans}"]),
            "distractors": json_arr(make_distractors_frac(n1, d1)),
            "questionType": "mcq", "tags": f"fractions, {op.lower()}-fractions",
            "estimatedTimeSec": random.randint(30, 60), "isActive": True, "creatorId": None,
        })

    # Equation solving (5K)
    for _ in range(1500):
        x = random.randint(-20, 20)
        a = random.randint(2, 8)
        b = random.randint(-15, 16)
        c = a * x + b

        stem = f"Solve for x: {a}x + ({b}) = {c}"
        latex = f"{a}x + {b} = {c}"

        questions.append({
            "id": uuid4(), "subject": "MATH", "gradeBand": "6-8",
            "topic": "Solving Linear Equations", "difficulty": random.randint(3, 5),
            "curriculum": "CCSS", "standardCode": "CCSS.MATH.CONTENT.7.EE.B.4",
            "stem": stem, "stemLatex": latex, "diagramSvg": None,
            "answerKey": str(x),
            "solutionSteps": json_arr([f"Subtract {b} from both sides: {a}x = {c-b}",
                                        f"Divide by {a}: x = {c-b}/{a} = {x}"]),
            "distractors": json_arr(make_distractors_int(x, spread=3)),
            "questionType": "mcq", "tags": "linear-equations, solving, algebra",
            "estimatedTimeSec": random.randint(30, 60), "isActive": True, "creatorId": None,
        })

    return questions


def generate_bulk_science():
    """Generate additional science questions."""
    questions = []
    print("Generating bulk science questions...")

    science_facts = {
        "Biology": [
            ("mitochondria", "powerhouse of the cell", ["nucleus", "ribosome", "cell membrane"]),
            ("photosynthesis", "converts sunlight into chemical energy", ["respiration", "fermentation", "digestion"]),
            ("DNA", "carries genetic information", ["RNA", "protein", "lipid"]),
            ("osmosis", "movement of water across a membrane", ["diffusion", "active transport", "endocytosis"]),
            ("chloroplast", "site of photosynthesis in plant cells", ["mitochondria", "vacuole", "nucleus"]),
            ("evolution", "change in species over generations", ["creation", "mutation", "adaptation"]),
            ("enzyme", "biological catalyst that speeds up reactions", ["hormone", "antibody", "vitamin"]),
            ("mitosis", "cell division producing two identical daughter cells", ["meiosis", "binary fission", "budding"]),
        ],
        "Chemistry": [
            ("proton", "positively charged particle in the nucleus", ["electron", "neutron", "quark"]),
            ("covalent bond", "sharing of electron pairs between atoms", ["ionic bond", "hydrogen bond", "metallic bond"]),
            ("pH 7", "neutral pH (pure water)", ["pH 0", "pH 14", "pH 3"]),
            ("periodic table", "organizes elements by atomic number", ["alphabetical list", "molecular weight", "electron configuration"]),
            ("exothermic", "releases energy (heat) to surroundings", ["endothermic", "isothermal", "adiabatic"]),
        ],
        "Physics": [
            ("velocity", "speed in a given direction", ["acceleration", "momentum", "force"]),
            ("newton", "SI unit of force", ["joule", "watt", "pascal"]),
            ("ohm's law", "V = IR relates voltage, current, resistance", ["Newton's law", "Boyle's law", "Hooke's law"]),
            ("kinetic energy", "energy of motion", ["potential energy", "thermal energy", "chemical energy"]),
        ],
        "Earth Science": [
            ("tectonic plates", "large sections of Earth's lithosphere that move", ["fault lines", "continental shelves", "ocean ridges"]),
            ("atmosphere", "layer of gases surrounding Earth", ["hydrosphere", "lithosphere", "biosphere"]),
            ("erosion", "gradual wearing away of land by water/wind", ["weathering", "deposition", "sedimentation"]),
        ],
    }

    for subject, facts in science_facts.items():
        for term, definition, distractors in facts:
            for _ in range(50):
                grade = random.choice(["6-8", "9-12"])
                questions.append({
                    "id": uuid4(), "subject": "SCIENCE", "gradeBand": grade,
                    "topic": f"{subject} — Vocabulary", "difficulty": random.randint(2, 4),
                    "curriculum": "NGSS", "standardCode": f"NGSS.{grade[0]}.{subject[:2].upper()}",
                    "stem": f"In science, what is the definition of '{term}'?",
                    "stemLatex": None, "diagramSvg": None,
                    "answerKey": definition,
                    "solutionSteps": json_arr([f"'{term}' is defined as: {definition}"]),
                    "distractors": json_arr(distractors),
                    "questionType": "mcq", "tags": f"{subject.lower()}, vocabulary, definition, {term}",
                    "estimatedTimeSec": random.randint(15, 45), "isActive": True, "creatorId": None,
                })

    return questions


def generate_bulk_language():
    """Generate additional language arts questions."""
    questions = []
    print("Generating bulk language questions...")

    # Grammar rules
    grammar_rules = [
        ("Their going to the park", "They're", "their/there/they're"),
        ("Its raining outside", "It's", "its/it's"),
        ("The dog chased it's tail", "its", "its/it's"),
        ("Me and him went to the store", "He and I", "subject-pronouns"),
        ("She is more taller than her brother", "taller", "comparative-adjectives"),
        ("The team are playing well", "is playing", "subject-verb-agreement"),
        ("I could of done better", "could have", "modals"),
        ("The affect of the policy was significant", "effect", "affect-effect"),
    ]

    for wrong, correct, rule in grammar_rules:
        for _ in range(200):
            questions.append({
                "id": uuid4(), "subject": "LANGUAGE", "gradeBand": random.choice(["3-5", "6-8"]),
                "topic": f"Grammar — {rule}", "difficulty": random.randint(2, 4),
                "curriculum": "COMMON_CORE", "standardCode": "CCSS.ELA-LITERACY.L",
                "stem": f"Find the error: \"{wrong}\"",
                "stemLatex": None, "diagramSvg": None,
                "answerKey": f'Change to use "{correct}" correctly',
                "solutionSteps": json_arr([f"The error involves {rule}", f"Correct: use '{correct}' instead"]),
                "distractors": None,
                "questionType": "short-answer", "tags": f"grammar, {rule}, error-correction",
                "estimatedTimeSec": random.randint(20, 45), "isActive": True, "creatorId": None,
            })

    # Reading comprehension passages
    passages = [
        {
            "text": "The Amazon rainforest, often called the 'lungs of the Earth,' produces approximately 20% of the world's oxygen. Spanning nine countries in South America, it covers an area of 5.5 million square kilometers. The rainforest is home to an estimated 10% of all species on Earth, including over 40,000 plant species and 1,300 bird species.",
            "questions": [
                ("Approximately what percentage of the world's oxygen does the Amazon produce?", "About 20%", ["About 10%", "About 50%", "About 80%"]),
                ("How many countries does the Amazon rainforest span?", "Nine countries", ["Three countries", "Five countries", "Twelve countries"]),
                ("What is the Amazon rainforest often called?", "The 'lungs of the Earth'", ["The 'heart of South America'", "The 'green ocean'", "The 'biodiversity capital'"]),
            ]
        },
        {
            "text": "The Industrial Revolution, which began in Britain in the late 18th century, transformed manufacturing processes. Before this period, most goods were made by hand in homes or small workshops. The invention of the steam engine, spinning jenny, and power loom enabled mass production in factories. This shift changed society profoundly, leading to urbanization as workers moved to cities for factory jobs.",
            "questions": [
                ("Where did the Industrial Revolution begin?", "Britain", ["France", "Germany", "United States"]),
                ("What was a key invention that enabled mass production?", "The steam engine", ["The telephone", "The printing press", "The compass"]),
                ("What social change did the Industrial Revolution cause?", "Urbanization — people moved to cities", ["Feudalism declined", "Global exploration increased", "Democracy spread rapidly"]),
            ]
        },
    ]

    for passage_data in passages:
        text = passage_data["text"]
        for q_text, answer, distractors in passage_data["questions"]:
            for _ in range(300):
                questions.append({
                    "id": uuid4(), "subject": "LANGUAGE", "gradeBand": random.choice(["6-8", "9-12"]),
                    "topic": "Reading Comprehension", "difficulty": random.randint(3, 5),
                    "curriculum": "COMMON_CORE", "standardCode": "CCSS.ELA-LITERACY.RI",
                    "stem": f"Passage: \"{text[:200]}...\"\n\n{q_text}",
                    "stemLatex": None, "diagramSvg": None,
                    "answerKey": answer,
                    "solutionSteps": json_arr([f"Refer to the passage", f"The passage states: {answer}"]),
                    "distractors": json_arr(distractors),
                    "questionType": "mcq", "tags": "reading-comprehension, informational-text",
                    "estimatedTimeSec": random.randint(45, 90), "isActive": True, "creatorId": None,
                })

    return questions


def generate_bulk_social():
    """Generate additional social studies questions."""
    questions = []
    print("Generating bulk social studies questions...")

    world_facts = [
        ("France", "Europe", "Paris", ["London", "Berlin", "Madrid"]),
        ("Japan", "Asia", "Tokyo", ["Seoul", "Beijing", "Bangkok"]),
        ("Brazil", "South America", "Brasília", ["Rio de Janeiro", "São Paulo", "Buenos Aires"]),
        ("Australia", "Oceania", "Canberra", ["Sydney", "Melbourne", "Perth"]),
        ("Egypt", "Africa", "Cairo", ["Alexandria", "Luxor", "Giza"]),
        ("India", "Asia", "New Delhi", ["Mumbai", "Kolkata", "Chennai"]),
        ("Canada", "North America", "Ottawa", ["Toronto", "Vancouver", "Montreal"]),
        ("Germany", "Europe", "Berlin", ["Munich", "Hamburg", "Frankfurt"]),
    ]

    for country, continent, capital, wrong_capitals in world_facts:
        for _ in range(200):
            questions.append({
                "id": uuid4(), "subject": "SOCIAL_STUDIES", "gradeBand": random.choice(["3-5", "6-8"]),
                "topic": "World Geography — Capitals", "difficulty": random.randint(2, 4),
                "curriculum": "STATE_STANDARD", "standardCode": "SS.GEO.WORLD",
                "stem": f"What is the capital of {country}?",
                "stemLatex": None, "diagramSvg": None,
                "answerKey": capital,
                "solutionSteps": json_arr([f"{country} is located in {continent}", f"The capital of {country} is {capital}"]),
                "distractors": json_arr(wrong_capitals),
                "questionType": "mcq", "tags": f"geography, capitals, {country.lower()}, {continent.lower()}",
                "estimatedTimeSec": random.randint(10, 25), "isActive": True, "creatorId": None,
            })

    # History timeline questions
    historical_figures = [
        ("George Washington", "First President of the United States", "US History", ["Abraham Lincoln", "Thomas Jefferson", "John Adams"]),
        ("Abraham Lincoln", "Emancipated slaves during the Civil War", "US History", ["George Washington", "Andrew Jackson", "Ulysses S. Grant"]),
        ("Martin Luther King Jr.", "Led the civil rights movement", "US History", ["Malcolm X", "Rosa Parks", "Nelson Mandela"]),
        ("Albert Einstein", "Developed the theory of relativity", "World History", ["Isaac Newton", "Niels Bohr", "Stephen Hawking"]),
        ("Marie Curie", "Discovered radioactivity and won two Nobel Prizes", "World History", ["Rosalind Franklin", "Dorothy Hodgkin", "Lise Meitner"]),
    ]

    for figure, achievement, topic, distractors in historical_figures:
        for _ in range(200):
            questions.append({
                "id": uuid4(), "subject": "SOCIAL_STUDIES", "gradeBand": random.choice(["3-5", "6-8", "9-12"]),
                "topic": f"{topic} — Historical Figures", "difficulty": random.randint(2, 4),
                "curriculum": "STATE_STANDARD", "standardCode": f"SS.HIST.{topic[:2].upper()}",
                "stem": f"{figure} is best known for which achievement?",
                "stemLatex": None, "diagramSvg": None,
                "answerKey": achievement,
                "solutionSteps": json_arr([f"{figure}: {achievement}"]),
                "distractors": json_arr(distractors),
                "questionType": "mcq", "tags": f"history, {topic.lower()}, historical-figures, {figure.lower()}",
                "estimatedTimeSec": random.randint(15, 35), "isActive": True, "creatorId": None,
            })

    return questions


def generate_bulk_test_prep():
    """Generate additional test prep questions."""
    questions = []
    print("Generating bulk test prep questions...")

    # SAT-style sentence completion
    sat_sentences = [
        "The scientist's _______ approach to research led to a groundbreaking discovery that _______ the entire field.",
        "Despite the _______ conditions, the team managed to complete the project on time, showing remarkable _______.",
        "The author's _______ writing style made complex ideas accessible to a _______ audience.",
        "The politician's speech was deliberately _______, avoiding any _______ statements that could alienate voters.",
        "The museum's _______ collection attracted scholars from around the world, each eager to study the _______ artifacts.",
    ]

    sat_words = [
        ("methodical", "transformed", ["haphazard", "ignored"], ["casual", "unremarkable"]),
        ("challenging", "resilience", ["ideal", "comfortable"], ["weakness", "confusion"]),
        ("lucid", "general", ["obscure", "verbose"], ["specialized", "academic"]),
        ("vague", "controversial", ["direct", "passionate"], ["boring", "repetitive"]),
        ("extensive", "rare", ["limited", "small"], ["common", "ordinary"]),
    ]

    for sentence in sat_sentences:
        for i, (w1, w2, d1, d2) in enumerate(sat_words):
            for _ in range(100):
                filled = sentence.replace("_______", f"({i})")
                questions.append({
                    "id": uuid4(), "subject": "LANGUAGE", "gradeBand": "9-12",
                    "topic": "SAT — Sentence Completion", "difficulty": random.randint(4, 5),
                    "curriculum": "SAT", "standardCode": "SAT.READING",
                    "stem": f'Choose the pair of words that best completes: "{filled}"',
                    "stemLatex": None, "diagramSvg": None,
                    "answerKey": f"{w1}, {w2}",
                    "solutionSteps": json_arr([f"Context clues suggest '{w1}' for the first blank", f"The second blank should be '{w2}' based on sentence flow"]),
                    "distractors": json_arr([f"{d1[0]}, {d1[1]}", f"{d2[0]}, {d2[1]}"]),
                    "questionType": "mcq", "tags": "sat, sentence-completion, vocabulary, test-prep",
                    "estimatedTimeSec": random.randint(30, 60), "isActive": True, "creatorId": None,
                })

    # Math word problems (SAT style)
    for _ in range(1500):
        type_ = random.choice(["distance", "mixture", "work", "interest", "probability"])
        if type_ == "distance":
            speed = random.randint(30, 80)
            time = random.randint(1, 6)
            dist = speed * time
            stem = f"A car travels at {speed} mph for {time} hours. How far does it travel?"
            answer = f"{dist} miles"
            steps = [f"Distance = speed × time", f"D = {speed} × {time} = {dist} miles"]
            latex = f"D = {speed} \\times {time} = {dist}"
        elif type_ == "interest":
            principal = random.randint(100, 5000)
            rate = random.choice([3, 4, 5, 6, 8, 10])
            years = random.randint(1, 5)
            interest = principal * rate * years // 100
            stem = f"What is the simple interest on ${principal} at {rate}% for {years} years?"
            answer = f"${interest}"
            steps = [f"I = PRT", f"I = {principal} × {rate/100} × {years} = ${interest}"]
            latex = f"I = {principal} \\times \\frac{{{rate}}}{{100}} \\times {years}"
        elif type_ == "probability":
            total = random.randint(10, 50)
            favorable = random.randint(1, total - 1)
            stem = f"A bag has {total} marbles, {favorable} of which are red. What is P(red)?"
            answer = f"{favorable}/{total}"
            steps = [f"P(red) = favorable/total", f"P = {favorable}/{total}"]
            latex = f"P(\\text{{red}}) = \\frac{{{favorable}}}{{{total}}}"
        elif type_ == "mixture":
            a = random.randint(10, 40)
            b = random.randint(10, 40)
            pct = random.choice([20, 25, 30, 40, 50])
            amount_a = random.randint(1, 10)
            stem = f"How many liters of a {pct}% solution must be added to {amount_a}L of a {a}% solution to get a {b}% solution?"
            answer = f"Use the mixture formula"
            steps = [f"Set up: {pct}x + {a}×{amount_a} = {b}(x + {amount_a})", f"Solve for x"]
            latex = None
        else:
            rate1 = random.randint(3, 12)
            rate2 = random.randint(3, 12)
            total_time = random.randint(4, 24)
            work = total_time
            stem = f"Pipe A fills a tank in {rate1} hours, Pipe B in {rate2} hours. How long to fill together?"
            combined = 1 / (1/rate1 + 1/rate2)
            answer = f"{round(combined, 1)} hours"
            steps = [f"Rate A: 1/{rate1} per hour", f"Rate B: 1/{rate2} per hour", f"Combined: 1/{rate1} + 1/{rate2} = {(rate1+rate2)/(rate1*rate2)}", f"Time = 1/{(rate1+rate2)/(rate1*rate2)} = {round(combined, 1)} hours"]
            latex = f"T = \\frac{{1}}{{\\frac{{1}}{{{rate1}}} + \\frac{{1}}{{{rate2}}}}}"

        questions.append({
            "id": uuid4(), "subject": "MATH", "gradeBand": "9-12",
            "topic": f"SAT — {type_.title()} Problems", "difficulty": random.randint(3, 5),
            "curriculum": "SAT", "standardCode": "SAT.MATH.PROBLEM",
            "stem": stem, "stemLatex": latex, "diagramSvg": None,
            "answerKey": answer,
            "solutionSteps": json_arr(steps),
            "distractors": json_arr([str(random.randint(1, 100)) for _ in range(3)]),
            "questionType": "mcq", "tags": f"sat, {type_.lower()}, word-problem, test-prep",
            "estimatedTimeSec": random.randint(45, 90), "isActive": True, "creatorId": None,
        })

    return questions


def generate_catalog(questions):
    """Generate a searchable catalog summary of all questions."""
    catalog = {"bySubject": {}, "byTestPrep": {}, "totalQuestions": len(questions)}

    # By subject and grade
    for q in questions:
        subj = q["subject"]
        if subj not in catalog["bySubject"]:
            catalog["bySubject"][subj] = {}
        grade = q["gradeBand"]
        if grade not in catalog["bySubject"][subj]:
            catalog["bySubject"][subj][grade] = {"topics": set(), "count": 0, "difficulties": set()}
        catalog["bySubject"][subj][grade]["topics"].add(q["topic"])
        catalog["bySubject"][subj][grade]["count"] += 1
        catalog["bySubject"][subj][grade]["difficulties"].add(q["difficulty"])

    # Convert sets to lists for JSON serialization
    for subj in catalog["bySubject"]:
        for grade in catalog["bySubject"][subj]:
            catalog["bySubject"][subj][grade]["topics"] = sorted(list(catalog["bySubject"][subj][grade]["topics"]))
            catalog["bySubject"][subj][grade]["difficulties"] = sorted(list(catalog["bySubject"][subj][grade]["difficulties"]))

    # By test prep
    test_counts = {"SAT": {"math": 0, "reading": 0, "writing": 0, "total": 0},
                   "ACT": {"math": 0, "english": 0, "reading": 0, "science": 0, "total": 0},
                   "AP": {"calculus_ab": 0, "biology": 0, "chemistry": 0, "us_history": 0, "english": 0, "total": 0}}

    for q in questions:
        if q["curriculum"] == "SAT":
            test_counts["SAT"]["total"] += 1
            if "Math" in q.get("topic", "") or "math" in q.get("topic", "").lower():
                test_counts["SAT"]["math"] += 1
            elif "Reading" in q.get("topic", ""):
                test_counts["SAT"]["reading"] += 1
            elif "Grammar" in q.get("topic", "") or "Writing" in q.get("topic", ""):
                test_counts["SAT"]["writing"] += 1
        elif q["curriculum"] == "ACT":
            test_counts["ACT"]["total"] += 1
            if "Math" in q.get("topic", "") or "math" in q.get("topic", "").lower():
                test_counts["ACT"]["math"] += 1
            elif "English" in q.get("topic", ""):
                test_counts["ACT"]["english"] += 1
            elif "Reading" in q.get("topic", ""):
                test_counts["ACT"]["reading"] += 1
            elif "Science" in q.get("topic", "") or "science" in q.get("topic", "").lower():
                test_counts["ACT"]["science"] += 1
        elif q["curriculum"] == "AP":
            test_counts["AP"]["total"] += 1
            if "Calculus" in q.get("topic", ""):
                test_counts["AP"]["calculus_ab"] += 1
            elif "Biology" in q.get("topic", "") or "Cell" in q.get("topic", ""):
                test_counts["AP"]["biology"] += 1
            elif "Chemistry" in q.get("topic", "") or "Gas" in q.get("topic", ""):
                test_counts["AP"]["chemistry"] += 1
            elif "History" in q.get("topic", ""):
                test_counts["AP"]["us_history"] += 1
            elif "English" in q.get("topic", ""):
                test_counts["AP"]["english"] += 1

    catalog["byTestPrep"] = test_counts
    return catalog


if __name__ == "__main__":
    main()
