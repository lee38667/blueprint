import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Scripture API - Fetches Bible verses using ESV API
 * 
 * Usage: /api/scripture/search?reference=John 3:16
 * 
 * NOTE: You need to set ESV_API_KEY in your .env file
 * Sign up at: https://api.esv.org/
 */

const ESV_API_URL = 'https://api.esv.org/v3/passage/text/';

interface ScriptureResponse {
  passages?: string[];
  canonical?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScriptureResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reference } = req.query;

  if (!reference || typeof reference !== 'string') {
    return res.status(400).json({ error: 'Reference query parameter is required' });
  }

  const apiKey = process.env.ESV_API_KEY;

  if (!apiKey) {
    console.error('ESV_API_KEY not configured');
    return res.status(500).json({
      error: 'Scripture API not configured. Please add ESV_API_KEY to your environment variables.',
    });
  }

  try {
    const params = new URLSearchParams({
      q: reference,
      'include-headings': 'false',
      'include-footnotes': 'false',
      'include-verse-numbers': 'true',
      'include-short-copyright': 'false',
      'include-passage-references': 'true',
    });

    const response = await fetch(`${ESV_API_URL}?${params.toString()}`, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Verse not found. Please check your reference.' });
      }
      throw new Error(`ESV API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.passages || data.passages.length === 0) {
      return res.status(404).json({ error: 'No passages found for that reference.' });
    }

    return res.status(200).json({
      passages: data.passages,
      canonical: data.canonical || reference,
    });
  } catch (error: any) {
    console.error('Scripture API error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch scripture',
    });
  }
}
