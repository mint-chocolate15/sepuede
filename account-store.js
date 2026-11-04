/* Account-scoped persistence. Uses only an authenticated client and public key. */
(function(root){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  class AccountStore{
    constructor(client,storage,notify=()=>{}){this.client=client;this.storage=storage;this.notify=notify;this.user=null;this.revision=0;this.dirty=false;this.conflict=false;this.generation=0;this.document=null;this.pending=null;this.saving=null;this.offline=false}
    key(){if(!this.user)throw Error('Sign in required');return 'sepuede-account:'+this.user.id}
    cache(){this.storage.setItem(this.key(),JSON.stringify({data:this.document,revision:this.revision,dirty:this.dirty,conflict:this.conflict}))}
    async load(user,makeEmpty){const g=++this.generation;this.user=user;this.revision=0;this.dirty=false;this.conflict=false;this.pending=null;this.saving=null;this.offline=false;let cached;try{cached=JSON.parse(this.storage.getItem(this.key()))}catch{}
      const {data:remote,error}=await this.client.from('sepuede_workspaces').select('data,revision').eq('user_id',user.id).maybeSingle();
      if(g!==this.generation)throw Error('Account changed');
      if(error){if(!cached?.data)throw error;this.document=clone(cached.data);this.revision=cached.revision;this.dirty=!!cached.dirty;this.conflict=!!cached.conflict;this.offline=true;this.notify('offline');return clone(this.document)}
      this.revision=remote?.revision||0;this.remoteExists=!!remote;
      if(cached?.dirty){this.document=clone(cached.data);this.dirty=true;this.conflict=!!cached.conflict||cached.revision!==this.revision;if(this.conflict)this.notify('conflict');else{this.pending=clone(this.document);this.notify('pending')}}
      else{this.document=clone(remote?.data||makeEmpty());this.notify('loaded')}
      this.cache();return clone(this.document)
    }
    write(data){if(!this.user)throw Error('Sign in required');this.document=clone(data);this.dirty=true;this.cache();this.pending=clone(data);this.notify(this.conflict?'conflict':'pending');if(!this.conflict)this.flush();return true}
    async flush(){if(this.saving)return this.saving;if(!this.user||!this.pending||this.conflict)return false;const g=this.generation,owner=this.user.id;
      this.saving=(async()=>{while(this.pending&&!this.conflict&&g===this.generation){const payload=this.pending;this.pending=null;const sent=JSON.stringify(payload);this.notify('syncing');let result;
        try{result=await this.client.rpc('sepuede_save_workspace',{expected_revision:this.revision,payload})}catch(error){result={error}}
        if(g!==this.generation||this.user?.id!==owner)return false;
        if(result.error){this.pending=this.pending||payload;this.dirty=true;this.conflict=result.error.code==='40001';this.offline=!this.conflict;this.cache();this.notify(this.conflict?'conflict':'offline');return false}
        this.revision=Number(result.data);this.remoteExists=true;this.offline=false;this.dirty=JSON.stringify(this.document)!==sent;if(this.dirty&&!this.pending)this.pending=clone(this.document);this.cache();this.notify(this.dirty?'pending':'synced');
      }return !this.dirty})().catch(()=>{this.dirty=true;this.offline=true;this.notify('offline');return false}).finally(()=>{if(g===this.generation)this.saving=null});return this.saving
    }
    async retry(){if(!this.user)return false;const g=this.generation;const {data:remote,error}=await this.client.from('sepuede_workspaces').select('data,revision').eq('user_id',this.user.id).maybeSingle();if(g!==this.generation)return false;if(error){this.notify('offline');return false}if((remote?.revision||0)!==this.revision&&this.dirty){this.conflict=true;this.cache();this.notify('conflict');return false}if(this.dirty){this.pending=clone(this.document);return this.flush()}return true}
    async useRemote(makeEmpty){if(!this.user)throw Error('Sign in required');const g=this.generation;const {data:remote,error}=await this.client.from('sepuede_workspaces').select('data,revision').eq('user_id',this.user.id).maybeSingle();if(error)throw error;if(g!==this.generation)throw Error('Account changed');this.document=clone(remote?.data||makeEmpty());this.revision=remote?.revision||0;this.pending=null;this.dirty=false;this.conflict=false;this.offline=false;this.remoteExists=!!remote;this.cache();this.notify('loaded');return clone(this.document)}
    forget(){if(this.user){try{this.storage.removeItem(this.key());for(const suffix of [':view',':draft'])this.storage.removeItem(this.key()+suffix)}catch{}}this.generation++;this.user=null;this.document=null;this.pending=null;this.saving=null;this.dirty=false;this.conflict=false}
  }
  root.AccountStore=AccountStore;if(typeof module!=='undefined')module.exports=AccountStore;
})(typeof window!=='undefined'?window:globalThis);
