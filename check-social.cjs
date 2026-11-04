const assert=require('node:assert/strict'),social=require('./social-auth.js');
(async()=>{
  const redirect='https://mint-chocolate15.github.io/sepuede/';
  const g=social.options('google',redirect);
  assert.equal(g.options.redirectTo,redirect);
  assert.throws(()=>social.options('github',redirect),/Unsupported/);assert.ok(!g.options.scopes.split(' ').includes('https://mail.google.com/'));assert.ok(!g.options.scopes.includes('/auth/drive'));
  assert.deepEqual(g.options.scopes.split(' ').sort(),['email','openid','profile']);
  assert.equal(g.options.queryParams.access_type,undefined,'Do not request offline Google API access');
  assert.throws(()=>social.options('unknown',redirect),/Unsupported/);assert.throws(()=>social.options('google','http://example.com'),/HTTPS/);
  const map=new Map(),storage=social.sessionStorage({getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
  storage.setItem('auth',JSON.stringify({access_token:'supabase-user-token',refresh_token:'supabase-refresh-token',provider_token:'private-provider-token',provider_refresh_token:'private-provider-refresh',user:{id:'a'}}));
  const saved=JSON.parse(storage.getItem('auth'));assert.equal(saved.provider_token,undefined);assert.equal(saved.provider_refresh_token,undefined);assert.equal(saved.access_token,'supabase-user-token');assert.equal(saved.refresh_token,'supabase-refresh-token');assert.equal(saved.user.id,'a');
  storage.setItem('code-verifier','plain-PKCE-verifier');assert.equal(storage.getItem('code-verifier'),'plain-PKCE-verifier');storage.removeItem('code-verifier');assert.equal(storage.getItem('code-verifier'),undefined);
  let request;const available=await social.availability({url:'https://example.supabase.co',publishableKey:'sb_publishable_test'},async(url,opts)=>{request={url,opts};return {ok:true,json:async()=>({external:{google:true,github:false,other:true}})}});
  assert.deepEqual(available,{google:true});assert.equal(request.opts.headers.apikey,'sb_publishable_test');assert.equal(request.opts.headers.Authorization,undefined);
  await assert.rejects(social.availability({url:'https://example.supabase.co',publishableKey:'sb_publishable_test'},async()=>({ok:false})),/could not be checked/);
  console.log('PASS: provider allowlist, minimal OAuth permissions, HTTPS return, provider-token removal, session preservation, and actual-enabled-provider discovery');
})().catch(e=>{console.error(e);process.exitCode=1});
