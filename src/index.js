import { argv, } from './argv.js'
import * as lib from './lib.js'
import * as pg from './pg.js'

await lib.init(argv)

let work = async (payload) => {
    let {
        id,     // payload id
        cmd,    // cmd to execute
        arg,    // argument to command
        call,   // sql callback of result
        ...p     // a regex of names
    } = JSON.parse(payload)

    if (p.for && !(new RegExp(p.for)).test(argv.NAME)) {
        return
    }

    let fn = lib.Commands[cmd]
    if (!fn) {
        console.log(`pg_sidecar.js ERR unrecognized cmd: ${cmd}`)
        return
    }

    let ts = Date.now()
    let data, error
    try {
        data = await (lib.Commands[cmd])(arg)
    } catch(e) {
        error = e.message
    }

    if (error) {
        console.log(`pg_sidecar.js [${cmd}] ERR ${error} for ${Date.now() - ts}ms`)
    } else {
        console.log(`pg_sidecar.js [${cmd}] OK ${call ? `to ${call}`: ''} for ${Date.now() - ts}ms`)
    }

    if (call) {
        try {
            let s = `select ${call}('${
                JSON.stringify({id, data, error})
            }'::jsonb) as x`
            await pg.exec(s)
        } catch(e) {
            console.log(`pg_sidecar.js [${cmd}] ERR fail to call ${call}(...): ${e.message}`)
        }
    }
}

await pg.init(argv, work)

