// 'use strict';
const fs = require('fs')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const semver = require('semver')
const Command = require('@forest-cli-dev/command')
const { log, request, spawn, globAsync } = require('@forest-cli-dev/utils')
const Package = require('@forest-cli-dev/package')
const path = require('path')
const glob = require('glob')
const ejs = require('ejs')


// function init(projectName, options) {
//     // TODO
//     console.log(projectName, options.force, process.env.CLI_TARGET_PATH)
// }

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'compenent'

const TEMPLATE_PATH = './templates'

class Init extends Command {
    constructor(...args) {
        super(...args)
        this.projectName = null
        this.templates = null
    }

    init() {
        this.projectName = this.commandParam
    }

    async exec() {
        // 获取模版信息
        const ret = await this.prepare()
        if (!ret) return
        const projectInfo = await this.getProjectInfo()
        console.log('pro', projectInfo)
    }

    async installProject(templateNpmName) {
        const installCmd = this.templates.find(item => item.npmName === templateNpmName)?.installCmd
        const installCmdArr = installCmd.split(' ')
        await spawn(installCmdArr[0], installCmdArr.slice(1))
    }

    async ejsRender(){
        const cwd = process.cwd()
        const files = await globAsync('**/package.json', {
            ignore: ['node_modules/**', 'public/**'],
            cwd,
            nodir: true
        })
        await files.forEach(file => {
            const filename = path.resolve(cwd, file)
            ejs.renderFile(filename, {
                project: {
                    name: this.projectInfo.projectName,
                    version: this.projectInfo.projectVersion
                }
            }, {}, function(err, str){
                fs.writeFile(filename, str, ()=> {})
            });
        })
    }

    async getProjectInfo() {
        // 选择创建的是组件还是项目
        const { type } = await inquirer.prompt({
            type: 'rawlist',
            message: '请选择初始化类型',
            name: 'type',
            default: TYPE_PROJECT,
            choices: [
                {
                    name: '项目',
                    value: TYPE_PROJECT
                },
                {
                    name: '组件',
                    value: TYPE_COMPONENT
                }
            ]
        })
        // 获取项目的基本信息
        let info = {}
        if (type === TYPE_PROJECT) {
            info = await inquirer.prompt([
                {
                    type: 'input',
                    message: '请输入项目名称',
                    name: 'projectName',
                },
                {
                    type: 'input',
                    message: '请输入项目版本号',
                    name: 'projectVersion',
                    validate: function (value) {
                        // return !!semver.valid(value)
                        const done = this.async();
                        // Do async stuff
                        setTimeout(function () {
                            if (!semver.valid(value)) {
                                done('请输入正确版本号');
                                return;
                            }
                            done(null, true);
                        });
                    }
                },
                {
                    type: 'rawlist',
                    message: '请选择项目模版',
                    name: 'projectTemplate',
                    // default: TYPE_PROJECT,
                    choices: this.templates.map(item => ({
                        name: item.name,
                        value: item.npmName
                    }))
                }
            ])
            this.projectInfo = {
                ...info
            }
            const targetPath = await this.checkTemplatePackage()
            const cwdPath = process.cwd()
            fse.copySync(path.resolve(targetPath, './template'), cwdPath)
            // esj模版渲染
            await this.ejsRender()
            // 依赖安装（pnpm）
            // await this.installProject(templateNpmName)

        } else {
            log.info('tt', TYPE_COMPONENT)
        }
        this.projectInfo = {
            ...info,
            type
        }
    }

    async checkTemplatePackage() {
        const storePath = path.resolve(process.env.CLI_HOME_PATH, TEMPLATE_PATH)
        console.log('CLI_HOME_PATH', process.env.CLI_HOME_PATH, TEMPLATE_PATH)
        if (!fs.existsSync(storePath)) {
            fs.mkdirSync(storePath)
        }
        const pkg = new Package({
            packageName: this.projectInfo.projectTemplate,
            // packageName: '@forest-cli-dev/init',
            storePath
        })
        if (pkg.exist) {
            const isNewest = await pkg.checkNewestVersion()
            if (!isNewest) {
                await pkg.update()
            }
        } else {
            await pkg.install()
        }  
        return pkg.targetPath    
    }

    async prepare() {
        const cwd = process.cwd() // === path.resolve('./')
        log.info('current cwd: ', cwd)
        const { data: templates } = await request('/project/getTemplate')
        console.log('templates', templates)
        if (!templates?.length) {
            throw Error('项目模版不存在')
        }
        this.templates = templates
        const files = fs.readdirSync(cwd)
        if (files?.length) {
            if (!this.options.force) {
                const { isContinue } = await inquirer.prompt({
                    type: 'confirm',
                    message: '当前文件夹不为空，是否清空并且创建项目？',
                    name: 'isContinue'
                })
                if (!isContinue) return false
            }
            fse.emptyDirSync(cwd)
        }

        return true
    }


}



module.exports = function () {
    const [arg1] = arguments
    if (arg1 instanceof Array && arguments.length === 1) {
        return new Init(...arg1)
    } else {
        return new Init(...Array.from(arguments))
    }
};

