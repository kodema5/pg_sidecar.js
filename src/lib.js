import { fs, path } from './deps.js'
import { argv } from './argv.js'
import * as lib from './lib/index.js'

let getPaths = async function* (paths=[]) {
    for (let p of paths) {
        try {
            let s = await Deno.stat(p)
            if (s.isFile) {
                yield path.resolve(p)
                continue
            }
        } catch(e) {
            console.log(`pg_sidecar.js unable to find ${p}.`)
            continue
        }

        for await (let f of fs.walk(p, {
                maxDepth:1,
                includeDirs: false})
        ) {
            yield path.resolve(f.path)
        }
    }
}

export let Commands = Object.assign({
    info: () => {
        return {
            name: argv.NAME,
            commands: Object.keys(Commands),
        }
    }
}, lib)

let Stats = {}

let loadLib = async (p) => {
    console.log(`pg_sidecar.js loads ${p}`)

    let s = await Deno.stat(p)
    if (Stats[p]?.mtime >= s.mtime) {
        return
    }

    let n = path.basename(p).split('.')[0]
    try {
        let m = await import('file://' + p)
        let fn = m[n] || m['default']
        if (!fn) {
            throw new Error(`unable to find handler`)
        }

        Commands[n] = fn
        Stats[p] = s
    } catch(e) {
        console.log(`pg_sidecar.js ERR fail to load ${p}: ${e.message}`)
    }
}

let removeLib = (p) => {
    console.log(`pg_sidecar.js removes ${p}`)
    delete Stats[p]
    let n = path.basename(p).split('.')[0]
    delete Commands[n]
}

let watchPath = async (ps) => {
    console.log(`pg_sidecar.js watches ${ps}`)
    for await (let e of Deno.watchFs(ps)) {
        switch(e.kind) {
            case 'create':
            case 'modify':
                await loadLib(e.paths[0])
                break
            case 'remove':
                await removeLib(e.paths[0])
                break
        }
    }
}

export let init = async () => {

    let { LIB, WATCH } = argv
    let paths = [...LIB]
    for await (let p of getPaths(paths)) {
        await loadLib(p)
    }

    if (WATCH) {
        for (let p of paths) {
            watchPath(p)
        }
    }
}
