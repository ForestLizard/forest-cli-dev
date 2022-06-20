'use strict';
const npmlog = require('npmlog')

function init() {
  // TODOddddd999
  npmlog.addLevel('success', 2010, { fg: 'green', bold: 500, bg: 'white' }) // 这里定义的是level key的样式
  npmlog.heading = 'forest-cli' // prefix
  npmlog.level = process.env.LOG_LEVEL || 'info'
}

init() 

module.exports = npmlog;