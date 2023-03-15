'use strict';
const path = require('path')
const fs = require('fs')

const { log, request, spawn, globAsync } = require('@forest-cli-dev/utils')
const Command = require('@forest-cli-dev/command');
const Git = require('@forest-cli-dev/git');

class Publish extends Command {
    constructor(...args){
        super(...args)
        // log.info('args', args)
    }

    init(){

    }

    async exec(){
        const start = Date.now()
        this.prepare()
        const git = new Git(this.projectInfo)
        // const user = await git.getUserInfo()
        await git.syncCommitToOrigin()
        // log.info(JSON.stringify(user))
        const end = Date.now()
        log.info('代码提交完成')
        log.info('本次发布耗时：', `${end - start}ms`)

    }

    prepare(){
        // 检查是否是npm项目
        const cwd = process.cwd()
        const packageJsonPath = path.resolve(cwd, 'package.json')
        if(!fs.existsSync(packageJsonPath)){
            throw Error('当前项目非npm项目，请检查项目路径是否正确')
        }

        // 检查是否有build命令
        const pkg = require(packageJsonPath)
        if(!pkg?.scripts?.build){
            throw Error('当前项目缺少build命令')
        }
        if(!pkg.name || !pkg.version) {
            throw Error('当前项目信息不全')
        }
        this.projectInfo = {
            name: pkg.name,
            version: pkg.version,
            dir: cwd
        }
    }
}


module.exports = function () {
    const [arg1] = arguments
    if (arg1 instanceof Array && arguments.length === 1) {
        return new Publish(...arg1)
    } else {
        return new Publish(...Array.from(arguments))
    }
};

