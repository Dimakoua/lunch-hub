import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MapPin, List, Shuffle, History, Sparkles, Settings, RotateCcw } from 'lucide-react';

const pulseKeyframes = `
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7), 0 0 30px rgba(15, 23, 42, 0.55); }
    50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0), 0 0 40px rgba(15, 23, 42, 0.75); }
  }
  @keyframes highlight-pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
`;

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  selector?: string;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onStepChange?: (stepIndex: number) => void;
}

const steps: TourStep[] = [
  {
    title: 'Welcome to Lunch Hub! 👋',
    description:
      'All nearby restaurants appear as pins on the map. Tap any pin to open its details — name, cuisine, hours, and a walking-directions button.',
    icon: <MapPin className="w-12 h-12 text-blue-600" />,
  },
  {
    title: 'Drag the Blue Pin',
    description:
      'See the blue pin in the centre of the map? That\'s your search anchor. Drag it anywhere to update your location and instantly refresh nearby results.',
    icon: <MapPin className="w-12 h-12 text-indigo-500" />,
    selector: '.tour-user-pin',
  },
  {
    title: 'Radius & Filters',
    description:
      'This panel controls how far out to search and lets you filter by cuisine, name, or open hours. Tap the ⚙ gear icon to expand or collapse it any time.',
    icon: <Settings className="w-12 h-12 text-emerald-600" />,
    selector: '[data-tour-target="map-sidebar"]',
  },
  {
    title: 'Switch Views',
    description:
      'Use the tabs at the bottom to jump between Map, List, Random, and Spin Wheel. Each view gives you a completely different way to explore.',
    icon: (
      <div className="flex items-center gap-2">
        <MapPin className="w-8 h-8 text-blue-600" />
        <List className="w-8 h-8 text-purple-600" />
        <Shuffle className="w-8 h-8 text-amber-500" />
        <RotateCcw className="w-8 h-8 text-emerald-600" />
      </div>
    ),
    selector: '[data-tour-target="view-mode-tabs"]',
  },
  {
    title: 'Browse the List',
    description:
      'Every card shows cuisine, distance, rating, and hours. Tap "View on Map" to pin a restaurant, or share it directly with your team.',
    icon: <List className="w-12 h-12 text-blue-500" />,
    selector: '[data-tour-target="list-tab"]',
  },
  {
    title: 'Mark as Visited',
    description:
      'Hit "Mark as visited" on any card to hide that spot from future searches — so you always discover somewhere new.',
    icon: <History className="w-12 h-12 text-orange-500" />,
    selector: '[data-tour-target="mark-as-visited-btn"]',
  },
  {
    title: 'Track Your History',
    description:
      'All visited restaurants land in the History tab. Restore any of them at any time to bring them back into your search results.',
    icon: <History className="w-12 h-12 text-amber-500" />,
    selector: '[data-tour-target="history-tab"]',
  },
  {
    title: 'Restore a Restaurant',
    description:
      'Tap "Restore to results" on any history card to bring that spot back into your Map and List views — great when you want to revisit a favourite.',
    icon: <History className="w-12 h-12 text-blue-500" />,
    selector: '[data-tour-target="restore-btn"]',
  },
  {
    title: "Can't Decide? Random or Wheel!",
    description:
      'Hit the button in Random view for a quick lucky pick, or switch to Wheel for a fun group spin. Let fate decide your lunch.',
    icon: (
      <div className="flex items-center gap-3">
        <Shuffle className="w-10 h-10 text-purple-600" />
        <RotateCcw className="w-10 h-10 text-emerald-600" />
      </div>
    ),
    selector: '[data-tour-target="fun-picks-tabs"]',
  },
  {
    title: "You're All Set! 🍽️",
    description:
      "You know everything you need. Happy lunch hunting — may every meal be delicious!",
    icon: <Sparkles className="w-12 h-12 text-amber-500" />,
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onStepChange }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const wasOpenRef = useRef(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Inject pulse animation styles
  useEffect(() => {
    if (isOpen && !styleRef.current) {
      const style = document.createElement('style');
      style.textContent = pulseKeyframes;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    return () => {
      if (styleRef.current && !isOpen) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [isOpen]);

  // Reset step only when transition from closed to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setStepIndex(0);
      onStepChange?.(0);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, onStepChange]);

  const captureRect = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setHighlightRect(null);
      return;
    }
    setHighlightRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, []);

  const updateHighlightRect = useCallback(() => {
    if (!isOpen) {
      setHighlightRect(null);
      return;
    }
    const selector = steps[stepIndex].selector;
    if (!selector) {
      setHighlightRect(null);
      return;
    }

    // Give React time to finish rendering the new view before querying DOM
    const timer = setTimeout(() => {
      const found = document.querySelector<HTMLElement>(selector);
      if (!found) {
        setHighlightRect(null);
        return;
      }

      const rect = found.getBoundingClientRect();
      const isOffScreen = rect.top < 0 || rect.bottom > window.innerHeight || rect.left < 0 || rect.right > window.innerWidth;

      if (isOffScreen) {
        // Scroll into view then re-measure after animation settles
        found.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        const scrollTimer = setTimeout(() => captureRect(found), 400);
        return () => clearTimeout(scrollTimer);
      }

      captureRect(found);
    }, 250); // Enough time for view transitions + potential double re-render (map→list + showSettings change)

    return () => clearTimeout(timer);
  }, [isOpen, stepIndex, captureRect]);

  useEffect(() => {
    updateHighlightRect();
    window.addEventListener('resize', updateHighlightRect);
    return () => window.removeEventListener('resize', updateHighlightRect);
  }, [updateHighlightRect]);

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const highlightPadding = stepIndex === 1 ? 18 : 12;
  const highlightBorderRadius = stepIndex === 1 ? '9999px' : '16px';

  // Position the popup card so it never sits on top of the highlight.
  // If the highlight is in the lower half of the viewport → anchor card to top.
  // If the highlight is in the upper half → anchor card to bottom.
  // No highlight → center vertically.
  const cardStyle = useMemo((): React.CSSProperties => {
    const safeTop = 'calc(16px + env(safe-area-inset-top, 0px))';
    const safeBottom = 'calc(74px + env(safe-area-inset-bottom, 0px))';
    if (!highlightRect) {
      return { top: '50%', transform: 'translateY(-50%)', maxHeight: 'calc(100vh - 120px)' };
    }
    const highlightCenterY = highlightRect.top + highlightRect.height / 2;
    if (highlightCenterY > window.innerHeight / 2) {
      return { top: safeTop, maxHeight: 'calc(100vh - 120px)' };
    }
    return { bottom: safeBottom, maxHeight: 'calc(100vh - 120px)' };
  }, [highlightRect]);

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      return;
    }
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    onStepChange?.(nextIndex);
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      return;
    }
    const nextIndex = stepIndex - 1;
    setStepIndex(nextIndex);
    onStepChange?.(nextIndex);
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10001]">
      <div
        className="absolute inset-0 bg-slate-900/50"
        aria-hidden="true"
        onClick={handleSkip}
      />
      {highlightRect && (
        <>
          <div
            className="pointer-events-none absolute transition-all duration-300"
            style={{
              top: highlightRect.top - highlightPadding,
              left: highlightRect.left - highlightPadding,
              width: highlightRect.width + highlightPadding * 2,
              height: highlightRect.height + highlightPadding * 2,
              zIndex: 10002,
              borderRadius: highlightBorderRadius,
              border: stepIndex === 1 ? '2px solid rgba(59, 130, 246, 0.95)' : '2px solid rgba(255, 255, 255, 0.9)',
              backgroundColor: stepIndex === 1 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'saturate(1.8) brightness(1.2)',
              animation: 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              boxShadow: stepIndex === 1
                ? '0 0 30px rgba(59, 130, 246, 0.45), inset 0 0 25px rgba(59, 130, 246, 0.15)'
                : '0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
            }}
          />
          {stepIndex === 1 && (
            <div
              className="pointer-events-none absolute z-[10003] inline-flex items-center gap-2 rounded-full bg-blue-600/95 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-xl shadow-blue-500/30"
              style={{
                top: Math.max(10, highlightRect.top - 42),
                left: Math.max(10, highlightRect.left + highlightRect.width / 2 - 72),
                minWidth: 130,
                height: 34,
              }}
            >
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              Drag the pin
            </div>
          )}
        </>
      )}
      <div
        className="absolute left-2 right-2 sm:left-4 sm:right-4 mx-auto max-w-lg sm:max-w-xl z-[10003] bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-900 dark:text-dark-text"
        style={cardStyle}
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-dark-text-secondary">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <h2 className="text-2xl font-semibold">{currentStep.title}</h2>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <div className="flex items-center justify-center min-w-[60px] sm:min-w-[80px]">
            {currentStep.icon}
          </div>
          <p className="text-sm lg:text-base text-slate-500 dark:text-dark-text-secondary leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between text-sm text-slate-500 dark:text-dark-text-secondary">
          <button
            onClick={handleSkip}
            className="hover:text-slate-700 dark:hover:text-dark-text transition-colors"
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
              className="px-5 py-2 rounded-full bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition active:scale-95"
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
