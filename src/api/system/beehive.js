import request from '@/utils/request'

// 查询蜂箱管理列表
export function listBeehive(query) {
  return request({
    url: '/system/beehive/list',
    method: 'get',
    params: query
  })
}

// 查询蜂箱管理详细
export function getBeehive(beehiveId) {
  return request({
    url: '/system/beehive/' + beehiveId,
    method: 'get'
  })
}

// 新增蜂箱管理
export function addBeehive(data) {
  return request({
    url: '/system/beehive',
    method: 'post',
    data: data
  })
}

// 修改蜂箱管理
export function updateBeehive(data) {
  return request({
    url: '/system/beehive',
    method: 'put',
    data: data
  })
}

// 删除蜂箱管理
export function delBeehive(beehiveId) {
  return request({
    url: '/system/beehive/' + beehiveId,
    method: 'delete'
  })
}

// 通过二维码绑定蜂箱
export function bindBeehiveByQrCode(qrCodeData) {
  return request({
    url: '/system/beehive/bind',
    method: 'post',
    data: { qrCode: qrCodeData }
  })
}
