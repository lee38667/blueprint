import { useState } from 'react'
import VSCodeSearch from './VSCodeSearch'

export default function Navbar(){
  const [openSearch, setOpenSearch] = useState(false)

  return (
    <header className="sticky top-0 bg-black/60 backdrop-blur p-4 flex items-center justify-between z-20">
      <div className="flex items-center gap-4">
        <button onClick={()=>setOpenSearch(true)} className="px-3 py-2 rounded bg-gray-800">Search</button>
        <div className="text-lg">Welcome</div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">User</div>
      </div>
      {openSearch && <VSCodeSearch onClose={()=>setOpenSearch(false)} />}
    </header>
  )
}
