import { fs, path } from './deps.js'

let getPaths = async function* (paths=[]) {
    for (let p of paths) {
        try {
            let s = await Deno.stat(p)
            if (s.isFile) {
                yield path.resolve(p)
                continue
            }
        } catch(e) {
            console.log(`> unable to find ${p}.`)
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

export let Commands = {}

let Stats = {}

let loadLib = async (p) => {
    console.log(`> loading lib ${p}`)

    let s = await Deno.stat(p)
    if (Stats[p]?.mtime >= s.mtime) {
        console.log(`> ${p}'s skipped.`)
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
        console.log(`> fail to load ${p}: ${e.message}`)
    }
}

let removeLib = (p) => {
    console.log(`> removing lib ${p}`)
    delete Stats[p]
    let n = path.basename(p).split('.')[0]
    delete Commands[n]
}

let watchPath = async (ps) => {
    console.log(`> watching ${ps}`)
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

export let init = async ({
    LIB=[],
    WATCH=null
} = {}) => {

    let paths = ['./lib', ...LIB]

    for await (let p of getPaths(paths)) {
        await loadLib(p)
    }

    if (WATCH) {
        for (let p of paths) {
            watchPath(p)
        }
    }
}
