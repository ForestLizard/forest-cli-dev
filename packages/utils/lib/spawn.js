'use strict';

const cp = require('child_process')

function spawn(cmd, args, options){
  const isWin32 = process.isWin32
  const command = isWin32 ? 'cmd' : cmd
  const cmdArgs = isWin32 ? ['/c', cmd].concat(args) : args
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, cmdArgs, {
      cwd: process.cwd(),
      stdio: 'inherit'
    })
    child.on('error', e => {
      // 主进程退出
      reject(e)
      process.exit(e)
    })
    child.on('exit', () => {
      resolve()
    })

  })
}

module.exports = spawn