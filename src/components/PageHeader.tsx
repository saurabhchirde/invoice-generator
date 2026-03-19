import { forwardRef } from 'react';
import { cn } from './ui/utils';

interface PageHeaderProps {
  /** Fires when the back button is clicked. Omit to hide the back button. */
  onBack?: () => void;
  title?: React.ReactNode;
  /** Optional subtitle rendered below the title (e.g. on the list page). */
  subtitle?: string;
  /** Right-side action buttons / elements. */
  actions?: React.ReactNode;
  /** Extra classes on the outer wrapper (e.g. to change background). */
  className?: string;
  /** Adds print:hidden — useful for pages where the header should not print. */
  printHidden?: boolean;
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  function PageHeader({ onBack, title, subtitle, actions, className, printHidden }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'sticky top-0 z-10 bg-white border-b',
          printHidden && 'print:hidden',
          className,
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 h-16 flex items-center justify-between gap-3">

          {/* Left: back + title */}
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium shrink-0"
              >
                ← Back
              </button>
            )}
            {(title || subtitle) && (
              <div className="min-w-0">
                {title && (
                  <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          {/* Right: actions */}
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}

        </div>
      </div>
    );
  },
);
