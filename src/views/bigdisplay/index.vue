<template>
  <div class="bee-info" @wheel.capture.prevent="onWheelCapture">
    <div id="amap-container" ref="mapContainer" class="map-container"></div>

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
      <div class="stats-row-full">
        <div class="stats-card stats-card-wide">
          <div class="stats-card-header">
            <span class="stats-card-title">蜂箱信息</span>
          </div>
          <div class="stats-card-content">
            <div class="info-item"><span class="info-label">在线蜂箱：</span><span class="info-value">{{ onlineBeehiveCount }}</span></div>
            <div class="info-item"><span class="info-label">离线蜂箱：</span><span class="info-value">{{ offlineBeehiveCount }}</span></div>
            <div class="info-item"><span class="info-label">异常蜂箱：</span><span class="info-value">{{ errorBeehiveCount }}</span></div>
          </div>
        </div>
      </div>
      <div class="stats-row-full">
        <div class="stats-card stats-card-wide">
          <div class="stats-card-header">
            <span class="stats-card-title">预警信息</span>
            <span class="alert-badge" v-if="alertCount > 0">{{ alertCount }}</span>
          </div>
          <div class="stats-card-content">
            <div class="info-item"><span class="info-label">温度预警：</span><span class="info-value">{{ temperatureAlertCount }}</span></div>
            <div class="info-item"><span class="info-label">湿度预警：</span><span class="info-value">{{ humidityAlertCount }}</span></div>
            <div class="info-item"><span class="info-label">其他预警：</span><span class="info-value">{{ otherAlertCount }}</span></div>
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
      /** @type {HTMLElement[]} */
      scrollLockHosts: []
    }
  },
  mounted() {
    // 设置body和html的overflow: hidden，禁止页面滚动
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    this.$nextTick(() => {
      this.lockHostScroll()
      this.syncBeeFarmLayout()
      this.attachLayoutObserver()
      if (this.$el && this.$el.closest('.mobile-content-scrollable')) {
        this.attachVisualViewportListeners()
      }
      this.initMapAndLoadMarkers()
      this.loadStats()
    })
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    this.detachVisualViewportListeners()
    this.detachLayoutObserver()
    this.clearBeeFarmLayout()
    if (this.map) {
      this.map.destroy()
      this.map = null
    }
    window.removeEventListener('resize', this.handleResize)
    this.unlockHostScroll()
    // 恢复body和html的overflow
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  },
  methods: {
    handleResize() {
      this.syncBeeFarmLayout()
    },
    async loadStats() {
      try {
        const beehiveRes = await listBeehive({ pageNum: 1, pageSize: 1000 })
        const beehiveList = beehiveRes.rows || []
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
    /**
     * 桌面：与 .app-main 可视矩形对齐（侧栏、顶栏）。
     * 移动：铺满整个可视视口（含 Dock 下方与安全区），避免底部黑条；Dock z-index 更高叠在地图上。
     */
    syncBeeFarmLayout() {
      const el = this.$el
      if (!el || typeof el.getBoundingClientRect !== 'function') return
      const round = (n) => Math.max(0, Math.round(n * 100) / 100)
      const hostMobile = el.closest('.mobile-content-scrollable')
      const hostAppMain = el.closest('.app-main')

      el.style.position = 'fixed'
      el.style.right = 'auto'
      el.style.bottom = 'auto'
      el.style.zIndex = '8'

      if (hostMobile) {
        const vv = window.visualViewport
        if (vv) {
          el.style.left = `${round(vv.offsetLeft)}px`
          el.style.top = `${round(vv.offsetTop)}px`
          el.style.width = `${round(vv.width)}px`
          el.style.height = `${round(vv.height)}px`
        } else {
          el.style.left = '0px'
          el.style.top = '0px'
          el.style.width = `${round(window.innerWidth)}px`
          el.style.height = `${round(window.innerHeight)}px`
        }
      } else if (hostAppMain) {
        const r = hostAppMain.getBoundingClientRect()
        el.style.left = `${round(r.left)}px`
        el.style.top = `${round(r.top)}px`
        el.style.width = `${round(r.width)}px`
        el.style.height = `${round(r.height)}px`
      } else {
        return
      }

      this.$nextTick(() => {
        if (this.map) {
          this.map.resize()
        }
      })
    },
    clearBeeFarmLayout() {
      const el = this.$el
      if (!el) return
      el.style.position = ''
      el.style.left = ''
      el.style.top = ''
      el.style.width = ''
      el.style.height = ''
      el.style.right = ''
      el.style.bottom = ''
      el.style.zIndex = ''
    },
    attachLayoutObserver() {
      this.detachLayoutObserver()
      const el = this.$el
      if (!el || typeof ResizeObserver === 'undefined') return
      const hostAppMain = el.closest('.app-main')
      const hostMobile = el.closest('.mobile-content-scrollable')
      this._layoutResizeObserver = new ResizeObserver(() => {
        this.syncBeeFarmLayout()
      })
      if (hostAppMain) {
        this._layoutResizeObserver.observe(hostAppMain)
      } else if (hostMobile) {
        this._layoutResizeObserver.observe(document.documentElement)
      } else {
        this._layoutResizeObserver.disconnect()
        this._layoutResizeObserver = null
      }
    },
    detachLayoutObserver() {
      if (this._layoutResizeObserver) {
        this._layoutResizeObserver.disconnect()
        this._layoutResizeObserver = null
      }
    },
    attachVisualViewportListeners() {
      this.detachVisualViewportListeners()
      const vv = window.visualViewport
      if (!vv) return
      this._onVisualViewport = () => {
        this.syncBeeFarmLayout()
      }
      vv.addEventListener('resize', this._onVisualViewport)
      vv.addEventListener('scroll', this._onVisualViewport)
    },
    detachVisualViewportListeners() {
      const vv = window.visualViewport
      if (vv && this._onVisualViewport) {
        vv.removeEventListener('resize', this._onVisualViewport)
        vv.removeEventListener('scroll', this._onVisualViewport)
        this._onVisualViewport = null
      }
    },
    lockHostScroll() {
      this.unlockHostScroll()
      let el = this.$el && this.$el.parentElement
      while (el) {
        const cls = el.classList
        if (cls && (cls.contains('app-main') || cls.contains('mobile-content-scrollable'))) {
          cls.add('bee-farm-scroll-lock')
          this.scrollLockHosts.push(el)
        }
        el = el.parentElement
      }
    },
    unlockHostScroll() {
      if (this.scrollLockHosts && this.scrollLockHosts.length) {
        this.scrollLockHosts.forEach((host) => {
          host.classList.remove('bee-farm-scroll-lock')
        })
        this.scrollLockHosts = []
      }
    },
    /** 禁止整页滚动；浮层上滚轮仍用于缩放地图（地图区域由高德自行处理） */
    onWheelCapture(e) {
      e.preventDefault()
      if (!this.map) return
      const mapEl = this.$refs.mapContainer
      if (mapEl && mapEl.contains && mapEl.contains(e.target)) {
        return
      }
      if (e.deltaY < 0) {
        this.map.zoomIn()
      } else if (e.deltaY > 0) {
        this.map.zoomOut()
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
          zoomEnable: true,
          touchZoom: true,
          doubleClickZoom: false,
          scrollWheel: true,
          showLabel: false,
          keyboardEnable: false,
          animateEnable: false,
          isHotspot: false
        })

        this.map.getContainer().style.touchAction = 'none'
        this.map.getContainer().style.overflow = 'hidden'

        this.syncBeeFarmLayout()

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
    }
  }
}
</script>

<style scoped>
.bee-info {
  /* 具体 left/top/width/height 由 syncBeeFarmLayout 按主内容区视口矩形写入，避免与顶栏/页脚/侧栏错位 */
  position: fixed;
  z-index: 8;
  margin: 0;
  padding: 0;
  overflow: hidden;
  overscroll-behavior: none;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.bee-info::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}
.map-container {
  width: 100%;
  height: 100%;
  touch-action: none;
  overflow: hidden;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.map-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}
.map-container :deep(#amap-container) {
  touch-action: none !important;
  overflow: hidden !important;
}

/* 统计卡片容器 - PC端右侧垂直居中 */
.stats-container {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
  width: 320px;
}

/* 第一行：两个卡片并排 */
.stats-row {
  display: flex;
  gap: 12px;
}

/* 后面两行：通栏卡片 */
.stats-row-full {
  width: 100%;
}

/* 卡片通用样式 */
.stats-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  padding: 16px;
}

/* 顶部两个卡片样式 - 带图标和数字 */
.stats-row .stats-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.stats-icon svg {
  width: 28px;
  height: 28px;
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
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.stats-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

/* 通栏卡片样式 */
.stats-card-wide {
  width: 100%;
}

.stats-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
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
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  gap: 12px;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  font-weight: 600;
}

/* 移动端布局 - 底部居中 */
@media (max-width: 768px) {
  .stats-container {
    right: auto;
    left: 50%;
    top: auto;
    bottom: 90px;
    transform: translateX(-50%);
    width: calc(100% - 32px);
    max-width: 400px;
  }

  .stats-row {
    flex-direction: row;
  }

  .stats-value {
    font-size: 24px;
  }

  .stats-label {
    font-size: 12px;
  }

  .stats-card {
    padding: 12px;
  }

  .stats-icon {
    width: 40px;
    height: 40px;
  }

  .stats-icon svg {
    width: 24px;
    height: 24px;
  }
}
</style>

<style lang="scss">
/* 由页面 mounted 给 .app-main / .mobile-content-scrollable 打上 bee-farm-scroll-lock，去掉主区域滚动条 */
.app-main.bee-farm-scroll-lock,
.mobile-content-scrollable.bee-farm-scroll-lock {
  overflow: hidden !important;
  overflow-y: hidden !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.app-main.bee-farm-scroll-lock::-webkit-scrollbar,
.mobile-content-scrollable.bee-farm-scroll-lock::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 页脚占位会让主区域变矮；地图全屏时去掉底部留白（版权条仍为 fixed 叠在地图上） */
.app-main.bee-farm-scroll-lock:has(.bee-info) {
  padding-bottom: 0 !important;
}
</style>