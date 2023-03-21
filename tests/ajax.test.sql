insert into tests.request (id, cmd, arg)
values (
    'test.ajax',
    'ajax',
    jsonb_build_object(
        'method', 'GET',
        'url', 'https://httpbin.org/get?a=1',
        'headers', jsonb_build_object('auth', 'abc')
    ));


create function tests.test_ajax()
returns setof text
language plpgsql
as $$
declare
    r tests.request;
begin
    select * into r from tests.request where id = 'test.ajax';
    return next ok(r.data->'headers'->>'Host' = 'httpbin.org', 'able to ajax');
end;
$$;

