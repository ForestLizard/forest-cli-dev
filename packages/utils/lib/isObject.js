/**
 * 判断是否是非数组对象
 */
function isObject(o){
  return Object.prototype.toString.call(o) === '[object Object]'
}

module.exports = isObject;
