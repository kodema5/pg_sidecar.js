import { argv, } from './argv.js'
import * as lib from './lib.js'
import * as pg from './pg.js'

console.log(`PG_SIDECAR`)

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
        console.log(`> ERR unrecognized cmd: ${cmd}`)
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
        console.log(`[${cmd}] ERR ${error} for ${Date.now() - ts}ms`)
    } else {
        console.log(`[${cmd}] OK to ${call ? `${call}`: ''} for ${Date.now() - ts}ms`)
    }

    if (call) {
        try {
            let s = `select ${call}('${
                JSON.stringify({id, data, error})
            }'::jsonb) as x`
            await pg.exec(s)
        } catch(e) {
            console.log(`[${cmd}] ERR fail to call ${call}(...): ${e.message}`)
        }
    }
}

await pg.init(argv, work)

