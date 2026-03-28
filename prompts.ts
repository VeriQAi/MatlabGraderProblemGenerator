import type { ProblemOption, ProblemType } from './types';
import { toSnakeCase } from './api';

export function buildOptionsPrompt(objective: string, problemType: ProblemType, numOptions: number) {
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
  "problem_type": "Script|Function"
}
Vary difficulty: spread Easy, Medium, and Hard across the options.
For Function problems, suggested_variable should be the primary output argument name.
All problems must be of the problem_type requested by the user.`,
    user: `Learning objective: ${objective}\nProblem type: ${problemType}\nGenerate ${numOptions} problem options.`,
    maxTokens: Math.max(1200, numOptions * 250),
  };
}

export function buildDescriptionPrompt(option: ProblemOption, objective: string) {
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

export function buildTemplatePrompt(option: ProblemOption, solution: string) {
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

export function buildTestsPrompt(option: ProblemOption, solution: string) {
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
