import CryptoJS from 'crypto-js'

export function encryptText(plaintext: string, passphrase: string) {
  if (!passphrase) throw new Error('Passphrase required for encryption')
  return CryptoJS.AES.encrypt(plaintext, passphrase).toString()
}

export function decryptText(ciphertext: string, passphrase: string) {
  if (!passphrase) throw new Error('Passphrase required for decryption')
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase)
    const originalText = bytes.toString(CryptoJS.enc.Utf8)
    if (!originalText) throw new Error('Invalid passphrase')
    return originalText
  } catch (error) {
    throw new Error('Failed to decrypt content. Check your passphrase.')
  }
}

export function hasEncryptionFlag(note: any) {
  return Boolean(note?.attachments?.encrypted)
}
