'use strict';

const fs = require('fs')
const path = require('path')
const npminstall = require('npminstall')
const isObject = require('@forest-cli-dev/utils/lib/isObject')
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
        this.packageVersion = packageVersion
    }

    exist() {
        // test()
    }

    async install() {
        await npminstall({
            root: this.storePath,
            pkgs: [
                {
                    name: this.packageName,
                    version: this.packageVersion
                },
            ],
        })
    }

    getRootFilePath(targetPath) {
        const pkgPath = path.resolve(targetPath, './package.json')
        if (!fs.existsSync(pkgPath)) {
            return ''
        }
        const pkg = require(pkgPath)
        if (pkg && pkg.main) {
            const rootPath = path.resolve(targetPath, pkg.main)
            return rootPath
        } else {
            return ''
        }
    }

}

module.exports = Package;
