# MATLAB Grader Problem Generator

AI-assisted MATLAB Grader problem authoring tool by [VeriQAI](https://github.com/VeriQAi).

> **MATLAB and MATLAB Grader are trademarks of The MathWorks, Inc.
> This tool is not affiliated with or endorsed by MathWorks.**

---

## Usage

### Option A — Deployed app (recommended)

Open [https://veriqai.github.io/MatlabGraderProblemGenerator/](https://veriqai.github.io/MatlabGraderProblemGenerator/) in Chrome or Edge.

### Option B — Run locally

```bash
git clone https://github.com/VeriQAi/MatlabGraderProblemGenerator.git
cd MatlabGraderProblemGenerator
npm install
npm run dev
# → http://localhost:3002/MatlabGraderProblemGenerator/
```

---

## Workflow

1. Enter your Anthropic API key — sign up, purchase API credits, and create a dedicated key
   with a spending limit at [console.anthropic.com](https://console.anthropic.com) before use.
2. Select a Claude model (Sonnet 4.6 recommended).
3. Enter a learning objective and choose a problem type: **Script**, **Function**, **Class**, or **Object usage**.
   - For **Class** problems, also select what is being assessed (constructor property assignment,
     computed property, instance method, constant property, or operator overloading).
4. Accept the usage conditions.
5. Click **Generate Problem Options** and select the ones you want to develop.
6. Each selected problem is developed into 4 artifacts — review each one, then download.

---

## What gets generated

For each selected problem:

| File | Paste into MATLAB Grader |
|---|---|
| `*_description.txt` | Problem Description tab |
| `solution.m` | Reference Solution tab |
| `template.m` | Learner Template tab |
| `all_tests.m` | Each `% === TEST N ===` section → separate Test Case |

Test cases are written for **R2025b** (double-quoted `assessPattern` strings).

### Class problem specifics

| What is being assessed | What gets blanked in the template |
|---|---|
| Constructor — property assignment | Constructor body lines (`obj.prop = arg`) |
| Constructor — computed property | Derived property line only |
| Instance method | Method body |
| Constant property | Value inside `properties (Constant)` block |
| Operator overloading | Overloaded operator method body |

Class solutions are pure `classdef ClassName … end` files (no wrapper functions).
Descriptions include a full skeleton with only the assessed lines blanked, an analogous-class
hint, and a "Before you submit" local-testing snippet.
Test cases use `randperm(19)-10` random values to make swapped property assignments
always detectable, and follow the pattern: instantiation → properties → methods → `class()` check.

### Object usage problem specifics

Object usage is a script-type problem where students write code that creates, indexes, and
processes an array of objects. A complete, minimal supporting class is generated alongside
the problem artifacts.

| File | Purpose |
|---|---|
| `solution.m` | Contains both the supporting `ClassName.m` (delimited by `%%% SUPPORTING FILE %%%`) and the solved student script |
| `template.m` | Student script only, with `% YOUR CODE HERE` blanks |

In MATLAB Grader: paste the class portion of `solution.m` into **Supporting Files** and the
script portion into **Reference Solution**. The template goes into **Learner Template** as-is.

### all_tests.m quality rules (all problem types)

- **No fixed inputs** — tests always use `randi` or `randperm(19)-10` for random values.
- **Simple format** — each test is one `%% Test N: description` section, 1–3 lines of setup, one `assessVariableEqual` call. No `try/catch`, `fprintf`, or `if/else`.
- **3–5 tests maximum.**
- **Hardcoding detection** — at least one test uses a clearly different numeric range so a hardcoded answer fails.
- **No markdown fences** — output is plain MATLAB.

---

## API Key & Privacy

- Your API key is used **only in your browser session** and sent **only to `api.anthropic.com`**.
- It is **never stored, logged, or persisted** anywhere — gone on page refresh.
- A Content Security Policy (`connect-src https://api.anthropic.com`) restricts all
  network calls to Anthropic's API only.

## Cost

API usage is very low. Generating and fully developing 4 problems (approx. 20 API calls)
costs around **$0.05–$0.10** with Claude Sonnet 4.6. A **$5 spending limit** is more than
enough for extensive use.

Sign up, purchase credits, and create a key at [console.anthropic.com](https://console.anthropic.com).

---

## Deployment

```bash
npm run deploy      # builds and pushes to gh-pages branch
git push origin main
```

---

## Disclaimer

Generated content is produced by an AI model and must be reviewed before use in any
assessment context. This tool is provided "as is" under the MIT licence without warranty
of any kind. VeriQAI accepts no liability for inaccurate, incomplete, or harmful content.

## Built With

*React, Vite, Tailwind CSS, JSZip, Lucide, and the Anthropic SDK.*

## License

MIT — VeriQAI
