import { readFileSync } from 'node:fs';
for (const line of readFileSync('.env.local','utf8').split('\n')) { const m=line.match(/^([A-Z0-9_]+)=(.*)$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2]; }
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
const cols = await sql`select column_name from information_schema.columns where table_name='users'`;
console.log('COLS', cols.map(c=>c.column_name).join(','));
const rows = await sql`select * from users limit 3`;
console.log('SAMPLE', JSON.stringify(rows.map(r=>({id:r.id,email:r.email,name:r.name,role:r.role}))));
