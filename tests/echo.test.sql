insert into tests.request (id, cmd, arg)
values
    ('test.echo', 'echo', jsonb_build_object('a',123));

create function tests.test_echo()
returns setof text
language plpgsql
as $$
declare
    r tests.request;
begin
    select * into r from tests.request where id = 'test.echo';
    return next ok(r.arg = r.data, 'able to echo');
end;
$$;

