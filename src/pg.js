import { postgres, } from './deps.js'

let sql
let listener

export let init = async (argv, work) => {
    let cfg = {
        host: argv.PGHOST,
        port: argv.PGPORT,
        user: argv.PGUSER,
        pass: argv.PGPASSWORD,
        database: argv.PGDATABASE,

        max: argv.PGPOOLSIZE,
        idle_timeout: argv.PGIDLE_TIMEOUT,
        connect_timeout: argv.PGCONNECT_TIMEOUT,

        onnotice: (msg) => console.log(msg.severity, msg.message),
    }

    console.log(`pg_sidecar.js connects to ${cfg.host}:${cfg.port}/${cfg.database}`)
    sql = postgres(cfg)

    console.log(`pg_sidecar.js listens to ${argv.CHANNEL} channel`)

    listener = await sql.listen(
        argv.CHANNEL,
        work,
        () => {
            if (!argv.ON_LISTEN) return

            let f = async () => {
                try {
                    console.log('pg_sidecar.js [on_listen]', argv.ON_LISTEN)
                    let s = await exec(argv.ON_LISTEN)
                    if (s) console.log(s)
                } catch(e) {
                    console.log('pg_sidecar.js [on_listen] ERR', e.message)
                    setTimeout(f, argv.ON_LISTEN_POLL || 1000)
                }
            }
            f()
        })
}

export let exec = async (str) => {
    if (!str) return
    return await sql.unsafe(str)
}
