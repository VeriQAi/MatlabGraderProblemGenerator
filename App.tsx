import React, { useState, useCallback } from 'react';
import { INITIAL_STATE } from './types';
import type { AppState, ProblemOption } from './types';
import { callClaude, parseJsonResponse } from './api';
import {
  buildOptionsPrompt,
  buildDescriptionPrompt,
  buildSolutionPrompt,
  buildTemplatePrompt,
  buildTestsPrompt,
} from './prompts';
import { Header, Footer } from './components/Common';
import Stage0Input from './components/Stage0Input';
import Stage1Options from './components/Stage1Options';
import Stage2Generate from './components/Stage2Generate';
import Stage3Done from './components/Stage3Done';

// No localStorage usage anywhere in this app — API key lives only in React state.

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  // Separate error state for Stage0 (options generation error)
  const [stage0Error, setStage0Error] = useState<string | null>(null);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setState(s => ({ ...s, logs: [...s.logs, `${time}  ${msg}`] }));
  }, []);

  // ── Stage 0 → loading_options → options ──────────────────────────────────

  const handleGenerateOptions = async () => {
    const { apiKey, model, objective, problemType } = state;
    setStage0Error(null);
    setState(s => ({ ...s, stage: 'loading_options', options: [], selectedIds: [] }));

    try {
      const prompt = buildOptionsPrompt(objective, problemType, state.numOptions);
      const raw = await callClaude(prompt, apiKey, model, msg => {
        // log silently during options loading — no log panel visible yet
        console.debug(msg);
      });
      const options = parseJsonResponse<ProblemOption[]>(raw);
      if (!Array.isArray(options) || options.length === 0) {
        throw new Error('Claude returned an empty or invalid options list.');
      }
      setState(s => ({ ...s, stage: 'options', options }));
    } catch (e) {
      setStage0Error(String(e));
      setState(s => ({ ...s, stage: 'input' }));
    }
  };

  // ── Artifact generation (stages generating → review) ─────────────────────

  const runGeneration = useCallback(async (
    problemIdx: number,
    currentState: AppState
  ) => {
    const { apiKey, model, objective, options, selectedIds } = currentState;
    const selectedProblems = options.filter(o => selectedIds.includes(o.id));
    const option = selectedProblems[problemIdx];

    setState(s => ({
      ...s,
      stage: 'generating',
      currentProblemIdx: problemIdx,
      generatingStep: 0,
      error: null,
      logs: [],
    }));

    try {
      // Step 0 – Description
      const description = await callClaude(
        buildDescriptionPrompt(option, objective), apiKey, model, addLog
      );
      setState(s => ({ ...s, generatingStep: 1 }));

      // Step 1 – Solution
      const solution = await callClaude(
        buildSolutionPrompt(option, objective), apiKey, model, addLog
      );
      setState(s => ({ ...s, generatingStep: 2 }));

      // Step 2 – Template (needs solution as context)
      const template = await callClaude(
        buildTemplatePrompt(option, solution), apiKey, model, addLog
      );
      setState(s => ({ ...s, generatingStep: 3 }));

      // Step 3 – Tests (needs solution as context)
      const tests = await callClaude(
        buildTestsPrompt(option, solution), apiKey, model, addLog
      );

      const artifacts = { description, solution, template, tests };
      setState(s => ({
        ...s,
        stage: 'review',
        generatingStep: 4,
        generatedProblems: [...s.generatedProblems, { option, artifacts }],
        activeReviewTab: 'description',
      }));
      addLog('[Done] all 4 artifacts generated.');

    } catch (e) {
      setState(s => ({ ...s, error: String(e) }));
    }
  }, [addLog]);

  const handleGenerateSelected = () => {
    runGeneration(0, state);
  };

  const handleNextProblem = () => {
    const { currentProblemIdx, selectedIds } = state;
    const next = currentProblemIdx + 1;
    if (next < selectedIds.length) {
      runGeneration(next, state);
    } else {
      setState(s => ({ ...s, stage: 'done' }));
    }
  };

  const handleRetry = () => {
    runGeneration(state.currentProblemIdx, state);
  };

  const handleStartOver = () => {
    setStage0Error(null);
    setState(INITIAL_STATE);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const { stage } = state;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-10">

        {stage === 'input' && (
          <Stage0Input
            state={state}
            setState={setState}
            onGenerate={handleGenerateOptions}
            error={stage0Error}
          />
        )}

        {stage === 'loading_options' && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <svg
              className="animate-spin h-10 w-10 text-brand-accent"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-gray-600 font-medium">Generating problem options…</p>
            <p className="text-gray-400 text-sm">This usually takes 5–10 seconds.</p>
          </div>
        )}

        {stage === 'options' && (
          <Stage1Options
            state={state}
            setState={setState}
            onGenerate={handleGenerateSelected}
            onBack={() => setState(s => ({ ...s, stage: 'input' }))}
          />
        )}

        {(stage === 'generating' || stage === 'review') && (
          <Stage2Generate
            state={state}
            setState={setState}
            onNext={handleNextProblem}
            onRetry={handleRetry}
          />
        )}

        {stage === 'done' && (
          <Stage3Done state={state} onStartOver={handleStartOver} />
        )}

      </main>

      <Footer />
    </div>
  );
};

export default App;
