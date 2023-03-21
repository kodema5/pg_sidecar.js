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

    console.log(`> connecting to ${cfg.host}:${cfg.port}/${cfg.database}`)
    sql = postgres(cfg)

    console.log(`> listening to ${argv.CHANNEL}`)
    listener = await sql.listen(argv.CHANNEL, work)
}

export let exec = async (str) => {
    return await sql.unsafe(str)
}
