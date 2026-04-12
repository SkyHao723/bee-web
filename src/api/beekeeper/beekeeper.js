import request from '@/utils/request'

// 查询蜂农信息列表
export function listBeekeeper(query) {
  return request({
    url: '/beekeeper/beekeeper/list',
    method: 'get',
    params: query
  })
}

// 查询蜂农信息详细
export function getBeekeeper(userId) {
  return request({
    url: '/beekeeper/beekeeper/' + userId,
    method: 'get'
  })
}

// 新增蜂农信息
export function addBeekeeper(data) {
  return request({
    url: '/beekeeper/beekeeper',
    method: 'post',
    data: data
  })
}

// 修改蜂农信息
export function updateBeekeeper(data) {
  return request({
    url: '/beekeeper/beekeeper',
    method: 'put',
    data: data
  })
}

// 删除蜂农信息
export function delBeekeeper(userId) {
  return request({
    url: '/beekeeper/beekeeper/' + userId,
    method: 'delete'
  })
}
