import { getNsmBalance } from '@/lib/shielded-preview/nsm/provider';
export const dynamic = 'force-dynamic';
export async function GET(){
 if(process.env.SHIELDED_LABS_PREVIEW!=='1')return new Response('Not found',{status:404});
 return Response.json(await getNsmBalance(),{headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
}
