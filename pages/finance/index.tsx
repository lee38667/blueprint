import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useFinance } from '../../hooks/useFinance'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function FinancePage(){
  const { summary, loading, history, logs, targets, addLog, addTarget } = useFinance()
  const [balance, setBalance] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [logAmount, setLogAmount] = useState('')
  const [logType, setLogType] = useState<'income'|'expense'>('income')
  const [logCategory, setLogCategory] = useState('')
  const [logNote, setLogNote] = useState('')
  const [targetMonth, setTargetMonth] = useState('')
  const [targetAmount, setTargetAmount] = useState('')

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

  const handleAddLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!logAmount) return
    await addLog({ type: logType, amount: parseFloat(logAmount), category: logCategory || null, note: logNote || null })
    setLogAmount(''); setLogCategory(''); setLogNote('')
  }

  const handleAddTarget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!targetMonth || !targetAmount) return
    await addTarget(targetMonth, parseFloat(targetAmount))
    setTargetMonth(''); setTargetAmount('')
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
              <Card title="Income / Expense Log">
                <form onSubmit={handleAddLog} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <select value={logType} onChange={e=>setLogType(e.target.value as any)} className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm">
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <input value={logAmount} onChange={e=>setLogAmount(e.target.value)} type="number" step="0.01" placeholder="$ Amount" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
                  <input value={logCategory} onChange={e=>setLogCategory(e.target.value)} placeholder="Category" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
                  <input value={logNote} onChange={e=>setLogNote(e.target.value)} placeholder="Note" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
                  <Button variant="primary" className="text-xs w-full md:w-auto">Add</Button>
                </form>
                <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
                  {logs.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-2 rounded border border-white/10 bg-white/5 text-sm">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded ${l.type==='income'?'bg-teal/20 text-teal':'bg-red-500/20 text-red-300'}`}>{l.type}</span>
                        <span>${l.amount.toFixed(2)}</span>
                        {l.category && <span className="text-neutral-400">{l.category}</span>}
                      </div>
                      {l.note && <span className="text-xs text-neutral-500">{l.note}</span>}
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Savings Targets">
                <form onSubmit={handleAddTarget} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <input type="month" value={targetMonth} onChange={e=>setTargetMonth(e.target.value)} className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
                  <input type="number" step="0.01" value={targetAmount} onChange={e=>setTargetAmount(e.target.value)} placeholder="$ Target" className="rounded bg-black/40 border border-white/10 px-3 py-2 text-sm" />
                  <Button variant="primary" className="text-xs w-full md:w-auto">Set Target</Button>
                </form>
                <div className="mt-4 space-y-2">
                  {targets.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded border border-white/10 bg-white/5 text-sm">
                      <span>{t.month}</span>
                      <span className="font-mono">${t.target_amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            <div className="md:col-span-3">
              <Card title="Balance History">
                {loading ? (
                  <div className="card-skeleton h-24" />
                ) : (
                  <div className="space-y-2 text-sm">
                    {history.map((h,i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border border-white/10 bg-white/5">
                        <span className="text-neutral-400">{new Date(h.recorded_at).toLocaleDateString()}</span>
                        <span className="font-mono">${h.balance}</span>
                        {h.delta && <span className="text-xs text-teal">Δ {h.delta}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
