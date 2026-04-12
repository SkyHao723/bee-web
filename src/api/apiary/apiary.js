import request from '@/utils/request'

// 查询蜂厂管理列表
export function listApiary(query) {
  return request({
    url: '/apiary/apiary/list',
    method: 'get',
    params: query
  })
}

// 查询蜂厂管理详细
export function getApiary(apiaryId) {
  return request({
    url: '/apiary/apiary/' + apiaryId,
    method: 'get'
  })
}

// 新增蜂厂管理
export function addApiary(data) {
  return request({
    url: '/apiary/apiary',
    method: 'post',
    data: data
  })
}

// 修改蜂厂管理
export function updateApiary(data) {
  return request({
    url: '/apiary/apiary',
    method: 'put',
    data: data
  })
}

// 删除蜂厂管理
export function delApiary(apiaryId) {
  return request({
    url: '/apiary/apiary/' + apiaryId,
    method: 'delete'
  })
}
