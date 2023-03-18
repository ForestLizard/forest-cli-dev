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




const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

const TEMPLATE_PATH = './templates'

class Init extends Command {
    constructor(...args) {
        super(...args)
        // this.projectName = null
        this.templates = null
        this.projectInfo = null
        this.componentInfo = null
    }

    init() {
        // this.projectName = this.commandParam
    }

    async exec() {
        
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
        this.type = type
        if(type === TYPE_PROJECT){
            const ret = await this.prepare()
            if (!ret) return
            await this.fetchTemplateInfo()
            await this.initProject()
        }else{
            await this.fetchTemplateInfo()
            await this.initCommponent()
        }
    }

    async fetchTemplateInfo(){
        const { type } = this
        // const { data: templates } = await request(`/${type}/getTemplate`)
        // 实际使用时，需部署一个服务用于存储模板信息，模板信息与npm @forest-cli-dev-template-project/里的模板一致
        const { data: templates } = type === 'project' ? {
            data: [
                {
                    name: 'create-react-app模板',
                    npmName: '@forest-cli-dev-template-project/create-react-app',
                    installCmd: 'pnpm install'
                },
                {
                    name: 'next.js模板',
                    npmName: '@forest-cli-dev-template-project/next',
                    installCmd: 'pnpm install'
                }
            ],
            msg: '',
            code: 0,
        } : {
            data: [
                {
                    name: 'ListPage',
                    npmName: '@forest-cli-dev-template-component/list-page',
                    componentName: 'ListPage'
                },
            ],
            msg: '',
            code: 0,
        }
        if (!templates?.length) {
            throw Error('模版不存在')
        }
        this.templates = templates
    }

    async renameHiddenFiles(){
        const cwdPath = process.cwd()
        const hiddenFiles = ['gitignore', 'eslint', 'eslintignore']
        const files = fs.readdirSync(cwdPath)
        files.filter(item => hiddenFiles.includes(item)).forEach(item => {
            fs.renameSync(item, `.${item}`)
        })
    }

    async initProject(){
        const info = await inquirer.prompt([
            {
                type: 'input',
                message: '请输入项目名称',
                name: 'name',
            },
            {
                type: 'input',
                message: '请输入项目版本号',
                name: 'version',
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
                name: 'template',
                // default: TYPE_PROJECT,
                choices: this.templates.map(item => ({
                    name: item.name,
                    value: item.npmName
                }))
            }
        ])
        this.projectInfo = {
            ...info,
        }
        const targetPath = await this.checkTemplatePackage()
        const cwdPath = process.cwd()
        fse.copySync(path.resolve(targetPath, './template'), cwdPath)
        // 隐藏文件重命名，npm发布时无法发布隐藏文件
        await this.renameHiddenFiles()
        // esj模版渲染
        await this.ejsRender()
        log.success('项目安装完成，开始安装依赖...')
        // 依赖安装（pnpm）
        await this.installProject()
    }

    async initCommponent(){
        const info = await inquirer.prompt([
            {
                type: 'rawlist',
                message: '请选择组件',
                name: 'template',
                // default: TYPE_PROJECT,
                choices: this.templates.map(item => ({
                    name: item.name,
                    value: item.npmName
                }))
            }
        ])
        this.componentInfo = {
            ...info,
        }
        const componentName = this.templates.find(item => item.npmName === this.componentInfo.template)?.componentName
        const targetPath = await this.checkTemplatePackage()
        const cwdPath = process.cwd()
        const comPath = path.resolve(cwdPath, componentName)
        fs.mkdirSync(comPath)
        fse.copySync(path.resolve(targetPath, './template'), comPath)
    }

    async installProject() {
        const installCmd = this.templates.find(item => item.npmName === this.projectInfo.template)?.installCmd
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
                    name: this.projectInfo.name,
                    version: this.projectInfo.version
                }
            }, {}, function(err, str){
                fs.writeFile(filename, str, ()=> {})
            });
        })
    }

   
    async checkTemplatePackage() {
        const storePath = path.resolve(process.env.CLI_HOME_PATH, TEMPLATE_PATH)
        console.log('CLI_HOME_PATH', process.env.CLI_HOME_PATH, TEMPLATE_PATH)
        if (!fs.existsSync(storePath)) {
            fs.mkdirSync(storePath)
        }
        const pkg = new Package({
            packageName: this.type === TYPE_PROJECT ? this.projectInfo.template : this.componentInfo.template,
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
        const files = fs.readdirSync(cwd).filter(item => item !== '.git')
        if (files?.length) {
            if (!this.options.force) {
                const { isContinue } = await inquirer.prompt({
                    type: 'confirm',
                    message: '当前文件夹不为空，是否清空并且创建项目？',
                    name: 'isContinue'
                })
                if (!isContinue) return false
            }
            // fse.emptyDirSync(cwd)
            files.forEach(item => {
                // if(fs.statSync(item).isDirectory()){
                //     fse.rm
                // }else{
                //     fs.unlinkSync(item)
                // }
                fse.rmSync(item, {
                    recursive: true
                })
            })
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

