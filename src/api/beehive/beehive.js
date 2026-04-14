import request from '@/utils/request'

// 查询蜂箱管理列表
export function listBeehive(query) {
  return request({
    url: '/beehive/beehive/list',
    method: 'get',
    params: query
  })
}

// 查询蜂箱管理详细
export function getBeehive(beehiveId) {
  return request({
    url: '/beehive/beehive/' + beehiveId,
    method: 'get'
  })
}

// 新增蜂箱管理
export function addBeehive(data) {
  return request({
    url: '/beehive/beehive',
    method: 'post',
    data: data
  })
}

// 修改蜂箱管理
export function updateBeehive(data) {
  return request({
    url: '/beehive/beehive',
    method: 'put',
    data: data
  })
}

// 删除蜂箱管理
export function delBeehive(beehiveId) {
  return request({
    url: '/beehive/beehive/' + beehiveId,
    method: 'delete'
  })
}

// 验证二维码
export function verifyQrCode(qrCode) {
  return request({
    url: '/beehive/beehive/bind',
    method: 'post',
    data: { qrCode: qrCode }
  })
}

// 激活蜂箱
export function activateBeehive(data) {
  return request({
    url: '/beehive/beehive/activate',
    method: 'post',
    data: data
  })
}
