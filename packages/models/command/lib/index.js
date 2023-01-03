'use strict';
const { log } = require('@forest-cli-dev/utils')


class Command {
    constructor(...args){
        log.verbose('command params: ', args.length)
        this.commandParam = args[0]
        this.options = args[1]
        Promise.resolve()
        .then(() => this.init())
        .then(() => this.exec())
        .catch(error => {
            log.error(error)
        })
    }

    init(){
        throw Error('init方法必须实现')
    }

    exec(){
        throw Error('exec方法必须实现')
    }

    // __initArgvs(args){

    // }
}

module.exports = Command;

