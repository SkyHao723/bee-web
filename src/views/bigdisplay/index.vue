<template>
  <div class="bee-info">
    <!-- 添加定位提示状态栏，可选 -->
    <div v-if="locationStatus" class="status-bar">
      <span>{{ locationStatus }}</span>
    </div>

    <div id="amap-container" class="map-container"></div>
    
    <!-- 温湿度统计图 -->
    <div class="chart-container">
      <div ref="chartRef" class="chart"></div>
    </div>
  </div>
</template>

<script lang="js">
// @ts-nocheck
import AMapLoader from '@amap/amap-jsapi-loader'
import * as echarts from 'echarts'
import { listTemperature } from '@/api/system/temperature'
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
      // ECharts实例
      chartInstance: null,
      // 查询参数
      queryParams: {
        apiaryId: 1,
        beehiveId: 1,
        pageNum: 1,
        pageSize: 10
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initMap()
      this.initChart()
      this.loadChartData()
      this.loadBeehiveMarkers()
    })
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    if (this.map) {
      this.map.destroy()
      this.map = null
    }
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
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
        
        // 如果有蜂箱数据，重新添加标记到地图
        if (this.map && this.markers.length > 0) {
          // 清除旧标记（如果有）
          this.map.clearMap()
          // 重新添加蜂场标记（如果需要保留的话）
          // this.addApiaryMarkers()
          // 添加蜂箱标记
          // 尝试从全局或 loader 获取 AMap 对象，因为这里不在 initMap 作用域内
          const AMap = window.AMap
          if (AMap) {
             this.addMarkers(AMap)
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
    handleResize() {
      if (this.map) {
        this.map.resize()
      }
      if (this.chartInstance) {
        this.chartInstance.resize()
      }
    },
    // 初始化ECharts图表
    initChart() {
      this.chartInstance = echarts.init(this.$refs.chartRef)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#999'
            }
          }
        },
        toolbox: {
          feature: {
            dataView: { show: true, readOnly: false },
            magicType: { show: true, type: ['line', 'bar'] },
            restore: { show: true },
            saveAsImage: { show: true }
          }
        },
        legend: {
          data: ['湿度', '温度']
        },
        xAxis: [
          {
            type: 'category',
            data: [],
            axisPointer: {
              type: 'shadow'
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '湿度',
            min: 0,
            max: 100,
            interval: 20,
            axisLabel: {
              formatter: '{value} %'
            }
          },
          {
            type: 'value',
            name: '温度',
            min: 0,
            max: 50,
            interval: 10,
            axisLabel: {
              formatter: '{value} °C'
            }
          }
        ],
        series: [
          {
            name: '湿度',
            type: 'line',
            yAxisIndex: 0,
            tooltip: {
              valueFormatter: function (value) {
                return value + ' %';
              }
            },
            data: []
          },
          {
            name: '温度',
            type: 'bar',
            yAxisIndex: 1,
            tooltip: {
              valueFormatter: function (value) {
                return value + ' °C';
              }
            },
            data: []
          }
        ]
      }
      this.chartInstance.setOption(option)
    },
    // 加载图表数据
    async loadChartData() {
      try {
        const response = await listTemperature(this.queryParams)
        const data = response.rows || []
        
        // 提取时间和数据
        const times = data.map(item => item.createTime || item.time)
        const humidity = data.map(item => parseFloat(item.humidity) || 0)
        const temperature = data.map(item => parseFloat(item.temperature) || 0)
        
        // 更新图表
        this.chartInstance.setOption({
          xAxis: [
            {
              data: times
            }
          ],
          series: [
            {
              data: humidity
            },
            {
              data: temperature
            }
          ]
        })
      } catch (error) {
        console.error('加载图表数据失败：', error)
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
.chart-container {
  flex-shrink: 0;
  height: 400px;
  padding: 20px;
  background-color: #fff;
  border-top: 1px solid #e6e6e6;
}
.chart {
  width: 100%;
  height: 100%;
}
</style>