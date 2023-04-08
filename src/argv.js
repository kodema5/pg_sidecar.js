import { config, parse } from './deps.js'

let ArgFlags = {
    l: 'LIB',
    w: 'WATCH',
    c: 'CHANNEL',
}

export let argv = Object.assign(
    // application default values
    //
    {
        PGHOST: 'localhost',    // pg connections
        PGPORT: 5432,
        PGDATABASE: 'web',
        PGUSER: 'web',
        PGPASSWORD: 'rei',
        PGPOOLSIZE: 10,
        PGIDLE_TIMEOUT: 0,      // in s
        PGCONNECT_TIMEOUT: 30,  // in s

        // NAME: new URL('', import.meta.url).pathname + '-' + Deno.pid,
        NAME: Deno.hostname() + ':' + Deno.pid,

        LIB: [], // extra libraries
        CHANNEL: 'pg_sidecar', // to listen to

        ON_LISTEN: null, // sql to be executed once listen for initialization
        ON_LISTEN_POLL: 1000, // 1 sec retry to initialize
    },

    // read from .env / .env.defaults
    //
    config(),

    // command line arguments
    //
    Object.entries(parse(Deno.args))
        .map( ([k,v]) => {
            let n = ArgFlags[k]
                || k.toUpperCase().replaceAll('-','_')
            return { [n]: v}
        })
        .reduce((x,a) => {
            return Object.assign(x,a)
        }, {})
)
