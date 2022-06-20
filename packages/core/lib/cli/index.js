'use strict';
const pkg = require('../../package.json')
const log = require('@forest-cli-dev/utils/lib/log')
const semver = require('semver')
const colors = require('colors')
const constants = require('./contants')
module.exports = core;

function core() {
    // TODO
    try{
        checkPackageVersion()
        checkNodeVersion()
    }catch(e){
        log.error(e.message)
    }
}

const checkPackageVersion = () => {
    log.notice('当前版本', `v${pkg.version}`)
}

const checkNodeVersion = () => {
    const currentVersion = process.version
    const lowestVersion = constants.LOWEST_NODE_VERSION
    if(semver.lt(currentVersion, lowestVersion)){
        throw Error(colors.bgRed.green(`当前node版本过低，需要安装${lowestVersion}及以上版本`))
    }
}
