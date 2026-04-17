<template>
  <div class="bee-info">
    <div id="amap-container" class="map-container"></div>

    <div class="stats-container">
      <div class="stats-row">
        <div class="stats-card">
          <div class="stats-icon beehive-icon">
            <svg viewBox="0 0 1024 1024"><path d="M832 512a32 32 0 1 1 64 0v352a32 32 0 0 1-32 32H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h352a32 32 0 0 1 0 64H192v640h640z"></path></svg>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ beehiveCount }}</div>
            <div class="stats-label">蜂箱数量</div>
          </div>
        </div>
        <div class="stats-card">
          <div class="stats-icon beekeeper-icon">
            <svg viewBox="0 0 1024 1024"><path d="M786.496 824.96c-75.008-33.92-135.232-97.152-176.768-173.568-31.616 11.904-65.792 18.56-100.736 18.56s-69.12-6.656-100.736-18.56C340.768 727.808 280.512 791.04 205.504 824.96c-13.824 6.272-22.528 20.096-22.528 35.584V928a32 32 0 0 0 32 32h576a32 32 0 0 0 32-32v-67.456c0-15.488-8.704-29.312-22.528-35.584z"></path></svg>
          </div>
          <div class="stats-info">
            <div class="stats-value">{{ beekeeperCount }}</div>
            <div class="stats-label">蜂农数量</div>
          </div>
        </div>
      </div>
      <div class="stats-row">
        <div class="stats-card">
          <div class="stats-card-header">
            <span class="stats-card-title">蜂箱信息</span>
          </div>
          <div class="stats-card-content">
            <div class="info-item"><span class="info-label">在线蜂箱：</span><span class="info-value">{{ onlineBeehiveCount }}</span></div>
            <div class="info-item"><span class="info-label">离线蜂箱：</span><span class="info-value">{{ offlineBeehiveCount }}</span></div>
            <div class="info-item"><span class="info-label">异常蜂箱：</span><span class="info-value">{{ errorBeehiveCount }}</span></div>
          </div>
        </div>
        <div class="stats-card">
          <div class="stats-card-header">
            <span class="stats-card-title">警报信息</span>
            <span class="alert-badge" v-if="alertCount > 0">{{ alertCount }}</span>
          </div>
          <div class="stats-card-content">
            <div class="info-item"><span class="info-label">温度警报：</span><span class="info-value">{{ temperatureAlertCount }}</span></div>
            <div class="info-item"><span class="info-label">湿度警报：</span><span class="info-value">{{ humidityAlertCount }}</span></div>
            <div class="info-item"><span class="info-label">其他警报：</span><span class="info-value">{{ otherAlertCount }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="js">
// @ts-nocheck
import AMapLoader from '@amap/amap-jsapi-loader'
import { listBeehive } from '@/api/system/beehive'

export default {
  name: 'BeeFarmInfo',
  data() {
    return {
      map: null,
      // 高德地图的key
      amapKey: 'b05a8b4e1dea9ab757a2a8cffbba2c79',
      // 默认中心点和缩放级别，定位成功后会更新
      center: [116.403694, 39.914492],
      zoom: 17,
      locationStatus: '正在定位，请稍后...', // 状态提示
      // 蜂场标记点数据（改为空数组，从后端获取）
      markers: [],
      // 查询参数
      queryParams: {
        apiaryId: 1,
        beehiveId: 1,
        pageNum: 1,
        pageSize: 10
      },
      // 统计数据
      beehiveCount: 0,
      beekeeperCount: 0,
      onlineBeehiveCount: 0,
      offlineBeehiveCount: 0,
      errorBeehiveCount: 0,
      alertCount: 0,
      temperatureAlertCount: 0,
      humidityAlertCount: 0,
      otherAlertCount: 0,
      // 定时刷新
      refreshTimer: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initMapAndLoadMarkers()
      this.loadStats()
      this.startRefreshTimer()
    })
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    if (this.map) {
      this.map.destroy()
      this.map = null
    }
    window.removeEventListener('resize', this.handleResize)
    this.stopRefreshTimer()
  },
  methods: {
    startRefreshTimer() {
      this.refreshTimer = setInterval(() => {
        this.loadStats()
      }, 30000)
    },
    stopRefreshTimer() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    handleResize() {
      if (this.map) {
        this.map.resize()
      }
    },
    async initMapAndLoadMarkers() {
      await this.initMap()
      await this.loadBeehiveMarkers()
    },
    async initMap() {
      try {
        const AMap = await AMapLoader.load({
          key: this.amapKey,
          version: '2.0',
          // 只加载需要的控件（不依赖 AMap.Geolocation 的自动弹窗）
          plugins: ['AMap.Scale'],
        })

        this.map = new AMap.Map('amap-container', {
          zoom: this.zoom,
          center: this.center,
          resizeEnable: true,
          viewMode: '2D',
          dragEnable: false,
          zoomEnable: false,
          touchZoom: false,
          doubleClickZoom: false,
          scrollWheel: false,
          showLabel: false,
          keyboardEnable: false,
          animateEnable: false,
          isHotspot: false
        })

        this.map.getContainer().style.touchAction = 'none'
        this.map.getContainer().style.overflow = 'hidden'

        // 注意：移除这里的 addMarkers 调用，改为在 loadBeehiveMarkers 中调用
        // 使用浏览器原生定位前先弹窗询问用户授权
        this.locateUser(AMap)
      } catch (error) {
        console.error('高德地图加载失败：', error)
        this.locationStatus = '地图加载失败，请检查网络和Key'
      }
    },
    // 新增：从后端加载蜂箱标记数据
    async loadBeehiveMarkers() {
      try {
        // 确保地图已初始化
        if (!this.map) {
          console.warn('地图未初始化，等待地图就绪...')
          // 等待地图初始化（最多等待5秒）
          let waitCount = 0
          while (!this.map && waitCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100))
            waitCount++
          }
          if (!this.map) {
            console.error('地图初始化超时')
            return
          }
        }

        // 调用后端接口获取蜂箱列表
        const response = await listBeehive({
          pageNum: 1,
          pageSize: 1000  // 获取所有蜂箱
        })
        
        const beehiveList = response.rows || []
        
        // 转换数据格式为地图标记所需格式
        this.markers = beehiveList.map(item => {
          // 处理location字段，可能是 "POINT(经度 纬度)" 格式
          let lng = 0
          let lat = 0
          
          if (item.location) {
            if (typeof item.location === 'string' && item.location.startsWith('POINT(')) {
              // 解析 "POINT(118.180149 39.63068)" 格式
              const coords = item.location.replace('POINT(', '').replace(')', '').split(' ')
              lng = parseFloat(coords[0])
              lat = parseFloat(coords[1])
            } else if (typeof item.location === 'string') {
              // 直接是 "经度 纬度" 格式
              const coords = item.location.split(' ')
              lng = parseFloat(coords[0])
              lat = parseFloat(coords[1])
            }
          }
          
          return {
            position: [lng, lat],
            label: item.beehiveName || `蜂箱${item.beehiveId}`,
            beehiveId: item.beehiveId,
            apiaryId: item.apiaryId,
            beehiveStatus: item.beehiveStatus
          }
        }).filter(item => item.position[0] !== 0 && item.position[1] !== 0)  // 过滤掉无效坐标
        
        // 如果有蜂箱数据，添加到地图
        if (this.markers.length > 0) {
          // 清除旧标记（如果有）
          this.map.clearMap()
          
          // 添加蜂箱标记
          const AMap = window.AMap
          if (AMap) {
             this.addMarkers(AMap)
          } else {
            console.error('AMap 对象未找到，无法添加标记')
            return
          }
          
          // 可选：将地图中心设置为第一个蜂箱的位置
          if (this.markers.length > 0) {
            this.map.setCenter(this.markers[0].position)
            this.map.setZoom(17)
          }
        }
        
        console.log(`成功加载 ${this.markers.length} 个蜂箱标记`)
      } catch (error) {
        console.error('加载蜂箱标记数据失败：', error)
        // 如果项目中有 Element UI 的消息提示，可以启用下面这行
        // this.$message?.error('加载蜂箱数据失败')
      }
    },
    // 2. 用户定位核心逻辑
    locateUser(AMap) {
  const askAndLocate = () => {
    if (!navigator.geolocation) {
      this.locationStatus = '浏览器不支持定位功能，已显示默认位置'
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude
        const lat = pos.coords.latitude
        const currentPos = [lng, lat]
        // 仅移动地图中心，不添加任何标记
        this.map.setCenter(currentPos)
        this.locationStatus = ''
      },
      (err) => {
        console.error('定位失败：', err)
        const msg = err && err.message ? err.message : '未知错误'
        this.locationStatus = `定位失败：${msg}，已显示默认位置`
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (this.$confirm) {
    this.$confirm('允许页面获取位置信息以便定位并跳转地图？', '请求定位权限', {
      confirmButtonText: '允许',
      cancelButtonText: '拒绝',
      type: 'warning'
    }).then(() => {
      this.locationStatus = '正在获取位置...'
      askAndLocate()
    }).catch(() => {
      this.locationStatus = '已拒绝获取位置，显示默认位置'
    })
  } else {
    if (window.confirm('允许页面获取位置信息以便定位并跳转地图？')) {
      this.locationStatus = '正在获取位置...'
      askAndLocate()
    } else {
      this.locationStatus = '已拒绝获取位置，显示默认位置'
    }
  }
    },
    addMarkers(AMap) {
      if (!AMap) {
        console.error('AMap未定义，无法添加标记')
        return
      }
      
      this.markers.forEach(markerData => {
        // 只添加简化的圆点标记，移除文字标签以减少视觉干扰
        const pointMarker = new AMap.Marker({
          position: markerData.position,
          offset: new AMap.Pixel(-10, -10),
          icon: new AMap.Icon({
            size: new AMap.Size(20, 20),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
            imageOffset: new AMap.Pixel(0, 0)
          }),
          // 添加点击事件显示详细信息
          extData: markerData
        })
        
        // 点击标记时显示信息窗口
        pointMarker.on('click', () => {
          const content = `
            <div style="padding: 8px; font-size: 14px; min-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 8px;">${markerData.label}</div>
              <div>蜂箱ID: ${markerData.beehiveId}</div>
              <div>蜂场ID: ${markerData.apiaryId}</div>
              <div>状态: ${markerData.beehiveStatus || '未知'}</div>
              <div>坐标: [${markerData.position[0]}, ${markerData.position[1]}]</div>
            </div>
          `
          const infoWindow = new AMap.InfoWindow({
            content: content,
            offset: new AMap.Pixel(0, -30)
          })
          infoWindow.open(this.map, markerData.position)
        })
        
        this.map.add(pointMarker)
      })
    },
    async loadStats() {
      try {
        const response = await listBeehive({ pageNum: 1, pageSize: 1000 })
        const beehiveList = response.rows || []
        this.beehiveCount = beehiveList.length
        this.onlineBeehiveCount = beehiveList.filter(b => b.beehiveStatus === 1).length
        this.offlineBeehiveCount = beehiveList.filter(b => b.beehiveStatus === 0).length
        this.errorBeehiveCount = beehiveList.filter(b => b.beehiveStatus === 2).length
        this.beekeeperCount = 0
        this.temperatureAlertCount = 0
        this.humidityAlertCount = 0
        this.otherAlertCount = 0
        this.alertCount = this.temperatureAlertCount + this.humidityAlertCount + this.otherAlertCount
      } catch (error) {
        console.error('加载统计数据失败：', error)
      }
    },
    handleResize() {
      if (this.map) {
        this.map.resize()
      }
    }
  }
}
</script>

<style scoped>
.bee-info {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  position: relative;
  overflow: hidden;
}
.map-container {
  width: 100%;
  height: 100%;
  touch-action: none;
  overflow: hidden;
}
.map-container :deep(#amap-container) {
  touch-action: none !important;
  overflow: hidden !important;
}
.stats-container {
  position: absolute;
  bottom: 140px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  width: auto;
}
.stats-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.stats-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 12px 20px;
}
.stats-row:first-child .stats-card {
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 28px;
}
.stats-row:last-child .stats-card {
  min-width: 240px;
  padding: 18px 24px;
}
.stats-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  flex-shrink: 0;
}
.stats-icon svg {
  width: 30px;
  height: 30px;
  fill: #fff;
}
.beehive-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.beekeeper-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}
.stats-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stats-value {
  font-size: 34px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}
.stats-label {
  font-size: 17px;
  color: #666;
  white-space: nowrap;
}
.stats-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.stats-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.alert-badge {
  background: #f56c6c;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
.stats-card-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  gap: 12px;
}
.info-label {
  color: #666;
}
.info-value {
  color: #333;
  font-weight: 600;
}

@media (max-width: 768px) {
  .stats-container {
    bottom: 120px;
    left: 10px;
    right: 10px;
    transform: none;
  }
  .stats-card {
    padding: 14px 16px;
    gap: 10px;
  }
  .stats-row:first-child .stats-card {
    min-width: 170px;
    padding: 16px 20px;
  }
  .stats-row:last-child .stats-card {
    min-width: 190px;
  }
  .stats-value {
    font-size: 24px;
  }
  .stats-label {
    font-size: 13px;
  }
  .stats-card-title {
    font-size: 14px;
  }
  .info-item {
    font-size: 13px;
  }
}
</style>