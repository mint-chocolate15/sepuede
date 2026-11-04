// Import by appending independent records, remapping IDs and relationships.
(function(root){
  function mergeWorkspace(account,previous,makeId=()=>crypto.randomUUID()){
    const out=JSON.parse(JSON.stringify(account)),maps={};
    for(const k of ['projects','tasks','jobs','goals','logs','papers']){out[k]??=[];maps[k]=new Map();for(const row of previous[k]||[])maps[k].set(row.id,makeId())}
    const project=id=>maps.projects.get(id)||'',task=id=>maps.tasks.get(id)||'';
    for(const k of ['projects','tasks','jobs','goals','logs','papers'])for(const row of previous[k]||[]){const item=JSON.parse(JSON.stringify(row));item.id=maps[k].get(row.id);if('project'in item)item.project=project(item.project);if('task'in item)item.task=task(item.task);out[k].push(item)}
    out.dailyNotes??={};for(const [day,note] of Object.entries(previous.dailyNotes||{})){const target=out.dailyNotes[day]??={};for(const key of ['learning','work']){const text=note[key];if(text&&target[key]!==text)target[key]=target[key]?target[key]+'\n\nImported browser note:\n'+text:text}}
    return out;
  }
  root.mergeWorkspace=mergeWorkspace;if(typeof module!=='undefined')module.exports=mergeWorkspace;
})(typeof window!=='undefined'?window:globalThis);
