import request from '@/utils/request'

// 查询【请填写功能名称】列表
export function listApiary(query) {
  return request({
    url: '/system/apiary/list',
    method: 'get',
    params: query
  })
}

// 查询【请填写功能名称】详细
export function getApiary(apiaryId) {
  return request({
    url: '/system/apiary/' + apiaryId,
    method: 'get'
  })
}

// 新增【请填写功能名称】
export function addApiary(data) {
  return request({
    url: '/system/apiary',
    method: 'post',
    data: data
  })
}

// 修改【请填写功能名称】
export function updateApiary(data) {
  return request({
    url: '/system/apiary',
    method: 'put',
    data: data
  })
}

// 删除【请填写功能名称】
export function delApiary(apiaryId) {
  return request({
    url: '/system/apiary/' + apiaryId,
    method: 'delete'
  })
}
