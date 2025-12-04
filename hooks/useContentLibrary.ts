import { useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDataStore } from '../lib/dataStore'
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

  useEffect(()=>{
    if (!loaded) fetchDocuments()
  },[loaded, fetchDocuments])

  const addRecord = useCallback(async (payload: DocumentPayload) => {
    await supabase.from('content').insert(payload)
    await fetchDocuments()
  }, [fetchDocuments])

  const updateMetadata = useCallback(async (item: DocumentItem, metadataPatch: Record<string, any>) => {
    const merged = { ...(item.metadata ?? {}), ...metadataPatch }
    await supabase.from('content').update({ metadata: merged }).eq('id', item.id)
    await fetchDocuments()
  }, [fetchDocuments])

  return { loading, items, addRecord, updateMetadata }
}

export default useContentLibrary
