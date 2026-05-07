import { useEffect, useCallback, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
import { supabaseWithRetry } from '../lib/retry'
import { handleError } from '../lib/errors'
import { useToastStore } from '../lib/toastStore'
import type { DocumentItem } from '../types/models'

interface DocumentPayload {
  title: string
  type: string
  metadata: Record<string, any>
}

export function useContentLibrary(){
  const loading = useDataStore(s => s.documentsLoading)
  const loaded = useDataStore(s => s.documentsLoaded)
  const items = useDataStore(s => s.documents)
  const fetchDocuments = useDataStore(s => s.fetchDocuments)
  const toast = useToastStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(()=>{
    if (!loaded) fetchDocuments()
  },[loaded, fetchDocuments])

  const addRecord = useCallback(async (payload: DocumentPayload) => {
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('content').insert(payload))
      await fetchDocuments()
      toast.success('Document saved')
    } catch (err) {
      handleError(err, { fallback: 'Failed to add document', setError, toast })
    }
  }, [fetchDocuments, toast])

  const updateMetadata = useCallback(async (item: DocumentItem, metadataPatch: Record<string, any>) => {
    const merged = { ...(item.metadata ?? {}), ...metadataPatch }
    try {
      setError(null)
      await supabaseWithRetry(() => supabase.from('content').update({ metadata: merged }).eq('id', item.id))
      await fetchDocuments()
      toast.success('Document updated')
    } catch (err) {
      handleError(err, { fallback: 'Failed to update document', setError, toast })
    }
  }, [fetchDocuments, toast])

  return { loading, items, error, addRecord, updateMetadata }
}

export default useContentLibrary
