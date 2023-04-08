-- deno run -A --watch mod.js --on-listen="select tests.on_listen()"
-- web-dev test tests/index.sql -w

create extension if not exists "uuid-ossp" schema public;

create function tests.on_listen()
    returns text
    language plpgsql
as $$
begin
    return 'hello pg_sidecar';
end;
$$;


create table tests.request (
    id text
        primary key
        default md5(uuid_generate_v4()::text),
    "for" text
        default '.', -- for any. use ^aki:pid$ for exact
    cmd text
        not null,
    arg jsonb,
    call text
        default 'tests.response',
    request_tz
        timestamp with time zone
        default now()
);

create table tests.response (
    id text  not null,
    "from" text not null,
    data jsonb,
    error jsonb,
    response_tz
        timestamp with time zone
        default now()
);


create function tests.response (p jsonb)
    returns void
    language plpgsql
as $$
begin
    insert into tests.response(
        id, "from", data, error
    ) values (
        p->>'id',
        p->>'from',
        p->'data',
        p->'error'
    );
end;
$$;

create function tests.auto_send()
    returns trigger
    language plpgsql
as $$
begin
    perform pg_notify(
        'pg_sidecar',
        jsonb_build_object(
            'id', new.id,
            'for', new."for",
            'cmd', new.cmd,
            'arg', new.arg,
            'call', new.call
        )::text
    );
    return new;
end;
$$;

create trigger tests_request_auto_send
    after insert
    on tests.request
    for each row
    execute function tests.auto_send();

\ir ajax.test.sql
\ir echo.test.sql
\ir info.test.sql
\ir load.test.sql

-- wait until everything is done
--
do $$
begin
    raise warning 'wait... 1 of 2';
    perform pg_sleep(1);
    raise warning 'wait... 2 of 2';
    perform pg_sleep(1);
end;
$$;

-- select * from tests.request;
