import request from '@/utils/request'
import { getToken } from '@/utils/auth'

const centerUrl = process.env.VUE_APP_BASE_API + '/api/v1/game_server'

// 获取服务列表
export function getServerList() {
  return request({
    baseURL: centerUrl,
    url: 'server_list',
    method: 'get'
  })
}

// 控制命令
export function serverControl(ctlId, serverList) {
  var data = {
    token: getToken(),
    ctlId: ctlId,
    serverList: serverList
  }

  return request({
    baseURL: centerUrl,
    url: 'server_control',
    method: 'put',
    data: data
  })
}
