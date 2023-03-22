insert into tests.request (id, cmd, arg)
values
    ('test.load', 'load', '{"name":"test","path":"./tests/load.test.js"}');

create function tests.test_load()
    returns setof text
    language plpgsql
as $$
declare
    r tests.response;
begin
    select * into r from tests.response where id = 'test.load';
    return next ok(
        'test' = any ((
            select array_agg(a)
            from jsonb_array_elements_text(r.data->'commands') a
        )::text[]),
        'able to load library');
end;
$$;
