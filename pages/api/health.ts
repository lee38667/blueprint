import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabaseClient'

type Data = {
  status: string
  timestamp: string
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    // Simple query to keep Supabase active
    const { data, error } = await supabase
      .from('notes')
      .select('id')
      .limit(1)

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows, which is fine
      throw error
    }

    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Supabase connection active'
    })
  } catch (error: any) {
    console.error('Health check error:', error)
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message || 'Failed to ping Supabase'
    })
  }
}
