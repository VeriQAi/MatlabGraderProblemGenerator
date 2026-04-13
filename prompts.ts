import type { ClassAssessment, ProblemOption, ProblemType } from './types';
import { toSnakeCase } from './api';

export function buildOptionsPrompt(objective: string, problemType: ProblemType, numOptions: number) {
  const classNote = problemType === 'Class'
    ? '\nFor Class problems, suggested_variable must be the PascalCase class name (e.g. "BankAccount"), not a variable name.'
    : problemType === 'Function'
    ? '\nFor Function problems, suggested_variable should be the primary output argument name.'
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
  "problem_type": "Script|Function|Class"
}
Vary difficulty: spread Easy, Medium, and Hard across the options.${classNote}
All problems must be of the problem_type requested by the user.`,
    user: `Learning objective: ${objective}\nProblem type: ${problemType}\nGenerate ${numOptions} problem options.`,
    maxTokens: Math.max(1200, numOptions * 250),
  };
}

export function buildDescriptionPrompt(option: ProblemOption, objective: string, classAssessment?: ClassAssessment) {
  if (option.problem_type === 'Class') {
    const className = option.suggested_variable;
    const assessmentCtx = classAssessment
      ? `The part being assessed is: ${classAssessment}.`
      : '';
    return {
      system: `You are an expert MATLAB educator creating MATLAB Grader problem materials.
Problem: "${option.title}". Difficulty: ${option.difficulty}.
Problem type: Class (OOP). Learning objective: ${objective}.
Class name: ${className}. ${assessmentCtx}

Write a clear student-facing problem description for MATLAB Grader.
Plain text only — no markdown headers or bold/italic markers.

IMPORTANT OOP RULES — follow every rule exactly:
- State that the student must name their file ${className}.m and that the classdef name must match exactly: classdef ${className}.
- Scaffold level: give the complete classdef skeleton in the instructions, blanking only the specific lines being assessed with % YOUR CODE HERE. Students see the full structure and fill in only what is assessed.
- Do NOT instruct students to write wrapper functions or scripts — the submission is the classdef file only.
- Hints must illustrate the concept using a different, analogous class (not ${className} itself). For example, if ${className} is Rectangle, hint with a Circle class.
- Include a "Before you submit" section at the end with a short local-testing code snippet the student can paste into the MATLAB command window to verify their class works, e.g. instantiating the object and checking a property or method result.`,
      user: 'Write the problem description.',
      maxTokens: 900,
    };
  }

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
  if (option.problem_type === 'Class') {
    const className = option.suggested_variable;

    const blankRule = classAssessment === 'Constructor — property assignment'
      ? `Blank ONLY the property-assignment lines inside the constructor body (the "obj.propName = argName;" lines). Replace each such line with "% YOUR CODE HERE". Keep every other line — including the "function obj = ${className}(...)" signature line, the "end" keywords, and all other method bodies — exactly as in the reference solution.`
      : classAssessment === 'Constructor — computed property'
      ? `Blank ONLY the line(s) inside the constructor that compute a derived property (e.g. "obj.area = ...;" or similar computed assignment). Replace those line(s) with "% YOUR CODE HERE". Keep all other lines — including simple property assignments, the function signature, and all end keywords — exactly as in the reference solution.`
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
  if (option.problem_type === 'Class') {
    const className = option.suggested_variable;
    return {
      system: `You are an expert MATLAB educator creating MATLAB Grader assessment code.
Problem: "${option.title}". Problem type: Class (OOP). Class name: ${className}.
What is being assessed: ${classAssessment ?? 'unspecified'}.

CRITICAL MATLAB Grader OOP rules — follow every rule exactly:
- Assessment code runs AFTER student code has already executed. NEVER call run() in assessment code.
- assessVariableEqual('varname', value)  — no Description parameter is supported.
- assessPattern("regex","Description","text")  — DOUBLE QUOTES required in R2025b.
- Do NOT use script_ran=true or exist() file guards. Class problems are assessed by instantiation.
- Use randperm(19)-10 to generate random integer test values so that swapped property assignments are always detectable (no accidental equality).
- Use randi([1 9]) for positive-integer arguments (e.g. dimensions, counts).
- Test order: (1) instantiation + class() check, (2) each property individually, (3) each method individually, (4) combined/integration test.
- Each test must: print a fprintf header, print conditional [FAIL] fprintf with specific feedback text, print [OK] fprintf, then call assessVariableEqual.
- Guard downstream checks with isa(obj,'${className}') on the instance variable.
- Separate tests with:  % ========= TEST N: Title =========
- Be verbose with diagnostics throughout.
- For class() check: assessVariableEqual('ans', '${className}') after calling class(obj).`,
      user: `Reference solution for context:\n\n${solution}\n\nWrite the MATLAB Grader test cases.`,
      maxTokens: 2000,
    };
  }

  const fnExtra = option.problem_type === 'Function'
    ? `
- For function problems, assess output variables directly by name.
- assessFunctionCall may be used to verify the function was called correctly.
- Test inputs must match the function signature from the reference solution.`
    : '';

  return {
    system: `You are an expert MATLAB educator creating MATLAB Grader assessment code.
Problem: "${option.title}". Problem type: ${option.problem_type}.

CRITICAL MATLAB Grader rules — follow every rule exactly:
- Assessment code runs AFTER student code has already executed. NEVER call run() in assessment code.
- assessVariableEqual('varname', value)  — no Description parameter is supported.
- assessPattern("regex","Description","text")  — DOUBLE QUOTES required in R2025b.
- Always guard downstream checks: if exist('x','var')==1 && isa(x,'expected_class')
- Use isa(obj,'classname') not just exist() to verify object type.
- Test 1 ONLY: set script_ran=true; call assessVariableEqual('script_ran',true);
  include whos and dir(pwd) diagnostics in Test 1 only.
- Each test must: print a fprintf header, print conditional [FAIL] fprintf with specific
  feedback text, print [OK] fprintf, then call assessVariableEqual.
- Use assessPattern("regex","Description","text") with DOUBLE QUOTES for
  structural or source-code checks where appropriate.
- Guard all downstream checks with exist() and isa().
- Separate tests with:  % ========= TEST N: Title =========
- Be verbose with diagnostics throughout.${fnExtra}`,
    user: `Reference solution for context:\n\n${solution}\n\nWrite the MATLAB Grader test cases.`,
    maxTokens: 2000,
  };
}
