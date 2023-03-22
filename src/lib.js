import { path as path_} from './deps.js'
import { argv } from './argv.js'
import * as lib from './lib/index.js'

let CWD = Deno.cwd()

let load = async ({name, path}) => {
    try {
        console.log(`pg_sidecar.js loads ${name}=${path}`)

        let mod = await import(
            path.startsWith('http')
            ? path
            : `file://${path_.resolve(CWD, path)}`
        )
        if (name==='.') {
            Object.assign(Commands, mod)
        }
        else {
            Commands[name] = mod
        }
        return Commands.info()
    } catch(e) {
        console.log(`pg_sidecar.js ERR fail to load ${name}=${path}: ${e.message}`)
        throw e
    }
}

export let Commands = Object.assign({
    info: () => {
        return {
            name: argv.NAME,
            commands: Object.keys(Commands),
        }
    },
    load,
}, lib)


export let get = (path) => {
    let keys = path.split('.')
    let r = Commands
    for (let k of keys) {
        if (!(k in r)) return
        r = r[k]
    }
    return r
}

export let init = async () => {
    // name=url
    let paths = [...(Array.isArray(argv.LIB) ? argv.LIB : [argv.LIB])]
        .filter(Boolean)
        .map(l => {
            let ps = l.split('=')
            let unnamed = ps.length===1
            return {
                name: unnamed ? '.': ps[0],
                path: unnamed ? ps[0] : ps.slice(1).join('=')
            }
        })

    for (let {name, path} of paths) {
        await load({name, path})
    }
}
