const path = require('path')
const fs = require('fs')
const Package = require('@forest-cli-dev/package')

const { log }  = require('@forest-cli-dev/utils')

const PACKAGE_NAME_SETTING = {
  'init': '@forest-cli-dev/init'
}

const DEPENDS_PATH = './dependences'

async function exec(){
  const cmdObj = arguments[arguments.length - 1] // 入参可能是一个，也可能是两个
  const cmdName = cmdObj.name()
  const targetPath = process.env.CLI_TARGET_PATH
  const packageName = PACKAGE_NAME_SETTING[cmdName]
  // const packageVersion = 'latest'

  if(!packageName) {
    throw Error('该command不存在对应的package')
  }

  let pkg
  if(targetPath){
    // 指定了本地调试文件路径
    pkg = new Package({
      targetPath,
      packageName,
      // packageVersion
    })
    log.verbose('generate package', pkg)
  }else{
    // 从缓存中加载包
    const storePath = path.resolve(process.env.CLI_HOME_PATH, DEPENDS_PATH)
    if(!fs.existsSync(storePath)){
      fs.mkdirSync(storePath)
    }
    pkg = new Package({
      storePath,
      packageName,
      // packageVersion
    })
    if(pkg.exist){
      log.info('pkg exist')
      const isNewest = await pkg.checkNewestVersion()
      if(!isNewest){
        pkg.update()
      }
    }else{
      pkg.install()
    }
  }
  const rootFilePath = pkg.getRootFilePath()
  log.verbose('command rootFilePath: ', rootFilePath)
  if(rootFilePath){
    require(rootFilePath)(...arguments)
  }
}

module.exports = exec