const path = require('path')

function formatPath(p){
  if(typeof p === 'string'){
    const sep = path.sep
    if(sep === '/'){
      return p
    }
    return p.replace(/\\/g, '/')
  }else{
    return ''
  }
}

module.exports = formatPath;