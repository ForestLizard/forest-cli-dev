'use strict';

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process');
const npminstall = require('npminstall')
const semver = require('semver')
const { isObject, getNpmVersions, log } = require('@forest-cli-dev/utils');
const npmlog = require('@forest-cli-dev/utils/lib/log');
// const formatPath = require('@forest-cli-dev/utils/lib/formatPath')

class Package {
    constructor(options) {
        if (!isObject(options)) {
            throw Error('package实例化的参数必须为对象')
        }
        const { targetPath, storePath, packageName, packageVersion } = options
        this.targetPath = targetPath
        this.storePath = storePath
        this.packageName = packageName
        // 缓存中是否存在该包
        this.exist = false
        if(this.storePath){
            this.exist = fs.existsSync(path.resolve(this.storePath, 'node_modules', this.packageName))
            if(this.exist){
                this.targetPath = path.resolve(this.storePath, 'node_modules', this.packageName)
            }
        }
        
        // this.packageVersion = packageVersion
    }


    async install() {
        if(!this.storePath){
            throw Error('必须在缓存模式下使用')
        }
        npmlog.info('正在安装：', this.packageName)
        await npminstall({
            root: this.storePath,
            pkgs: [
                {
                    name: this.packageName,
                },
            ],
            registry: 'https://registry.npmjs.org',
            // storeDir: path.resolve(this.storePath, './node_modules', this.packageName, './node_modules'),
            // targetDir: this.storePath
        })
        this.targetPath = path.resolve(this.storePath, './node_modules', this.packageName)
    }

    async checkNewestVersion(){
        if(!this.storePath){
            throw Error('必须在缓存模式下使用')
        }
        const [ newestVersion ] = await getNpmVersions(this.packageName)
        const pkgPath = path.resolve(this.storePath, './node_modules', this.packageName, './package.json') // 读的是软连接
        const pkg = require(pkgPath)
        const { version } = pkg
        log.info(`${this.packageName} newestVersion: `, newestVersion)
        log.info(`${this.packageName} currentVersion: `, version)
        return !semver.lt(version, newestVersion)
    }

    async update(){
        log.info('updating...')
        if(!this.storePath){
            throw Error('必须在缓存模式下使用')
        } 
        const pkgPath = path.resolve(this.storePath, 'node_modules', this.packageName)
        execSync(`rm -rf ${pkgPath}`)
        log.info('remove expired version success')
        await this.install()
    }

    getRootFilePath() {
        const pkgPath = path.resolve(this.targetPath, './package.json')
        if (!fs.existsSync(pkgPath)) {
            return ''
        }
        const pkg = require(pkgPath)
        if (pkg && pkg.main) {
            const rootPath = path.resolve(this.targetPath, pkg.main)
            return rootPath
        } else {
            return ''
        }
    }

}

module.exports = Package;
