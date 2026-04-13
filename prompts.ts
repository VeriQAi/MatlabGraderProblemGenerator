import type { ClassAssessment, ProblemOption, ProblemType } from './types';
import { toSnakeCase } from './api';

export function buildOptionsPrompt(objective: string, problemType: ProblemType, numOptions: number) {
  const classNote = problemType === 'Class'
    ? '\nFor Class problems, suggested_variable must be the PascalCase class name (e.g. "BankAccount"), not a variable name.'
    : problemType === 'Function'
    ? '\nFor Function problems, suggested_variable should be the primary output argument name.'
    : problemType === 'Object usage'
    ? '\nFor Object usage problems, suggested_variable should be the name of the primary output variable computed in the student script (e.g. "totalArea", "maxSpeed"). A complete supporting class file will be generated; students write only a script.'
    : '';

  return {
    system: `You are an expert MATLAB educator. Given a learning objective and problem type, \
propose ${numOptions} distinct MATLAB Grader problem options. Return ONLY a raw JSON array \
with no markdown fences and no explanation.
Each element must have exactly these fields:
{
  "id": 1,
  "title": "...",
  "difficulty": "Easy|Medium|Hard",
  "concept_focus": "...",
  "brief_description": "...",
  "suggested_variable": "varname",
  "problem_type": "Script|Function|Class|Object usage"
}
Vary difficulty: spread Easy, Medium, and Hard across the options.${classNote}
All problems must be of the problem_type requested by the user.`,
    user: `Learning objective: ${objective}\nProblem type: ${problemType}\nGenerate ${numOptions} problem options.`,
    maxTokens: Math.max(1200, numOptions * 250),
  };
}

export function buildDescriptionPrompt(option: ProblemOption, objective: string, classAssessment?: ClassAssessment) {
  // ── Object usage ─────────────────────────────────────────────────────────
  if (option.problem_type === 'Object usage') {
    const outputVar = option.suggested_variable;
    return {
      system: `You are an expert MATLAB educator creating MATLAB Grader problem materials.
Problem: "${option.title}". Difficulty: ${option.difficulty}.
Problem type: Object usage (script). Learning objective: ${objective}.
Primary output variable: ${outputVar}.

Write a clear student-facing problem description for MATLAB Grader.
Plain text only — no markdown headers or bold/italic markers.

REQUIRED SECTIONS (in this order):

1. One paragraph explaining what the problem asks the student to do. State that a complete
   class is provided as a supporting file and must not be modified.

2. Class interface — show the class name, its properties (names and types), and the constructor
   signature. Students use this to know what they can create and access. Do not show the full
   classdef source.

3. Your task — describe the two things the student must fill in:
   a. Create an array of N objects (using the given input data).
   b. Compute ${outputVar} from that array.

4. The complete script skeleton with exactly two % YOUR CODE HERE blanks — one for
   creating the object array, one for computing ${outputVar}. Surround the skeleton
   with a code block (use plain indentation, no fences).

5. Example — show how to create a single object and access one property.

6. Before you submit:
   - How to verify the array exists and has the right length.
   - How to inspect individual elements.
   - How to check ${outputVar}.`,
      user: 'Write the problem description.',
      maxTokens: 1000,
    };
  }

  // ── Class ─────────────────────────────────────────────────────────────────
  if (option.problem_type === 'Class') {
    const className = option.suggested_variable;
    const assessmentCtx = classAssessment ? `The part being assessed is: ${classAssessment}.` : '';

    const extraRules = classAssessment === 'Constant property'
      ? `
- The blank is inside a properties (Constant) block: show "PropertyName = % YOUR CODE HERE".
- Explain that a Constant property belongs to the class (not instances), has a fixed value, and
  is accessed as ClassName.PropertyName. State why it is useful (shared, class-wide constant).
- Use an analogy from a DIFFERENT class (not ${className}) to illustrate the pattern.
- Before you submit: show how to access via the class name (ClassName.PropertyName), verify
  the value, and confirm the same value is returned via an instance (obj.PropertyName).`
      : classAssessment === 'Operator overloading'
      ? `
- The blank is the body of one overloaded operator method (e.g. plus, minus, mtimes, eq).
- Explain that MATLAB dispatches the operator symbol to the named method (e.g. a + b calls
  plus(a, b)), and that the student controls what that means for this class.
- State the formula or rule the method must implement explicitly — students must not have to
  derive it from the problem title alone.
- Use an analogy from a DIFFERENT class (not ${className}) to illustrate operator overloading.
- Before you submit: basic test (a + b), hardcoding check (different inputs), symmetry check
  where mathematically appropriate (a + b vs b + a).`
      : `
- Hints must illustrate the concept using a different, analogous class (not ${className} itself).
- Include a "Before you submit" section with a short local-testing snippet the student can paste
  into the MATLAB command window.`;

    return {
      system: `You are an expert MATLAB educator creating MATLAB Grader problem materials.
Problem: "${option.title}". Difficulty: ${option.difficulty}.
Problem type: Class (OOP). Learning objective: ${objective}.
Class name: ${className}. ${assessmentCtx}

Write a clear student-facing problem description for MATLAB Grader.
Plain text only — no markdown headers or bold/italic markers.

IMPORTANT OOP RULES — follow every rule exactly:
- State that the student must name their file ${className}.m and that the classdef name must
  match exactly: classdef ${className}.
- Scaffold level: give the complete classdef skeleton in the instructions, blanking only the
  specific lines being assessed with % YOUR CODE HERE. Students see the full structure and
  fill in only what is assessed.
- Do NOT instruct students to write wrapper functions or scripts — the submission is the
  classdef file only.${extraRules}`,
      user: 'Write the problem description.',
      maxTokens: 1000,
    };
  }

  // ── Script / Function ────────────────────────────────────────────────────
  const fnNote = option.problem_type === 'Function'
    ? '\nAlso specify the required function signature, e.g.: function result = myFunc(x)'
    : '';
  return {
    system: `You are an expert MATLAB educator creating MATLAB Grader problem materials.
Problem: "${option.title}". Difficulty: ${option.difficulty}.
Problem type: ${option.problem_type}.
Learning objective: ${objective}.
Write a clear student-facing problem description for MATLAB Grader.
Plain text only — no markdown headers or bold/italic markers.
Include: a 2–3 sentence overview, numbered step-by-step instructions, and hints.${fnNote}`,
    user: 'Write the problem description.',
    maxTokens: 700,
  };
}

export function buildSolutionPrompt(option: ProblemOption, objective: string) {
  // ── Object usage ─────────────────────────────────────────────────────────
  if (option.problem_type === 'Object usage') {
    const outputVar = option.suggested_variable;
    return {
      system: `You are an expert MATLAB educator.
Problem: "${option.title}". Difficulty: ${option.difficulty}.
Problem type: Object usage (script). Learning objective: ${objective}.
Primary output variable: ${outputVar}.

Generate two files in sequence, separated by the exact delimiter shown below.

FILE 1 — the supporting class file (instructor pastes into MATLAB Grader → Supporting Files).
Rules:
- A minimal, clean classdef with only the properties and methods the script problem needs.
- Include constructor only. No extra methods.
- The first line is "classdef ClassName" and the last line is "end". Nothing before or after.
- No markdown fences.

FILE 2 — the student script reference solution (instructor pastes into Reference Solution).
Rules:
- Pure script — no function or classdef wrapper.
- Creates an object array and computes ${outputVar}.
- Include brief inline comments.
- No markdown fences.

Use this exact delimiter between the two files (nothing before FILE 1, nothing after FILE 2):
%%% SUPPORTING FILE: ClassName.m %%%
<file 1 contents here>
%%% STUDENT SCRIPT SOLUTION %%%
<file 2 contents here>

Replace "ClassName" with the actual class name you choose.`,
      user: 'Write the supporting class file and the reference solution script.',
      maxTokens: 1100,
    };
  }

  // ── Class ─────────────────────────────────────────────────────────────────
  if (option.problem_type === 'Class') {
    const className = option.suggested_variable;
    return {
      system: `You are an expert MATLAB educator.
Problem: "${option.title}". Difficulty: ${option.difficulty}.
Problem type: Class (OOP). Learning objective: ${objective}.
Class name: ${className}.

Write a complete MATLAB class reference solution.
CRITICAL RULES:
- The file starts with "classdef ${className}" and ends with "end". Nothing before or after.
- Do NOT wrap the classdef in a function. The file IS the classdef.
- Include properties block and at least a constructor method.
- Include brief inline comments.
- Return ONLY the .m file contents — no markdown fences, no explanation.`,
      user: 'Write the reference solution.',
      maxTokens: 900,
    };
  }

  // ── Script / Function ────────────────────────────────────────────────────
  const snakeTitle = toSnakeCase(option.title);

  const body = option.problem_type === 'Script'
    ? `Write a complete MATLAB script reference solution.
Primary output variable: "${option.suggested_variable}".
Include brief inline comments. Return ONLY .m code — no markdown fences, no explanation.`
    : `Write a complete MATLAB function reference solution.
Function signature: function ${option.suggested_variable} = ${snakeTitle}(inputs)
Choose appropriate input argument names.
Include brief inline comments. Return ONLY .m code — no markdown fences, no explanation.`;

  return {
    system: `You are an expert MATLAB educator.
Problem: "${option.title}". Difficulty: ${option.difficulty}.
Problem type: ${option.problem_type}.
Learning objective: ${objective}.

${body}`,
    user: 'Write the reference solution.',
    maxTokens: 700,
  };
}

export function buildTemplatePrompt(option: ProblemOption, solution: string, classAssessment?: ClassAssessment) {
  // ── Object usage ─────────────────────────────────────────────────────────
  if (option.problem_type === 'Object usage') {
    const outputVar = option.suggested_variable;
    return {
      system: `You are an expert MATLAB educator.
Problem type: Object usage (script).
Primary output variable: ${outputVar}.

The reference solution contains a supporting class file and a solved student script,
separated by delimiter lines starting with "%%%".

Extract the STUDENT SCRIPT portion (everything after "%%% STUDENT SCRIPT SOLUTION %%%").
Produce a learner template from that script:
- Keep any input data definitions (arrays, constants) unchanged so tests can rely on them.
- Replace the object-array creation code with "% YOUR CODE HERE — create array of objects".
- Replace the ${outputVar} computation code with "% YOUR CODE HERE — compute ${outputVar}".
- Do NOT include the classdef file. The class is provided as a read-only supporting file.
- Return ONLY the .m script contents — no markdown fences, no explanation.`,
      user: `Reference solution for context:\n\n${solution}\n\nWrite the learner template script.`,
      maxTokens: 700,
    };
  }

  // ── Class ─────────────────────────────────────────────────────────────────
  if (option.problem_type === 'Class') {
    const className = option.suggested_variable;

    const blankRule = classAssessment === 'Constructor — property assignment'
      ? `Blank ONLY the property-assignment lines inside the constructor body (the "obj.propName = argName;" lines). Replace each such line with "% YOUR CODE HERE". Keep every other line — including the "function obj = ${className}(...)" signature line, the "end" keywords, and all other method bodies — exactly as in the reference solution.`
      : classAssessment === 'Constructor — computed property'
      ? `Blank ONLY the line(s) inside the constructor that compute a derived property (e.g. "obj.area = ...;" or similar computed assignment). Replace those line(s) with "% YOUR CODE HERE". Keep all other lines — including simple property assignments, the function signature, and all end keywords — exactly as in the reference solution.`
      : classAssessment === 'Constant property'
      ? `Blank ONLY the value assigned to the constant property inside the properties (Constant) block. The line should read "PropertyName = % YOUR CODE HERE". Keep the "properties (Constant)" header, all other property declarations, and all method blocks exactly as in the reference solution.`
      : classAssessment === 'Operator overloading'
      ? `Blank ONLY the body lines inside the overloaded operator method (everything between the "function result = operatorName(...)" signature and its closing "end"). Replace the body with a single "% YOUR CODE HERE". Keep the method signature line, the closing end, and all other code exactly as in the reference solution.`
      : /* Instance method */
      `Blank ONLY the body lines inside the assessed instance method (everything between the "function" signature line and its closing "end"). Replace the body with "% YOUR CODE HERE". Keep the function signature line, the closing end, and all other methods exactly as in the reference solution.`;

    return {
      system: `You are an expert MATLAB educator.
Problem type: Class (OOP). Class name: ${className}.
What is being assessed: ${classAssessment ?? 'unspecified'}.

Using the reference solution, produce a learner template.
CRITICAL RULES:
- The file starts with "classdef ${className}" and ends with "end". Nothing before or after.
- Do NOT add a wrapper function.
- Match every property name, method name, and argument name from the reference solution exactly.
- ${blankRule}
- Do not blank anything else. The student must see the full class skeleton.
- Return ONLY the .m file contents — no markdown fences, no explanation.`,
      user: `Reference solution for context:\n\n${solution}\n\nWrite the learner template.`,
      maxTokens: 900,
    };
  }

  // ── Script / Function ────────────────────────────────────────────────────
  const fnNote = option.problem_type === 'Function'
    ? '\nInclude the full function signature line unchanged. The student fills in the body.'
    : '';
  return {
    system: `You are an expert MATLAB educator.
Problem type: ${option.problem_type}.
Write a learner template .m file with comment scaffolding and partial code stubs.
Match all variable and argument names from the reference solution exactly.${fnNote}
Leave clear blanks (e.g., % YOUR CODE HERE) for the student to complete.
Return ONLY .m code — no markdown fences, no explanation.`,
    user: `Reference solution for context:\n\n${solution}\n\nWrite the learner template.`,
    maxTokens: 700,
  };
}

export function buildTestsPrompt(option: ProblemOption, solution: string, classAssessment?: ClassAssessment) {
  // ─── Shared quality rules (applied to ALL problem types) ──────────────────
  const qualityRules = `
STRICT OUTPUT RULES — violating any rule means the test file is unusable:
1. Return ONLY plain MATLAB code. No markdown fences, no triple backticks, no prose outside comments.
2. Structure: each test is exactly one %% section:
       %% Test N: one-line description
       <setup — 1 to 3 lines maximum>
       assessVariableEqual('expression', expected_value);
3. No try/catch, no fprintf, no if/else, no whos, no dir, no script_ran flags.
4. 3 to 5 tests maximum.
5. Never use fixed numeric literals as inputs. Always use randi or randperm.
   Use randperm(19)-10 when swap/transposition detection matters (gives distinct values -9 to 9).
   Use randi([lo, hi]) when swap detection is not the goal.
6. Hardcoding detection is mandatory: include at least one test that uses a clearly different
   numeric range from the first test, so a hardcoded expected value fails.
7. assessVariableEqual('varname', value) — no Description parameter.
8. Separate %% sections are the only separators — no === comment banners.`;

  // ── Object usage ─────────────────────────────────────────────────────────
  if (option.problem_type === 'Object usage') {
    const outputVar = option.suggested_variable;
    return {
      system: `You are an expert MATLAB educator creating MATLAB Grader assessment code.
Problem: "${option.title}". Problem type: Object usage (script).
Primary output variable: ${outputVar}.

Assessment code runs AFTER the student script has already executed in the workspace.
The supporting class file is available as a supporting file — do not redefine it.
${qualityRules}

Test order:
  Test 1 — object array exists and has the correct length (use numel or length).
  Test 2 — a specific element has the correct property value.
  Test 3 — ${outputVar} is correct.
  Test 4 — hardcoding detection: recompute expected with different data and compare.`,
      user: `Reference solution for context:\n\n${solution}\n\nWrite the MATLAB Grader test cases.`,
      maxTokens: 1200,
    };
  }

  // ── Class ─────────────────────────────────────────────────────────────────
  if (option.problem_type === 'Class') {
    const className = option.suggested_variable;

    const testOrder = classAssessment === 'Constant property'
      ? `Test order:
  Test 1 — access constant via class name: assessVariableEqual('${className}.PropertyName', expectedValue).
  Test 2 — access constant via an instance: create obj, assessVariableEqual('obj.PropertyName', expectedValue).
  Test 3 — value is exactly correct (no rounding): use the precise expected value.
  (The constant value is fixed by definition; use the literal correct value as expected.)`
      : classAssessment === 'Operator overloading'
      ? `Test order:
  Test 1 — basic operation with randi inputs; use the OPERATOR SYMBOL syntax (a + b), not plus(a,b).
  Test 2 — result correct: assessVariableEqual on the relevant property of the result object.
  Test 3 — hardcoding detection: different randi range, same formula check.
  Test 4 — commutativity/symmetry where mathematically appropriate (a + b vs b + a).`
      : `Test order:
  Test 1 — instantiation: create obj with randperm(19)-10 values; assessVariableEqual('class(obj)', '${className}').
  Test 2 — each assessed property or return value individually with randperm(19)-10.
  Test 3 — combined check (all assessed values at once) with randperm(19)-10.
  Test 4 — hardcoding detection: different randi range.`;

    return {
      system: `You are an expert MATLAB educator creating MATLAB Grader assessment code.
Problem: "${option.title}". Problem type: Class (OOP). Class name: ${className}.
What is being assessed: ${classAssessment ?? 'unspecified'}.

Assessment code runs AFTER student code has already executed. NEVER call run().
${qualityRules}

${testOrder}`,
      user: `Reference solution for context:\n\n${solution}\n\nWrite the MATLAB Grader test cases.`,
      maxTokens: 1200,
    };
  }

  // ── Script / Function ────────────────────────────────────────────────────
  const fnExtra = option.problem_type === 'Function'
    ? `
Test order:
  Test 1 — call the function with randi inputs; check primary output.
  Test 2 — check each output individually with randperm(19)-10 where swap detection matters.
  Test 3 — hardcoding detection with a clearly different randi range.
  Test 4 — edge case or additional output if applicable.`
    : `
Test order:
  Test 1 — primary output variable exists and value is correct (randi inputs where applicable).
  Test 2 — additional output or intermediate variable if assessed.
  Test 3 — hardcoding detection with a clearly different randi range.`;

  return {
    system: `You are an expert MATLAB educator creating MATLAB Grader assessment code.
Problem: "${option.title}". Problem type: ${option.problem_type}.

Assessment code runs AFTER student code has already executed. NEVER call run().
${qualityRules}
${fnExtra}`,
    user: `Reference solution for context:\n\n${solution}\n\nWrite the MATLAB Grader test cases.`,
    maxTokens: 1200,
  };
}
