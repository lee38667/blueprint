import CryptoJS from 'crypto-js'

/**
 * Server-side symmetric encryption for stored secrets (e.g. Google OAuth
 * tokens). Fails closed: if ENCRYPTION_KEY is missing or weak, encryption and
 * decryption throw rather than silently falling back to a known key.
 */
function getKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 16) {
    throw new Error(
      'ENCRYPTION_KEY is not configured. Set it to a strong random value (>= 16 chars).'
    )
  }
  return key
}

export function encryptToken(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, getKey()).toString()
}

export function decryptToken(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getKey())
  const out = bytes.toString(CryptoJS.enc.Utf8)
  if (!out) throw new Error('Failed to decrypt stored token')
  return out
}
