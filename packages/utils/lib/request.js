'use strict';

const axios = require('axios')

// const BASE_URL = 'https://www.forest.com:5050'
const BASE_URL = 'http://127.0.0.1:5050'

const instance = axios.create({
  method: 'POST',
  timeout: 3000
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

function request(path, data = {}){
  return instance({
    url: `${BASE_URL}${path}`,
    data
  })
}

module.exports = request