import { NextApiRequest, NextApiResponse } from 'next'
import { authGuard, getServiceClient } from '@/lib/apiAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await authGuard(req, res, { name: 'storage-setup' })
  if (!user) return

  const supabase = getServiceClient()

  try {
    const { bucketName = 'documents' } = req.body

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return res.status(500).json({ error: 'Failed to check existing buckets' })
    }

    const bucketExists = buckets?.some(b => b.name === bucketName)

    if (bucketExists) {
      return res.status(200).json({ 
        message: 'Bucket already exists',
        bucket: bucketName,
        created: false 
      })
    }

    // Create new bucket
    const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
      public: false, // Private bucket for personal system
      fileSizeLimit: 10485760, // 10MB max file size
      allowedMimeTypes: ['application/pdf', 'text/*', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.*']
    })

    if (createError) {
      console.error('Error creating bucket:', createError)
      return res.status(500).json({ error: createError.message })
    }

    return res.status(201).json({
      message: 'Bucket created successfully',
      bucket: bucketName,
      created: true
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return res.status(500).json({ error: error.message || 'Setup failed' })
  }
}
