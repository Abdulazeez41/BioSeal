import crypto from "crypto";

// 32-byte master key derived or loaded from env
const MASTER_KEY = Buffer.from(
  (process.env.STORAGE_MASTER_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef").slice(0, 64),
  "hex"
);

// In-memory encrypted object store buffer (or cloud bucket adapter)
const encryptedObjectStore = new Map<string, {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
  hash: string;
  mimeType: string;
  createdAt: number;
  retentionDays: number;
  deleted: boolean;
}>();

export class EncryptedStorageService {
  /**
   * Computes deterministic SHA-256 hash of an image buffer
   */
  public static computeImageHash(buffer: Buffer): string {
    return "0x" + crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Encrypts and stores an image with AES-256-GCM
   */
  public static async storeEncryptedImage(
    storageKey: string,
    imageBuffer: Buffer,
    mimeType = "image/jpeg",
    retentionDays = 30
  ): Promise<{ storageKey: string; hash: string }> {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY, iv);
    const ciphertext = Buffer.concat([cipher.update(imageBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const hash = this.computeImageHash(imageBuffer);

    encryptedObjectStore.set(storageKey, {
      ciphertext,
      iv,
      authTag,
      hash,
      mimeType,
      createdAt: Date.now(),
      retentionDays,
      deleted: false,
    });

    return { storageKey, hash };
  }

  /**
   * Retrieves and decrypts the image buffer if not deleted or expired
   */
  public static async getDecryptedImage(storageKey: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const entry = encryptedObjectStore.get(storageKey);
    if (!entry || entry.deleted) {
      return null;
    }

    // Check expiration
    const ageDays = (Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24);
    if (ageDays > entry.retentionDays) {
      entry.deleted = true;
      return null;
    }

    const decipher = crypto.createDecipheriv("aes-256-gcm", MASTER_KEY, entry.iv);
    decipher.setAuthTag(entry.authTag);
    const decrypted = Buffer.concat([decipher.update(entry.ciphertext), decipher.final()]);

    return { buffer: decrypted, mimeType: entry.mimeType };
  }

  /**
   * User-initiated deletion of verification media
   */
  public static async deleteVerificationMedia(storageKey: string): Promise<boolean> {
    const entry = encryptedObjectStore.get(storageKey);
    if (!entry) return false;
    entry.deleted = true;
    entry.ciphertext = Buffer.alloc(0);
    return true;
  }

  /**
   * Clean up expired media items
   */
  public static purgeExpiredMedia(): number {
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of Array.from(encryptedObjectStore.entries())) {
      const ageDays = (now - entry.createdAt) / (1000 * 60 * 60 * 24);
      if (ageDays > entry.retentionDays && !entry.deleted) {
        entry.deleted = true;
        entry.ciphertext = Buffer.alloc(0);
        count++;
      }
    }
    return count;
  }
}
