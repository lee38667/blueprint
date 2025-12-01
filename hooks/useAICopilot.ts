import { useState } from 'react'

export function useAICopilot(){
  const [insights, setInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function analyzeMood(mood: string){
    setLoading(true)
    // Placeholder: integrate AI endpoint here
    await new Promise((r)=>setTimeout(r, 700))
    setInsights(`Thanks for sharing — here's an encouraging note about ${mood}.`)
    setLoading(false)
  }

  return { insights, loading, analyzeMood }
}

export default useAICopilot
