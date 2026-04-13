import request from '@/utils/request'

// 查询温度湿度列表
export function listTemperature(query) {
  return request({
    url: '/system/temperature/list',
    method: 'get',
    params: query
  })
}
