import Card from './Card'
import useAIBrain from '../hooks/useAIBrain'

type SectionKey = 'summary' | 'tasks' | 'goals' | 'wellness' | 'risk'

interface Props {
  title?: string
  sections?: SectionKey[]
  auto?: boolean
}

export default function AICopilotInsightsCard({
  title = 'AI Copilot Intelligence',
  sections,
  auto = true
}: Props){
  const activeSections = sections ?? ['summary', 'tasks', 'goals', 'wellness', 'risk']
  const showSummary = activeSections.includes('summary')
  const showTasks = activeSections.includes('tasks')
  const showGoals = activeSections.includes('goals')
  const showWellness = activeSections.includes('wellness')
  const showRisk = activeSections.includes('risk')

  const { insights, loading, error, refresh } = useAIBrain({ auto })

  const summaryText = loading
    ? "Synthesizing today's briefing..."
    : insights?.summary || (!error ? 'Need more data to generate insights—log a task, goal, or mood.' : '')

  return (
    <Card title={title}>
      <div className="flex items-center justify-between gap-4 mb-4 text-sm text-neutral-300">
        {showSummary ? (
          <p className="flex-1 text-neutral-100">
            {summaryText}
            {error && <span className="text-red-400">{error}</span>}
          </p>
        ) : (
          <p className="flex-1 text-neutral-500 text-xs">
            AI brain ready
            {error && <span className="text-red-400 ml-2">{error}</span>}
          </p>
        )}
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
          {showTasks && insights.taskSuggestions?.length > 0 && (
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

          {showGoals && insights.goalHighlights?.length > 0 && (
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

          {showWellness && insights.wellnessNote && (
            <section>
              <p className="uppercase text-xs tracking-wide text-neutral-400 mb-1">Wellness</p>
              <p className="text-neutral-100 bg-white/5 rounded-lg p-3">{insights.wellnessNote}</p>
            </section>
          )}

          {showRisk && insights.riskAlerts && insights.riskAlerts.length > 0 && (
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
