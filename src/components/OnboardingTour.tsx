import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapPin, List, Shuffle, History, Sparkles, Settings } from 'lucide-react';

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
    title: 'Search and Center',
    description:
      'Zoom the map to find the area you care about, then use the radius selector to keep suggestions nearby.',
    icon: <MapPin className="w-12 h-12 text-blue-600" />,
    selector: '[data-tour-target="map-container"]'
  },
  {
    title: 'Filters & Radius in Map View',
    description:
      'When on map view, open the floating panel to tweak the search radius and add filters so you only see restaurants that fit your preferences. Hide restaurants by cuisine, rating, or other criteria.',
    icon: <Settings className="w-12 h-12 text-emerald-600" />,
    selector: '[data-tour-target="filters-panel-map"]'
  },
  {
    title: 'Map, List, or Fun Picks',
    description:
      'Switch between Map, List, Random, and Wheel to explore restaurants in the way that suits your team. Map shows all options at once, List for details, Random for a quick pick, and Wheel for group decisions.',
    icon: (
      <div className="flex items-center gap-2">
        <List className="w-10 h-10 text-purple-600" />
        <Shuffle className="w-10 h-10 text-amber-500" />
      </div>
    ),
    selector: '[data-tour-target="view-mode-tabs"]'
  },
  {
    title: 'Track Visited Restaurants',
    description:
      'Keep track of places you\'ve visited. Mark restaurants as visited, and they\'ll be hidden from future searches. This helps you discover new options instead of seeing the same places again.',
    icon: <History className="w-12 h-12 text-orange-500" />,
    selector: '[data-tour-target="history-tab"]'
  },
  {
    title: 'Tip: Mark as Visited',
    description:
      'Click the "Mark as visited" button on any restaurant card to hide it from future searches. You can view all visited places in the History tab and remove them if you want to see them again.',
    icon: <Sparkles className="w-12 h-12 text-amber-500" />,
    selector: '[data-tour-target="mark-as-visited-btn"]'
  },
  {
    title: 'Create Custom Filters',
    description:
      'Don\'t like certain cuisines or need specific features? Open the Settings and create filters to automatically hide restaurants that don\'t match your preferences. Combine multiple filters for more precise results.',
    icon: <Settings className="w-12 h-12 text-indigo-600" />
  },
  {
    title: 'Open Now Filter',
    description:
      'Use the "Open now only" toggle to see only restaurants that are currently accepting customers. Perfect for finding lunch right away without checking hours.',
    icon: <MapPin className="w-12 h-12 text-red-600" />,
    selector: '[data-tour-target="open-now-toggle"]'
  },
  {
    title: 'You\'re All Set!',
    description:
      'You now know how to search for restaurants, filter results, track visited places, and use different views. Happy lunch hunting! 🍽️',
    icon: <Sparkles className="w-12 h-12 text-amber-500" />
  }
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
    
    // Use a small timeout to allow for any transitions/rendering to complete
    const timer = setTimeout(() => {
      const found = document.querySelector<HTMLElement>(selector);
      if (!found) {
        setHighlightRect(null);
        return;
      }
      const rect = found.getBoundingClientRect();
      
      // If the element is hidden (0 width/height), don't highlight
      if (rect.width === 0 || rect.height === 0) {
        setHighlightRect(null);
        return;
      }

      setHighlightRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }, 150); // Increased slightly for stability

    return () => clearTimeout(timer);
  }, [isOpen, stepIndex]);

  useEffect(() => {
    updateHighlightRect();
    window.addEventListener('resize', updateHighlightRect);
    return () => window.removeEventListener('resize', updateHighlightRect);
  }, [updateHighlightRect]);

  const currentStep = steps[stepIndex];

  const isLastStep = stepIndex === steps.length - 1;

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
    <div className="fixed inset-0 z-[10001] flex items-center justify-center px-4 py-6">
      <div
        className="absolute inset-0 bg-slate-900/80"
        aria-hidden="true"
        onClick={handleSkip}
      />
      {highlightRect && (
        <div
          className="pointer-events-none absolute rounded-2xl border-2 border-white transition-all duration-300"
          style={{
            top: highlightRect.top - 12,
            left: highlightRect.left - 12,
            width: highlightRect.width + 24,
            height: highlightRect.height + 24,
            zIndex: 10002,
            borderColor: 'rgba(255, 255, 255, 0.9)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'saturate(1.8) brightness(1.2)',
            animation: 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
          }}
        />
      )}
      <div className="relative z-10 max-w-2xl w-full bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl p-6 text-slate-900 dark:text-dark-text animate-slide-up">
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
          <div className="flex items-center justify-center min-w-[80px]">{currentStep.icon}</div>
          <p className="text-base text-slate-500 dark:text-dark-text-secondary leading-relaxed">
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
