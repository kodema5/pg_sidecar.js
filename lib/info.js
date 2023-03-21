import { argv } from '../src/argv.js'
import { Commands } from '../src/lib.js'

export default () => {
    return {
        name: argv.NAME,
        commands: Object.keys(Commands),
    }
}