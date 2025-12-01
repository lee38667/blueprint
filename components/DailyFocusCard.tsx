import Card from './Card'

export default function DailyFocusCard(){
  return (
    <Card title="Daily Focus">
      <div>
        <p className="mb-2">Main focus: Build better habits</p>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded bg-teal text-black">Mark Done</button>
          <button className="px-3 py-1 rounded bg-gray-800">Snooze</button>
        </div>
      </div>
    </Card>
  )
}
