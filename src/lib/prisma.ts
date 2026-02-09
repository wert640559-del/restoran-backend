import dotenv from 'dotenv';
import path from 'path';

// Pastikan .env terbaca dengan benar
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// 1. Bersihkan URL (pg tidak kenal prisma+postgres://)
const originalUrl = process.env.DATABASE_URL || "";
const fixedUrl = originalUrl.replace('prisma+postgres://', 'postgresql://');

// 2. Konfigurasi Pool dengan deteksi SSL yang lebih ketat
const pool = new Pool({
  connectionString: fixedUrl,
  // Jika bukan localhost, paksa SSL dengan rejectUnauthorized false (untuk Supabase/Neon)
  ssl: fixedUrl.includes('localhost') || fixedUrl.includes('127.0.0.1') 
    ? false 
    : { rejectUnauthorized: false },
  max: 20,              
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 3. Log Error Pool agar kita tahu ALASAN pemutusan koneksi
pool.on('error', (err) => {
  console.error('❌ [Postgres Pool Error]:', err.message);
});

// 4. Inisialisasi Adapter
const adapter = new PrismaPg(pool);

// 5. Buat Client
export const prisma = new PrismaClient({ 
  // @ts-ignore - Mengatasi ketidaksinkronan tipe data di Prisma 7
  adapter: adapter,
  log: ['error', 'warn'] 
});

export default prisma;