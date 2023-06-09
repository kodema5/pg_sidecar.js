insert into tests.request (id, cmd, arg)
values
    ('test.info', 'info', null);

create function tests.test_info()
returns setof text
language plpgsql
as $$
declare
    r tests.response;
begin
    select * into r from tests.response where id = 'test.info';
    return next ok(r.data->>'name' is not null, 'able get info of sidecar');
end;
$$;

