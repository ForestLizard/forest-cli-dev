'use strict';
const fs = require('fs')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const Command = require('@forest-cli-dev/command')
const { log } = require('@forest-cli-dev/utils')



// function init(projectName, options) {
//     // TODO
//     console.log(projectName, options.force, process.env.CLI_TARGET_PATH)
// }

class Init extends Command {
    constructor(...args){
        super(...args)
    }

    init(){
        this.projectName = this.commandParam
    }
    
    async exec(){
        const ret = await this.prepare()
        if(!ret) return
        log.info('创建项目')
        //

    }

    async prepare(){
        const cwd = process.cwd() // === path.resolve('./')
        log.info('current cwd: ', cwd)
        const files = fs.readdirSync(cwd)
        if(files?.length){
            if(!this.options.force) {
                const isContinue = await inquirer.prompt({
                    type: 'confirm',
                    message: '当前文件夹不为空，是否清空并且创建项目？',
                    name: 'isContinue'
                })
                if(!isContinue) return false
            }
            fse.emptyDirSync(cwd)
        }
        return true
    }

   
}



module.exports = function(){
    const [arg1] = arguments
    if(arg1 instanceof Array && arguments.length === 1){
        return new Init(...arg1)
    }else{
        return new Init(...Array.from(arguments))
    }
};