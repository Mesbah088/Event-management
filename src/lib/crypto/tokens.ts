import crypto from 'crypto';
import QRCode from 'qrcode';

const ENCRYPTION_SECRET = process.env.SESSION_SECRET || 'university_event_default_secure_secret_fallback_key_2026_at_least_32_chars';

/**
 * Generate a cryptographically secure 32-byte random token.
 * Yields 256 bits of high entropy, making brute-force collision virtually impossible.
 */
export function generateTicketToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Compute the SHA-256 hex digest of a ticket token.
 * Only this hash is queried for atomic check-in lookups.
 */
export function hashTicketToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Encrypt the raw token with AES-256-GCM using the server's private key.
 * This ensures the database never stores plaintext tokens, while allowing
 * durable and idempotent email retries.
 */
export function encryptTicketToken(token: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt the token using AES-256-GCM.
 */
export function decryptTicketToken(encryptedString: string): string | null {
  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, dataHex] = parts;
    const key = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

/**
 * Generate a unique human-friendly ticket reference code.
 * Format: UE-<YEAR>-<6 ALPHANUMERIC CHARS>
 */
export function generateTicketReference(prefix: string = 'UE'): string {
  const year = new Date().getFullYear();
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `${prefix}-${year}-${randomChars}`;
}

/**
 * Generate a Data URL PNG representation of the QR code.
 */
export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: {
      dark: '#1e1b4b', // Deep indigo brand color
      light: '#ffffff',
    },
  });
}

/**
 * Generate an SVG string representation of the QR code.
 */
export async function generateQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff',
    },
  });
}
