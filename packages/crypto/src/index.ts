import crypto from 'node:crypto';

export type TxSecureRecord = {
  id: string;
  partyId: string;
  createdAt: string;
  payload_nonce: string; // Hex
  payload_ct: string;    // Hex ciphertext
  payload_tag: string;   // Hex auth tag
  dek_wrap_nonce: string; 
  dek_wrapped: string;   
  dek_wrap_tag: string;  
  alg: "AES-256-GCM";
  mk_version: 1;
};

const ALGORITHM = 'aes-256-gcm';


const toHex = (buf: Buffer) => buf.toString('hex');
const fromHex = (hex: string) => Buffer.from(hex, 'hex');

export function encryptTransaction(
  partyId: string, 
  payload: any, 
  masterKeyHex: string
): TxSecureRecord {

  if (!masterKeyHex || masterKeyHex.length !== 64) {
    throw new Error("Invalid Master Key: Must be 32 bytes (64 hex chars)");
  }
  const masterKey = fromHex(masterKeyHex);
  
  // 1. Generate a random DEK (32 bytes)
  const dek = crypto.randomBytes(32);

  const payloadNonce = crypto.randomBytes(12);
  const payloadCipher = crypto.createCipheriv(ALGORITHM, dek, payloadNonce);
  
  let payloadEncrypted = payloadCipher.update(JSON.stringify(payload), 'utf8');
  payloadEncrypted = Buffer.concat([payloadEncrypted, payloadCipher.final()]);
  const payloadTag = payloadCipher.getAuthTag();

  // 2. Wrap (Encrypt) the DEK using Master Key
  const dekNonce = crypto.randomBytes(12);
  const dekCipher = crypto.createCipheriv(ALGORITHM, masterKey, dekNonce);
  
  let dekWrapped = dekCipher.update(dek);
  dekWrapped = Buffer.concat([dekWrapped, dekCipher.final()]);
  const dekTag = dekCipher.getAuthTag();


  return {
    id: crypto.randomUUID(),
    partyId,
    createdAt: new Date().toISOString(),
    payload_nonce: toHex(payloadNonce),
    payload_ct: toHex(payloadEncrypted),
    payload_tag: toHex(payloadTag),
    dek_wrap_nonce: toHex(dekNonce),
    dek_wrapped: toHex(dekWrapped),
    dek_wrap_tag: toHex(dekTag),
    alg: "AES-256-GCM",
    mk_version: 1,
  };
}

export function decryptTransaction(record: TxSecureRecord, masterKeyHex: string): any {
  const masterKey = fromHex(masterKeyHex);

  try {
    // 3. Unwrap (Decrypt) the DEK first
    const dekDecipher = crypto.createDecipheriv(ALGORITHM, masterKey, fromHex(record.dek_wrap_nonce));
    dekDecipher.setAuthTag(fromHex(record.dek_wrap_tag));
    
    let dek = dekDecipher.update(fromHex(record.dek_wrapped));
    dek = Buffer.concat([dek, dekDecipher.final()]);

    // 4. Decrypt the Payload using the recovered DEK
    const payloadDecipher = crypto.createDecipheriv(ALGORITHM, dek, fromHex(record.payload_nonce));
    payloadDecipher.setAuthTag(fromHex(record.payload_tag));
    
    let decrypted = payloadDecipher.update(fromHex(record.payload_ct));
    decrypted = Buffer.concat([decrypted, payloadDecipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
  
    throw new Error("Decryption failed: Integrity check failed (Tampered data or wrong key)");
  }
}