<template>
  <div class="bee-info">
    <!-- 添加定位提示状态栏，可选 -->
    <div v-if="locationStatus" class="status-bar">
      <span>{{ locationStatus }}</span>
    </div>

    <div id="amap-container" class="map-container"></div>
  </div>
</template>

<script lang="js">
// @ts-nocheck
import AMapLoader from '@amap/amap-jsapi-loader'

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
      // 蜂场标记点数据
      markers: [
        { position: [118.359049,40.176274], label: '唐山市迁西县唐国权蜜蜂养殖场' },
      ]
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initMap()
    })
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    if (this.map) {
      this.map.destroy()
      this.map = null
    }
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
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
        })

        // 先添加蜂场标记点
        this.addMarkers(AMap)
        // 使用浏览器原生定位前先弹窗询问用户授权
        this.locateUser(AMap)
      } catch (error) {
        console.error('高德地图加载失败：', error)
        this.locationStatus = '地图加载失败，请检查网络和Key'
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
          extData: markerData.label
        })
        
        // 点击标记时显示信息窗口
        pointMarker.on('click', () => {
          const infoWindow = new AMap.InfoWindow({
            content: `<div style="padding: 8px; font-size: 14px;">${markerData.label}</div>`,
            offset: new AMap.Pixel(0, -30)
          })
          infoWindow.open(this.map, markerData.position)
        })
        
        this.map.add(pointMarker)
      })
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.status-bar {
  flex-shrink: 0;
  background-color: #f0f9eb;
  color: #67c23a;
  padding: 8px 16px;
  text-align: center;
  font-size: 14px;
  border-bottom: 1px solid #e6e6e6;
  z-index: 1;
}
.map-container {
  flex: 1;
  width: 100%;
  min-height: 0;
}
</style>