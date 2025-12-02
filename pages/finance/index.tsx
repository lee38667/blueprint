import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useFinance } from '../../hooks/useFinance'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function FinancePage(){
  const { summary, loading } = useFinance()
  const [balance, setBalance] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!balance) return
    setSaving(true)
    const value = parseFloat(balance)
    try {
      // upsert summary
      if (summary?.id) {
        await supabase.from('finance_summary').update({ balance: value }).eq('id', summary.id)
      } else {
        await supabase.from('finance_summary').insert({ balance: value })
      }

      // insert history row
      await supabase.from('finance_history').insert({ balance: value, note: note || null })

      setBalance('')
      setNote('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl mb-4">Finance</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Record Balance">
              <form onSubmit={handleRecord} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Current Balance ($)</label>
                  <input
                    value={balance}
                    onChange={e => setBalance(e.target.value)}
                    type="number"
                    step="0.01"
                    className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none focus:border-electric resize-none"
                  />
                </div>
                <Button 
                  variant="primary" 
                  className={`w-full text-xs ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={() => {}}
                >
                  {saving ? 'Saving…' : 'Save Balance'}
                </Button>
              </form>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
              <Card title="Savings">{loading ? <div className="card-skeleton h-24"/> : `Savings: $${summary?.savings ?? '—'}`}</Card>
              <Card title="Debt">{loading ? <div className="card-skeleton h-24"/> : `Debt: $${summary?.debt ?? '—'}`}</Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
