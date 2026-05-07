import Button from './Button'
import useVoiceCapture from '../hooks/useVoiceCapture'

interface Props {
  onTranscript: (text: string) => void
  className?: string
  compact?: boolean
}

export default function VoiceInputButton({ onTranscript, className = '', compact = false }: Props) {
  const { supported, listening, error, start, stop } = useVoiceCapture(onTranscript)

  if (!supported) return null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        size={compact ? 'sm' : 'md'}
        variant={listening ? 'danger' : 'outline'}
        onClick={listening ? stop : start}
      >
        {listening ? 'Stop voice' : 'Voice'}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
