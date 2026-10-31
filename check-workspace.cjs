const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),store=new Map();
const el=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',style:{},dataset:{},listeners:{},elements:{namedItem:k=>el('#f-'+k)},addEventListener(n,f){this.listeners[n]=f},showModal(){this.open=true},close(){this.open=false;this.listeners.close?.()}});return elements.get(s)};
class MockFormData{constructor(form){this.form=form}*[Symbol.iterator](){yield* Object.entries(this.form.values||{})}}
const env={console,assert,crypto:require('node:crypto').webcrypto,structuredClone,Date,setTimeout,clearTimeout,FormData:MockFormData,window:{addEventListener(){}},document:{querySelector:el,addEventListener(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}};
const ctx=vm.createContext(env);
vm.runInContext(fs.readFileSync('workspace.js','utf8')+`
assert.equal(monday('2026-11-01'),'2026-10-26');
assert.equal(monday('2026-11-02'),'2026-11-02');
assert.equal(days('2026-10-30','2026-11-03'),4);
const old=structuredClone(seed);delete old.jobs;delete old.dailyNotes;old.logs.push({id:'old-log',text:'Keep my notes',date:'2026-10-29'});
db=migrate(old);assert.equal(db.logs[0].text,'Keep my notes');assert.equal(db.jobs.length,0);assert.notEqual(db.tasks[0].color,db.tasks[1].color);
editing={type:'job'};taskId='t2';commitForm({title:'A job',task:'t2',start:'2026-10-30',due:'2026-11-02',state:'Open',notes:''});
const j=db.jobs[0];assert.equal(events().filter(e=>e.kind==='job'&&onDay(e,'2026-11-01')).length,1);
assert.equal(events().find(e=>e.kind==='job').color,task('t2').color);
assert.ok(timeline([task('t2'),j]).includes('A job'));
assert.throws(()=>commitForm({title:'Bad dates',task:'t2',start:'2026-11-02',due:'2026-10-30',state:'Open'}),/Finish date/);
assert.equal(db.jobs.length,1);
editing={type:'job',id:j.id};commitForm({title:j.title,task:j.task,start:j.start,due:j.due,state:'Finished',completedOn:'2026-11-01'});
assert.equal(taskDone(task('t2')),true);assert.ok(!eventChip(events().find(e=>e.kind==='job'),'2026-10-30').includes('finished'));
assert.ok(eventChip(events().find(e=>e.kind==='job'),'2026-11-01').includes('finished'));
db.dailyNotes['2026-11-01']={learning:'A lasting insight'};save();
assert.equal(JSON.parse(localStorage.getItem('folio-v1')).dailyNotes['2026-11-01'].learning,'A lasting insight');
assert.equal(validBackup(db),true);assert.equal(validBackup({...db,jobs:{}}),false);
for(const p of ['Projects','Calendar','Weekly plan','Daily journal','Publications']){page=p;render();assert.ok(document.querySelector('#content').innerHTML.length>100)}
removeItem('task','t2');assert.equal(db.jobs.length,0);assert.equal(db.logs[0].text,'Keep my notes');
console.log('PASS: migration, date boundaries, linked schedules, completion history, learnings, rendering, backup validation, and cascade deletion');
const originalSet=localStorage.setItem;localStorage.setItem=()=>{throw Error('blocked')};
assert.equal(save(),false);assert.equal(document.querySelector('#saved').textContent,'Not saved');
editing={type:'project'};document.querySelector('#modal').open=true;document.querySelector('#form').values={name:'Must not disappear',description:'My unsaved work',status:'Planning',start:'',due:''};
const countBefore=db.projects.length;document.querySelector('#form').listeners.submit({preventDefault(){},target:document.querySelector('#form')});
assert.equal(db.projects.length,countBefore);assert.equal(document.querySelector('#modal').open,true);assert.equal(document.querySelector('#form').values.name,'Must not disappear');
localStorage.setItem=originalSet;
editing={type:'project'};commitForm({name:'My selected project',description:'Keep me selected',status:'Planning',start:'',due:''});
page='Projects';taskId=null;save();rememberView();
document.querySelector('#form').values={name:'An unfinished draft',description:'Text before refresh'};editing={type:'project'};saveDraft();
console.log('PASS: storage failure retains form without false success or duplicate records');
`,ctx);
const reloaded=vm.createContext({...env});
vm.runInContext(fs.readFileSync('workspace.js','utf8')+`
assert.equal(db.projects.find(p=>p.id===projectId).name,'My selected project');
assert.equal(document.querySelector('#modal').open,true);assert.equal(document.querySelector('#f-name').value,'An unfinished draft');
assert.equal(document.querySelector('#f-description').value,'Text before refresh');
console.log('PASS: refresh keeps selected project, records, and unfinished form draft');
`,reloaded);

