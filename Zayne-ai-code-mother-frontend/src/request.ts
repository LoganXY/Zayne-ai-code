import axios from 'axios'
import { message } from 'ant-design-vue'

// 创建 Axios 实例
const myAxios = axios.create({
  baseURL: 'http://localhost:8123/api',
  timeout: 60000,
  withCredentials: true,
})

// 全局请求拦截器
myAxios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  },
)

// 全局响应拦截器
myAxios.interceptors.response.use(
  function (response) {
    const { data } = response
    // 未登录
    if (data.code === 40100) {
      const requestUrl = response.request?.responseURL || response.config?.url || ''
      const currentPath = window.location.pathname
      // 获取登录态、登录页、注册页不强制跳转
      if (
        !requestUrl.includes('user/get/login') &&
        !currentPath.includes('/user/login') &&
        !currentPath.includes('/user/register')
      ) {
        message.warning('请先登录')
        window.location.href = `/user/login?redirect=${window.location.href}`
      }
    }
    return response
  },
  function (error) {
    const errMsg = error?.response?.data?.message || error?.message || '请求失败'
    message.error(errMsg)
    return Promise.reject(error)
  },
)

export default myAxios
