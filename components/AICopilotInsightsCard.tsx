import Card from './Card'
import useAIBrain from '../hooks/useAIBrain'

export default function AICopilotInsightsCard(){
  const { insights, loading, error, refresh } = useAIBrain({ auto: true })

  return (
    <Card title="AI Copilot Intelligence">
      <div className="flex items-center justify-between gap-4 mb-4 text-sm text-neutral-300">
        <p className="flex-1 text-neutral-100">
          {loading && 'Synthesizing today\'s briefing...'}
          {!loading && insights?.summary}
          {!loading && !insights && !error && 'Need more data to generate insights—log a task, goal, or mood.'}
          {error && <span className="text-red-400">{error}</span>}
        </p>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-xs px-3 py-1 rounded-full border border-electric/40 text-electric hover:bg-electric/10 transition disabled:opacity-50 disabled:hover:bg-transparent"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0,1,2].map(i => (
            <div key={i} className="h-3 w-full bg-white/10 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!loading && insights && (
        <div className="space-y-4 text-sm text-neutral-200">
          {insights.taskSuggestions?.length > 0 && (
            <section>
              <p className="uppercase text-xs tracking-wide text-neutral-400 mb-1">Task Focus</p>
              <ul className="space-y-2">
                {insights.taskSuggestions.map((tip, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-electric">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {insights.goalHighlights?.length > 0 && (
            <section>
              <p className="uppercase text-xs tracking-wide text-neutral-400 mb-1">Goal Trajectory</p>
              <ul className="space-y-2">
                {insights.goalHighlights.map((tip, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-teal">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {insights.wellnessNote && (
            <section>
              <p className="uppercase text-xs tracking-wide text-neutral-400 mb-1">Wellness</p>
              <p className="text-neutral-100 bg-white/5 rounded-lg p-3">{insights.wellnessNote}</p>
            </section>
          )}

          {insights.riskAlerts && insights.riskAlerts.length > 0 && (
            <section>
              <p className="uppercase text-xs tracking-wide text-amber-300 mb-1">Watch Outs</p>
              <ul className="space-y-2">
                {insights.riskAlerts.map((tip, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-amber-300">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Card>
  )
}
