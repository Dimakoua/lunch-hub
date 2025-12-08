import React, { useEffect, useState } from 'react';
import { MapPin, List, Shuffle, RotateCcw, History, Sparkles, Settings } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  selector?: string;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps: TourStep[] = [
  {
    title: 'Search and Center',
    description:
      'Zoom the map to find the area you care about, then use the radius selector to keep suggestions nearby.',
    icon: <MapPin className="w-12 h-12 text-blue-600" />,
    selector: '[data-tour-target="map-container"]'
  },
  {
    title: 'Filters & Radius',
    description:
      'Open Settings to tweak the search radius and add filters so you only see restaurants that fit your preferences.',
    icon: <Settings className="w-12 h-12 text-emerald-600" />,
    selector: '[data-tour-target="settings-button"]'
  },
  {
    title: 'Map, List, or Fun Picks',
    description:
      'Switch between Map, List, Random, and Wheel to explore restaurants in the way that suits your team.',
    icon: (
      <div className="flex items-center gap-2">
        <List className="w-10 h-10 text-purple-600" />
        <Shuffle className="w-10 h-10 text-amber-500" />
      </div>
    ),
    selector: '[data-tour-target="view-mode-tabs"]'
  },
  {
    title: 'Filters & History',
    description:
      'Create custom filters to exclude places you have tried. Review your visited history anytime to bring favorites back.',
    icon: <History className="w-12 h-12 text-orange-500" />,
    selector: '[data-tour-target="history-tab"]'
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  const currentStep = steps[stepIndex];

  const isLastStep = stepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      return;
    }
    setStepIndex((prev) => prev - 1);
  };

  const handleSkip = () => {
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setHighlightRect(null);
      return;
    }
    const selector = steps[stepIndex].selector;
    if (!selector) {
      setHighlightRect(null);
      return;
    }
    const found = document.querySelector<HTMLElement>(selector);
    if (!found) {
      setHighlightRect(null);
      return;
    }
    const rect = found.getBoundingClientRect();
    setHighlightRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });
  }, [isOpen, stepIndex]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-slate-900/80"
        aria-hidden="true"
      />
      {highlightRect && (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-white/70 shadow-[0_0_30px_rgba(15,23,42,0.55)] bg-white/10 backdrop-saturate-150 backdrop-brightness-125"
          style={{
            top: highlightRect.top - 8,
            left: highlightRect.left - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            zIndex: 1101,
            boxShadow: '0 0 30px rgba(15, 23, 42, 0.55)'
          }}
        />
      )}
      <div className="relative z-10 max-w-2xl w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-dark-text">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-dark-text-secondary">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <h2 className="text-2xl font-semibold">{currentStep.title}</h2>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex items-center justify-center">{currentStep.icon}</div>
          <p className="text-base text-slate-500 dark:text-dark-text-secondary leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between text-sm text-slate-500 dark:text-dark-text-secondary">
          <button
            onClick={handleSkip}
            className="hover:text-slate-700 dark:hover:text-dark-text"
            type="button"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              disabled={stepIndex === 0}
              className={`px-4 py-2 rounded-full border transition ${
                stepIndex === 0
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-blue-200 text-blue-600 hover:border-blue-400 hover:text-blue-800'
              }`}
              type="button"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition"
              type="button"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

OnboardingTour.displayName = 'OnboardingTour';
