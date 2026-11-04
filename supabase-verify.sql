-- Security regression check. Creates only temporary fixtures and rolls them back.
-- Do not remove BEGIN/ROLLBACK. No real users or their records are changed.
begin;
insert into auth.users(id,aud,role,email) values
 ('f2e1b136-4cb2-4f91-bc9e-a89fe185b200','authenticated','authenticated','sepuede-rls-a@test.invalid'),
 ('f2e1b136-4cb2-4f91-bc9e-a89fe185b201','authenticated','authenticated','sepuede-rls-b@test.invalid');
insert into public.sepuede_workspaces(user_id,data,revision) values
 ('f2e1b136-4cb2-4f91-bc9e-a89fe185b200','{"projects":[],"tasks":[],"jobs":[],"goals":[],"logs":[],"papers":[],"dailyNotes":{}}',1),
 ('f2e1b136-4cb2-4f91-bc9e-a89fe185b201','{"projects":[],"tasks":[],"jobs":[],"goals":[],"logs":[],"papers":[],"dailyNotes":{}}',1);
do $$ begin
 if has_table_privilege('anon','public.sepuede_workspaces','SELECT') then raise exception 'Anonymous read must be denied'; end if;
 if has_function_privilege('anon','public.sepuede_save_workspace(bigint,jsonb)','EXECUTE') then raise exception 'Anonymous writes must be denied'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','f2e1b136-4cb2-4f91-bc9e-a89fe185b200',true);
do $$ declare n integer; r bigint; begin
 select count(*) into n from public.sepuede_workspaces;
 if n<>1 then raise exception 'RLS must expose exactly the current user row'; end if;
 update public.sepuede_workspaces set revision=99 where user_id='f2e1b136-4cb2-4f91-bc9e-a89fe185b201';
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Another user row must not be editable'; end if;
 begin
   update public.sepuede_workspaces set user_id='f2e1b136-4cb2-4f91-bc9e-a89fe185b201';
   raise exception 'Changing ownership must be denied';
 exception when insufficient_privilege then null;
 end;
 select public.sepuede_save_workspace(1,'{"projects":[],"tasks":[],"jobs":[],"goals":[],"logs":[],"papers":[],"dailyNotes":{}}') into r;
 if r<>2 then raise exception 'Own account save must increment revision'; end if;
 begin
   perform public.sepuede_save_workspace(1,'{"projects":[],"tasks":[],"jobs":[],"goals":[],"logs":[],"papers":[],"dailyNotes":{}}');
   raise exception 'Stale device write must be rejected';
 exception when serialization_failure then null;
 end;
end $$;
reset role;
do $$ begin
 if (select revision from public.sepuede_workspaces where user_id='f2e1b136-4cb2-4f91-bc9e-a89fe185b201')<>1 then raise exception 'Other account was changed'; end if;
end $$;
rollback;
select 'PASS: anonymous access blocked, user isolation enforced, own writes allowed, stale writes rejected; fixtures rolled back' as result;
