'use strict';


const axios = require('axios')
const npmlog = require('./log')
const semver = require('semver')

async function getNpmVersions(packageName) {
  try {
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`)
    const status = String(response.status)
    if(!status.startsWith('2')) throw Error(JSON.stringify(response))
    const versions = Object.keys(response.data.versions)
    versions.reverse()
    // versions.sort((a, b) => semver.gt(b, a))// ???
    return versions
  } catch (error) {
    npmlog.error('获取package版本信息失败', error.message)
  }

}

module.exports = getNpmVersions