/**
 * react-joyride calls this with TooltipRenderProps: continuous, index,
 * isLastStep, size, step, backProps, primaryProps, skipProps, tooltipProps.
 * We ignore Joyride's own default tooltip UI entirely and render our own
 * card — this is what gives us FanakaCo's rounded/shadow/green-accent look
 * instead of Joyride's default appearance.
 */
export default function TourTooltip({ index, isLastStep, size, step, backProps, primaryProps, skipProps, tooltipProps }) {
  const progressPercent = ((index + 1) / size) * 100;

  return (
    <div
      {...tooltipProps}
      className="w-[400px] rounded-2xl bg-white shadow-xl p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
          Step {index + 1} of {size}
        </span>
        {!isLastStep && (
          <button {...skipProps} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
            Skip Tour
          </button>
        )}
      </div>

      <div className="h-1 w-full bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-green-600 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {step.title && <h3 className="text-lg font-bold text-green-900 mb-2">{step.title}</h3>}
      <p className="text-sm text-gray-600 mb-2">{step.content}</p>

      {step.data?.bullets && step.data.bullets.length > 0 && (
        <ul className="mb-2 space-y-1">
          {step.data.bullets.map((b) => (
            <li key={b} className="text-sm text-gray-700 flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              {b}
            </li>
          ))}
        </ul>
      )}

      {step.data?.footnote && <p className="text-xs text-gray-400 mb-1">{step.data.footnote}</p>}

      <div className="h-px bg-gray-100 my-4" />

      <div className="flex items-center justify-between">
        {index > 0 ? (
          <button {...backProps} className="text-sm font-medium text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50">
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button {...primaryProps} className="text-sm font-semibold text-white bg-green-700 px-4 py-1.5 rounded-lg hover:bg-green-800">
          {isLastStep ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  );
}