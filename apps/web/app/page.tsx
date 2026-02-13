"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [partyId, setPartyId] = useState("party_123");
  const [payload, setPayload] = useState(
    '{\n  "amount": 5000,\n  "currency": "AED"\n}'
  );
  const [record, setRecord] = useState<any | null>(null);
  const [decrypted, setDecrypted] = useState<any | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const handleEncrypt = async () => {
    setLoading(true);
    setError("");
    setRecord(null);
    setDecrypted(null);

    try {
      let parsedPayload: any;

      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        throw new Error("Invalid JSON format in payload");
      }

      const res = await fetch(`${API_URL}/tx/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId, payload: parsedPayload }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Encryption failed");
      }

      setRecord(data);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!record || !record.id) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/tx/${record.id}/decrypt`,
        { method: "POST" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Decryption failed");
      }

      setDecrypted(data?.decryptedPayload || null);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>

      
        <header className={styles.header}>
          <h1 className={styles.title}>🚀 Mirfa Secure Tx</h1>
          <p className={styles.subtitle}>
            End-to-end envelope encryption demo
          </p>
        </header>

  
        <section className={styles.formCard}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Party ID</label>
            <input
              className={styles.input}
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              placeholder="e.g. party_123"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>JSON Payload</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={6}
            />
          </div>

          <button
            className={styles.button}
            onClick={handleEncrypt}
            disabled={loading}
          >
            {loading ? "Processing..." : "🔒 Encrypt & Store"}
          </button>

          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}
        </section>

        {/* ===== RESULTS ===== */}
        {record !== null && (
          <section className={styles.resultCard}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Transaction ID</label>
              <input
                className={styles.input}
                value={record.id}
                readOnly
              />
            </div>

            <div className={styles.grid}>

              {/* Encrypted */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  🔐 Encrypted Store
                </h3>

                <div className={styles.codeBlock}>
                  {JSON.stringify(
                    {
                      payload_ct:
                        record?.payload_ct?.substring(0, 16) + "...",
                      dek_wrapped:
                        record?.dek_wrapped?.substring(0, 16) + "...",
                      alg: record?.alg,
                    },
                    null,
                    2
                  )}
                </div>

                <button
                  className={styles.decryptButton}
                  onClick={handleDecrypt}
                >
                  🔓 Decrypt Data
                </button>
              </div>

              {/* Decrypted */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  ✅ Decrypted View
                </h3>

                {decrypted !== null ? (
                  <pre className={styles.codeBlock}>
                    {JSON.stringify(decrypted, null, 2)}
                  </pre>
                ) : (
                  <div className={styles.placeholder}>
                    Waiting for decryption...
                  </div>
                )}
              </div>

            </div>
          </section>
        )}

      </div>
    </main>
  );
}
