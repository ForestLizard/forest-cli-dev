const path = require('path')
const fs = require('fs')
const cp = require('child_process')
const Package = require('@forest-cli-dev/package')

const { log, spawn } = require('@forest-cli-dev/utils')

const PACKAGE_NAME_SETTING = {
  'init': '@forest-cli-dev/init',
  'publish': '@forest-cli-dev/publish'
}

const TEMPLATE_PATH = './dependences'

function getSimpleArgs(args) {
  const simpleArgs = args.slice(0, args.length - 1)
  const cmdObj = args[args.length - 1]
  const o = Object.create(null)
  Object.keys(cmdObj).forEach(key => {
    if (cmdObj.hasOwnProperty(key) && !key.startsWith('_')) {
      o[key] = cmdObj[key]
    }
  })
  simpleArgs.push(o)
  console.log('io', simpleArgs)
  return simpleArgs
}


// function spawn(cmd, args, options){
//   const isWin32 = process.isWin32
//   const command = isWin32 ? 'cmd' : cmd
//   const cmdArgs = isWin32 ? ['/c', cmd].concat(args) : args
//   return cp.spawn(command, cmdArgs, options)
// }

async function exec(...args) {

  const cmdObj = args[args.length - 1] // 入参可能是一个，也可能是两个
  const cmdName = cmdObj.name()
  const targetPath = process.env.CLI_TARGET_PATH
  const packageName = PACKAGE_NAME_SETTING[cmdName]
  // const packageVersion = 'latest'

  if (!packageName) {
    throw Error('该command不存在对应的package')
  }

  let pkg
  if (targetPath) {
    // 指定了本地调试文件路径
    pkg = new Package({
      targetPath,
      packageName,
      // packageVersion
    })
    log.verbose('generate package', pkg)
  } else {
    // 从缓存中加载包
    const storePath = path.resolve(process.env.CLI_HOME_PATH, TEMPLATE_PATH)
    if (!fs.existsSync(storePath)) {
      fs.mkdirSync(storePath)
    }
    pkg = new Package({
      storePath,
      packageName,
      // packageVersion
    })
    if (pkg.exist) {
      log.info('pkg exist')
      const isNewest = await pkg.checkNewestVersion()
      if (!isNewest) {
        await pkg.update()
      }
    } else {
      await pkg.install()
    }
  }
  const rootFilePath = pkg.getRootFilePath()
  log.verbose('command rootFilePath: ', rootFilePath)
  if (rootFilePath) {
    const simpleArgs = args.slice(0, args.length - 1)
    const code = `require('${rootFilePath}')(...${JSON.stringify(simpleArgs)})`
    spawn('node', ['-e', code])
    log.info('command exec success!')
  }
}


module.exports = exec