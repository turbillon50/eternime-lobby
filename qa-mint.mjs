import { webcrypto } from 'node:crypto'; if(!globalThis.crypto) globalThis.crypto=webcrypto;
import { readFileSync } from 'node:fs';
for (const line of readFileSync('.env.local','utf8').split('\n')) { const m=line.match(/^([A-Z0-9_]+)=(.*)$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2]; }
import { SignJWT } from 'jose';
const u={ id:'f470400e-5800-45c0-a23c-2be62e639e43', email:'turbillon50@gmail.com', name:'Luis' };
const secret=new TextEncoder().encode(process.env.JWT_SECRET);
const token=await new SignJWT({email:u.email,name:u.name,role:'user'}).setProtectedHeader({alg:'HS256'}).setSubject(u.id).setIssuedAt().setExpirationTime('30d').sign(secret);
console.log(token);
