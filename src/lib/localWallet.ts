// ─── Local Wallet: Non-custodial in-browser keypair ──────
// Keys are encrypted with AES-256-GCM and stored in localStorage.
// The password is NEVER stored. Losing it = losing access.

const STORAGE_KEY = 'ga_vault_wallet';

interface StoredWallet {
  address: string;
  encryptedKey: string; // base64
  iv: string;           // base64
  salt: string;         // base64
}

// ─── Helpers ─────────────────────────────────────────────

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bufToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ─── Derive AES key from password ────────────────────────

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password) as unknown as ArrayBuffer, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ─── Generate Wallet ─────────────────────────────────────

export async function generateWallet(): Promise<{ privateKey: string; address: string }> {
  // Generate 32 random bytes as private key
  const privBytes = crypto.getRandomValues(new Uint8Array(32));
  const privateKey = '0x' + bufToHex(privBytes.buffer as ArrayBuffer);

  const hash = await crypto.subtle.digest('SHA-256', privBytes.buffer as ArrayBuffer);
  const address = '0x' + bufToHex(hash).slice(-40);

  return { privateKey, address };
}

// ─── Encrypt Private Key ─────────────────────────────────

export async function encryptKey(privateKey: string, password: string): Promise<{ encrypted: string; iv: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, enc.encode(privateKey) as unknown as ArrayBuffer);

  return {
    encrypted: bufToBase64(ciphertext),
    iv: bufToBase64(iv.buffer as ArrayBuffer),
    salt: bufToBase64(salt.buffer as ArrayBuffer),
  };
}

// ─── Decrypt Private Key ─────────────────────────────────

export async function decryptKey(encrypted: string, iv: string, salt: string, password: string): Promise<string> {
  const key = await deriveKey(password, base64ToBuf(salt));
  const ivBuf = base64ToBuf(iv);
  const encBuf = base64ToBuf(encrypted);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuf.buffer as ArrayBuffer },
    key,
    encBuf.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(plaintext);
}

// ─── Sign SIWE Message ───────────────────────────────────
// EIP-191 personal_sign: keccak256("\x19Ethereum Signed Message:\n" + len + msg)
// We use SHA-256 as a stand-in since keccak isn't in Web Crypto natively.
// For full EIP-191 compat in production, use a library like ethers.js.

export async function signMessage(message: string, privateKey: string): Promise<string> {
  const enc = new TextEncoder();
  const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
  const prefixedMsg = enc.encode(prefix + message);

  // Hash the prefixed message
  const msgHash = await crypto.subtle.digest('SHA-256', prefixedMsg);

  // Sign using HMAC-SHA256 with private key as the key (deterministic signature)
  const keyBytes = hexToBuf(privateKey.replace('0x', ''));
  const hmacKey = await crypto.subtle.importKey('raw', keyBytes.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', hmacKey, msgHash);

  return '0x' + bufToHex(sig);
}

// ─── LocalStorage Operations ─────────────────────────────

export function storeWallet(wallet: StoredWallet): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
}

export function loadWallet(): StoredWallet | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredWallet;
  } catch {
    return null;
  }
}

export function clearWallet(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasStoredWallet(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}
