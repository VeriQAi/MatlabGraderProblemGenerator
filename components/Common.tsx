import React, { useEffect, useRef } from 'react';
import { AlertCircle, Download } from 'lucide-react';
import type { Difficulty, ProblemType } from '../types';

// ─── Header ───────────────────────────────────────────────────────────────────

export const Header: React.FC = () => (
  <header className="bg-brand-dark text-white shadow-md">
    <div className="max-w-5xl mx-auto px-6 py-4 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-bold leading-tight tracking-tight">
          MATLAB Grader Problem Generator
        </h1>
        <p className="text-brand-light text-sm mt-0.5">
          AI-assisted problem authoring for MATLAB Grader
        </p>
      </div>
      <a
        href="https://github.com/VeriQAi"
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 ml-4"
      >
        <img
          src={`${import.meta.env.BASE_URL}veriqai-logo.png`}
          alt="VeriQAI"
          className="h-12 w-auto hover:opacity-80 transition-opacity"
        />
      </a>
    </div>
  </header>
);

// ─── Footer ───────────────────────────────────────────────────────────────────

export const Footer: React.FC = () => (
  <footer className="border-t border-gray-200 bg-white mt-12">
    <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
      <div className="flex items-center gap-4">
        <span>© VeriQAI — MIT License</span>
        <span>v1.0.0</span>
        <a
          href="https://github.com/VeriQAi/MatlabGraderProblemGenerator"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-accent hover:underline"
        >
          View on GitHub
        </a>
      </div>
      <p className="text-center sm:text-right text-gray-400">
        MATLAB and MATLAB Grader are trademarks of The MathWorks, Inc. This tool is not
        affiliated with or endorsed by MathWorks.
      </p>
    </div>
  </footer>
);

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-brand-accent hover:bg-brand-dark text-white focus:ring-brand-accent',
    secondary: 'bg-white hover:bg-gray-50 text-brand-dark border border-brand-accent focus:ring-brand-accent',
    danger:    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost:     'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-2.5',
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

// ─── SectionLabel ─────────────────────────────────────────────────────────────

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{children}</label>
);

// ─── Badges ───────────────────────────────────────────────────────────────────

export const DifficultyBadge: React.FC<{ difficulty: Difficulty }> = ({ difficulty }) => {
  const styles: Record<Difficulty, string> = {
    Easy:   'bg-[#e2efda] text-[#375623]',
    Medium: 'bg-[#fff2cc] text-[#7d6608]',
    Hard:   'bg-[#fce4d6] text-[#843c0c]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${styles[difficulty]}`}>
      {difficulty}
    </span>
  );
};

export const ProblemTypeBadge: React.FC<{ type: ProblemType }> = ({ type }) => {
  const styles: Record<ProblemType, string> = {
    Script:         'bg-[#dce6f1] text-[#1F4E79]',
    Function:       'bg-[#e2efda] text-[#375623]',
    Class:          'bg-[#ede7f6] text-[#4527a0]',
    'Object usage': 'bg-[#fff3e0] text-[#e65100]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${styles[type]}`}>
      {type}
    </span>
  );
};

// ─── CodeViewer ───────────────────────────────────────────────────────────────

interface CodeViewerProps {
  filename: string;
  content: string;
  onDownload: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ filename, content, onDownload }) => (
  <div className="rounded-lg overflow-hidden border border-gray-700">
    <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
      <span className="text-gray-300 text-xs font-mono">{filename}</span>
      <button
        onClick={onDownload}
        className="flex items-center gap-1 text-xs text-gray-300 hover:text-white transition-colors"
      >
        <Download size={13} />
        Download
      </button>
    </div>
    <pre
      className="bg-[#1e1e2e] text-[#cdd6f4] text-sm font-mono p-4 overflow-auto scrollbar-thin"
      style={{ maxHeight: '320px' }}
    >
      {content}
    </pre>
  </div>
);

// ─── LogPanel ─────────────────────────────────────────────────────────────────

export const LogPanel: React.FC<{ logs: string[] }> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      className="bg-gray-100 border border-gray-200 rounded p-2 overflow-y-auto scrollbar-thin"
      style={{ maxHeight: '80px', fontFamily: 'Courier New, monospace', fontSize: '11px' }}
    >
      {logs.length === 0 ? (
        <span className="text-gray-400">Waiting...</span>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="text-gray-600 leading-relaxed">{log}</div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};

// ─── ErrorPanel ───────────────────────────────────────────────────────────────

export const ErrorPanel: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="rounded-lg border border-red-300 bg-[#FCE4D6] p-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-800 mb-1">Error</p>
        <pre className="text-xs text-red-700 whitespace-pre-wrap break-words font-mono">
          {message}
        </pre>
      </div>
    </div>
    {onRetry && (
      <div className="mt-3">
        <Button variant="danger" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    )}
  </div>
);

// ─── StepChecklist ────────────────────────────────────────────────────────────

const STEP_LABELS = [
  'Description & Instructions',
  'Reference Solution (.m)',
  'Learner Template (.m)',
  'Test Cases (.m)',
];

export const StepChecklist: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <ul className="space-y-2">
    {STEP_LABELS.map((label, i) => {
      const done    = i < currentStep;
      const active  = i === currentStep;
      const pending = i > currentStep;
      return (
        <li key={i} className="flex items-center gap-3 text-sm">
          {done && (
            <span className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center text-xs flex-shrink-0">
              ✓
            </span>
          )}
          {active && (
            <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              <svg className="animate-spin h-5 w-5 text-brand-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </span>
          )}
          {pending && (
            <span className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0" />
          )}
          <span className={done ? 'text-gray-500 line-through' : active ? 'text-brand-dark font-medium' : 'text-gray-400'}>
            {label}
          </span>
        </li>
      );
    })}
  </ul>
);
