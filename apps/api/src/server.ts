import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { encryptTransaction, decryptTransaction, TxSecureRecord } from '@repo/crypto';

dotenv.config();
const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: '*', 
});

const db = new Map<string, TxSecureRecord>();

const MASTER_KEY = process.env.MASTER_KEY_HEX || '';

if (MASTER_KEY.length !== 64) {
  console.error("❌ CRITICAL: MASTER_KEY_HEX must be 32 bytes (64 hex chars). Check Vercel Env Vars.");
}

fastify.get('/', async () => {
  return { status: 'ok', service: 'Mirfa Secure Transaction API' };
});

fastify.post<{ Body: { partyId: string, payload: any } }>('/tx/encrypt', async (request, reply) => {
  const { partyId, payload } = request.body;
  
  if (!partyId || !payload) {
    return reply.code(400).send({ error: 'Missing partyId or payload' });
  }

  try {
    const record = encryptTransaction(partyId, payload, MASTER_KEY);
    db.set(record.id, record); 
    return record;
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Encryption failed' });
  }
});

fastify.get<{ Params: { id: string } }>('/tx/:id', async (request, reply) => {
  const { id } = request.params;
  const record = db.get(id);
  
  if (!record) return reply.code(404).send({ error: 'Transaction not found' });
  
  return record;
});

fastify.post<{ Params: { id: string } }>('/tx/:id/decrypt', async (request, reply) => {
  const { id } = request.params;
  const record = db.get(id);
  
  if (!record) return reply.code(404).send({ error: 'Transaction not found' });

  try { 
    const decryptedPayload = decryptTransaction(record, MASTER_KEY);  
    return { ...record, decryptedPayload };
  } catch (err) {
    return reply.code(400).send({ error: 'Decryption failed: Integrity check failed' });
  }
});

export default async (req: any, res: any) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};

if (require.main === module) {
  const start = async () => {
    try {
      await fastify.listen({ port: 3001, host: '0.0.0.0' });
      console.log('Server running on http://localhost:3001');
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  start();
}