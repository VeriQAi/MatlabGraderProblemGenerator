export type Stage =
  | 'input'
  | 'loading_options'
  | 'options'
  | 'generating'
  | 'review'
  | 'done';

export type ProblemType = 'Script' | 'Function' | 'Class' | 'Object usage';
export type ClassAssessment =
  | 'Constructor — property assignment'
  | 'Constructor — computed property'
  | 'Instance method'
  | 'Constant property'
  | 'Operator overloading';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type ReviewTab = 'description' | 'solution' | 'template' | 'tests';

export type ModelId =
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-6'
  | 'claude-opus-4-6';

export const MODEL_OPTIONS: { label: string; value: ModelId }[] = [
  { label: 'Claude Haiku 4.5 — fastest, lowest cost',  value: 'claude-haiku-4-5-20251001' },
  { label: 'Claude Sonnet 4.6 — recommended',          value: 'claude-sonnet-4-6' },
  { label: 'Claude Opus 4.6 — most capable',           value: 'claude-opus-4-6' },
];

export interface ProblemOption {
  id: number;
  title: string;
  difficulty: Difficulty;
  concept_focus: string;
  brief_description: string;
  suggested_variable: string;
  problem_type: ProblemType;
}

export interface Artifacts {
  description: string;
  solution: string;
  template: string;
  tests: string;
}

export interface GeneratedProblem {
  option: ProblemOption;
  artifacts: Artifacts;
}

export interface AppState {
  stage: Stage;
  // Stage 0 inputs
  apiKey: string;
  showApiKey: boolean;
  model: ModelId;
  objective: string;
  numOptions: number;
  problemType: ProblemType;
  classAssessment: ClassAssessment;
  disclosureAccepted: boolean;
  // Stage 1
  options: ProblemOption[];
  selectedIds: number[];
  // Stage 2/3
  generatedProblems: GeneratedProblem[];
  currentProblemIdx: number;
  generatingStep: number; // 0–3 active, 4 = all done
  logs: string[];
  error: string | null;
  // Review
  activeReviewTab: ReviewTab;
}

export const INITIAL_STATE: AppState = {
  stage: 'input',
  apiKey: '',
  showApiKey: false,
  model: 'claude-sonnet-4-6',
  objective: '',
  numOptions: 4,
  problemType: 'Script',
  classAssessment: 'Constructor — property assignment',
  disclosureAccepted: false,
  options: [],
  selectedIds: [],
  generatedProblems: [],
  currentProblemIdx: 0,
  generatingStep: 0,
  logs: [],
  error: null,
  activeReviewTab: 'description',
};
