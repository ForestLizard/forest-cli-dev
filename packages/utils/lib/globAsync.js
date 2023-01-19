'use strict';
const glob = require('glob')

function globAsync(pattern, options) {
  return new Promise((resolve, reject) => {
    glob(pattern, options, function (err, files) {
      if(err){
        reject(err)
      }
      resolve(files)
    })
  })
}

module.exports = globAsync