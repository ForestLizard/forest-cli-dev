'use strict';
const path = require('path')
const fs = require('fs')
const inquirer = require('inquirer')
const simpleGit = require('simple-git');
const terminalLink = require('terminal-link')
const axios = require('axios')
const { log } = require('@forest-cli-dev/utils');

const GIT_SYMBOL = Symbol('#git')
const INIT_CONFIG_FILE_SYMBOL = Symbol('#initConfigFile')
const INIT_TOKEN = Symbol('#initToken')
const INIT_REQUEST_INSTANCE = Symbol('#initRequestInstance')
const REQUEST = Symbol('#request')

const DefaultGitConfigFile = {
    "github": {
        "token": ""
    },
    "gitlab": {
        "token": ""
    }
}

const COMMIT_TYPE = [
    {
        name: 'feat',
        value: 'feat'
    },
    {
        name: 'fix',
        value: 'fix'
    },
    {
        name: 'style',
        value: 'style'
    },
    {
        name: 'refactor',
        value: 'refactor'
    },
    {
        name: 'docs',
        value: 'docs'
    },
    {
        name: 'build',
        value: 'build'
    },
]

class Git {
    constructor({ name,version, dir }){
        this.name = name 
        this.version = version
        this.dir = dir
        this.configFilePath = null
        // gitServer
        this.server = 'github'
        this.serverOrigin = 'https://api.github.com'
        // gitServer token
        this.token = null
        this.requestInstance = null
        this[INIT_CONFIG_FILE_SYMBOL]()
        this[INIT_TOKEN]()
        this.git = simpleGit()
        this[INIT_REQUEST_INSTANCE]()
    }

    [INIT_CONFIG_FILE_SYMBOL](){
        const cliHomePath = process.env.CLI_HOME_PATH
        const configFilePath = path.resolve(cliHomePath, '.git')
        // fse.ensureFileSync(config)
        if(!fs.existsSync(configFilePath)){
            fs.writeFileSync(configFilePath, JSON.stringify(DefaultGitConfigFile))
        }
        this.configFilePath = configFilePath
    }

    async [INIT_TOKEN](){
        const buffer = fs.readFileSync(this.configFilePath)
        const config = JSON.parse(buffer.toString())
        const { github: { token } } = config
        if(!token){
            log.warn(`gitToken未生成，请先生成token，参照链接: ${terminalLink('', 'www.baidu.com')}`)
            token = (await inquirer.prompt([{
                type: 'password',
                message: '请将gitToken复制在这里',
                name: 'token',

            }])).token
            config[this.server].token = token
            fs.writeFileSync(this.configFilePath, JSON.stringify(config))
        }
        this.token = token

        
    }

    // getToken(){
    //     const buffer = fs.readFileSync(this.configFilePath)
    //     const { github: { token } } = JSON.parse(buffer.toString())
    //     return token
    // }

    // saveToken(server, token){
    //     const buffer = fs.readFileSync(this.configFilePath)
    //     const config = JSON.parse(buffer.toString())
    //     config[server].token = token
    //     fs.writeFileSync(this.configFilePath, JSON.stringify(config))
    // }

    [INIT_REQUEST_INSTANCE](){
        const instance = axios.create({
            timeout: 3000,
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': `Bearer ${this.token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            },
          })
          
        instance.interceptors.response.use(function (response) {
            // Any status code that lie within the range of 2xx cause this function to trigger
            // Do something with response data
            if(String(response.status).startsWith('2')){
                return Promise.resolve(response.data)
            }else{
                return Promise.reject(`${response.status}===${response.data}`)
            }
            }, function (error) {
            // Any status codes that falls outside the range of 2xx cause this function to trigger
            // Do something with response error
            return Promise.reject(error);
        });

        this.requestInstance = instance
    }

    [REQUEST](path, method, payload){
        const requestParams = {
            method,
            url: `${this.serverOrigin}${path}`,
        }
        if(payload){
            requestParams[method === 'get' ? 'params' : 'data'] = payload 
        }
        return this.requestInstance(requestParams)
    }

    getUserInfo(){
        return this[REQUEST]('/organizations', 'get')
    }

    async confirmConflictFinish(){
        const { finish } = (await inquirer.prompt([{
            type: 'confirm',
            message: '是否已解决完冲突？',
            name: 'finish',
            default: false
        }]))
        if(finish){
            return true
        }else{
            return this.confirmConflictFinish()
        }
    }

    // flow流程1
    async syncCommitToOrigin(){
        // 获取当前仓库分支名
        const branchInfo = await this.git.branchLocal()
        const { current } = branchInfo
        await this.git.stash()
        await this.git.pull(['--rebase'])
        const stashResults =  await this.git.stash(['pop'])
        const reg = /CONFLICT/i
        if(reg.test(stashResults)){
            // 存在冲突
            log.info('存在代码冲突，请先解决冲突')
            await this.confirmConflictFinish()
        }
        await this.git.add(['-A'])
        const {
            type,
            message,
        } = (await inquirer.prompt([{
            type: 'rawlist',
            message: '请选择commit类型',
            name: 'type',
            choices: COMMIT_TYPE
        },
        {
            type: 'input',
            message: '请输入commit',
            name: 'message',
            default: 'add some issues'
        }]))
        await this.git.commit(`${type}: ${message}`)
        await this.git.push()
        // log.info('bbb', re)
        
    }
}

module.exports = Git;


