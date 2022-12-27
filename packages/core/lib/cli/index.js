'use strict';
const path = require('path')
const fs = require('fs')
const { log } = require('@forest-cli-dev/utils')
const init = require('@forest-cli-dev/init')
const semver = require('semver')
const colors = require('colors')
const commander = require('commander')
const userhome = require('userhome')()
const pkg = require('../../package.json')
const constants = require('./contants')
const exec = require('../exec')


const program = new commander.Command()

function core() {
    // TODO
    try {
        prepare()
        // checkRoot()
        registerCommand()
    } catch (e) {
        log.error(e.message)
    }
}

const prepare = () => {
    checkPackageVersion()
    checkNodeVersion()
    createCliHomePath()
}

const checkPackageVersion = () => {
    log.notice('当前版本', `v${pkg.version}`)
}

const checkNodeVersion = () => {
    const currentVersion = process.version
    const lowestVersion = constants.LOWEST_NODE_VERSION
    if (semver.lt(currentVersion, lowestVersion)) {
        throw Error(colors.bgRed.green(`当前node版本过低，需要安装${lowestVersion}及以上版本`))
    }
}

const createCliHomePath = () => {
    const cliHomePath = path.resolve(userhome, './.forest')
    if(!fs.existsSync(cliHomePath)){
        fs.mkdirSync(cliHomePath)
    }
    process.env.CLI_HOME_PATH = cliHomePath
}

const checkRoot = async () => {
    const { rootCheck } = await import('root-check')
    rootCheck()
    log.info('uid', process.getuid())
}

const registerCommand = () => {
    program
        .version(pkg.version)
        .usage('<command> <options>')
        .name(Object.keys(pkg.bin)[0])
        .option('-D, --debug', '是否开启调试模式', false)
        .option('-TP, --targetPath <string>', '是否指定本地调试文件路径', '') // 所有命令都有,覆盖command选项

    // 注册主命令option
    program.on('option:debug', () => {
        process.env.LOG_LEVEL = 'verbose'
        log.level = process.env.LOG_LEVEL
        log.verbose('verbose', 'debug 模式启动')
    })

    program.on('option:targetPath', (targetPath) => {
        process.env.CLI_TARGET_PATH = targetPath
    })

    // 注册command
    program.command('init [projectName]')
        .option('-F --force')
        .action(exec)


    // 监听未知命令
    program.on('command:*', (obj) => {
        const avaliableCommands = program.commands.map(item => item.name())
        console.log(colors.red(`未知命令: ${obj}`))
        if (avaliableCommands.length) {
            console.log(colors.red(`可用命令: ${avaliableCommands.join(',')}`))
        }
    })

    // 只输入主命令，出help
    if (process.argv.length === 2) {
        program.outputHelp()
    }

    program.parse(process.argv)


    // const opts = program.opts()
    // if(opts.debug) {
    //     process.env.LOG_LEVEL = 'verbose'
    //     log.level = process.env.LOG_LEVEL
    //     log.verbose('verbose', 'debug 模式启动')
    // }

    // if(opts.targetPath) {
    //     console.log('dd', opts.targetPath)
    //     process.env.CLI_TARGET_PATH = opts.targetPath
    // }
}

module.exports = core;