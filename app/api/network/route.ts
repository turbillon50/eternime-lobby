import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { listNetworkPeople, upsertNetworkPerson, addNetworkSkill } from "@/lib/data/network";

export const runtime="nodejs";
export async function GET(){try{const s=await requireUser();return NextResponse.json({people:await listNetworkPeople(s.sub)});}catch(e){if(e instanceof AuthError)return NextResponse.json({error:e.message},{status:e.status});return NextResponse.json({error:"Error interno"},{status:500});}}
export async function POST(req:Request){try{const s=await requireUser();const b=await req.json() as {name?:string;phone?:string;email?:string;company?:string;role?:string;relationship?:string;skills?:string[]};if(!b.name?.trim())return NextResponse.json({error:"Nombre requerido"},{status:400});const p=await upsertNetworkPerson({userId:s.sub,name:b.name.trim(),phone:b.phone,email:b.email,company:b.company,role:b.role,relationship:b.relationship,source:"manual",confidence:1});if(p&&Array.isArray(b.skills))for(const skill of b.skills.slice(0,20))await addNetworkSkill(s.sub,p.id,skill,"manual",1);return NextResponse.json({person:p},{status:201});}catch(e){if(e instanceof AuthError)return NextResponse.json({error:e.message},{status:e.status});return NextResponse.json({error:"Error interno"},{status:500});}}
