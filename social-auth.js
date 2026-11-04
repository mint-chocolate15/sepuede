/* Public OAuth helpers. Provider client secrets belong only in Supabase. */
(function(root){
  const providers=['google'];
  function options(provider,redirectUrl){
    if(!providers.includes(provider))throw Error('Unsupported sign-in provider');
    const url=new URL(redirectUrl);if(url.protocol!=='https:')throw Error('Sign-in requires an HTTPS return URL');
    return {provider,options:{redirectTo:url.href,scopes:'openid email profile',queryParams:{prompt:'select_account'}}};
  }
  function sessionStorage(storage){return {getItem:key=>storage.getItem(key),removeItem:key=>storage.removeItem(key),setItem(key,value){let safe=value;try{const data=JSON.parse(value);for(const session of [data,data?.currentSession,data?.session])if(session&&typeof session==='object'){delete session.provider_token;delete session.provider_refresh_token}safe=JSON.stringify(data)}catch{}storage.setItem(key,safe)}}}
  async function availability(config,fetcher=fetch){const response=await fetcher(config.url+'/auth/v1/settings',{headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Sign-in options could not be checked');const data=await response.json();return Object.fromEntries(providers.map(p=>[p,data.external?.[p]===true]))}
  const api={providers,options,sessionStorage,availability};root.SepuedeSocial=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
