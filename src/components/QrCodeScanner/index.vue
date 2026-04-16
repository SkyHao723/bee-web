<template>
  <div class="qrcode-scanner">
    <el-button type="primary" :icon="Camera" @click="openScanner">扫描二维码</el-button>

    <el-dialog
      v-model="dialogVisible"
      title="扫描二维码"
      :width="isMobile ? '90%' : '500px'"
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <div class="scanner-container">
        <div id="qr-reader" class="qr-reader"></div>
        <div v-if="scanError" class="scan-error">{{ scanError }}</div>
      </div>
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
      </template>
    </el-dialog>

    <!-- 扫描结果展示 -->
    <el-dialog
      v-model="resultDialogVisible"
      title="扫描结果"
      :width="isMobile ? '90%' : '400px'"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="二维码数据">{{ scanResult }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="resultDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="submitToBackend">提交到后端</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted, onUnmounted } from 'vue'
import { Camera } from '@element-plus/icons-vue'
import { Html5Qrcode } from 'html5-qrcode'
import { ElMessage } from 'element-plus'

const props = defineProps({
  // 扫描成功后是否自动提交到后端
  autoSubmit: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['scan-success', 'scan-error'])

// 响应式状态：是否为移动端视图
const isMobile = ref(false)
const MOBILE_BREAKPOINT = 768

/**
 * 检查屏幕宽度，判断是否为移动端
 */
function checkMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
}

/**
 * 窗口大小变化处理函数
 */
function handleResize() {
  checkMobile()
}

// 组件挂载时初始化并监听窗口变化
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const dialogVisible = ref(false)
const resultDialogVisible = ref(false)
const scanResult = ref('')
const scanError = ref('')

let html5QrCode = null
let isScanning = ref(false)

// 打开扫描器
const openScanner = () => {
  dialogVisible.value = true
  scanError.value = ''
  // 延迟初始化，确保DOM已渲染
  setTimeout(() => {
    initScanner()
  }, 100)
}

// 初始化扫描器
const initScanner = () => {
  if (html5QrCode) {
    return
  }

  try {
    html5QrCode = new Html5Qrcode('qr-reader')

    const config = {
      fps: 10,
      qrbox: {
        width: 250,
        height: 250
      },
      aspectRatio: 1.0
    }

    html5QrCode.start(
      { facingMode: 'environment' },
      config,
      onScanSuccess,
      onScanFailure
    ).then(() => {
      isScanning.value = true
    }).catch(err => {
      scanError.value = '无法启动摄像头: ' + err
      console.error('启动扫描失败:', err)
    })
  } catch (err) {
    scanError.value = '初始化扫描器失败: ' + err
    console.error('初始化失败:', err)
  }
}

// 扫描成功回调
const onScanSuccess = (decodedText, decodedResult) => {
  // 停止扫描
  stopScanner()

  scanResult.value = decodedText
  dialogVisible.value = false
  resultDialogVisible.value = true

  emit('scan-success', {
    data: decodedText,
    result: decodedResult
  })

  // 如果需要自动提交
  if (props.autoSubmit) {
    submitToBackend()
  }
}

// 扫描失败回调
const onScanFailure = (error) => {
  // 扫描失败是正常的，不需要显示错误
  // console.warn('Scan failed:', error)
}

// 停止扫描
const stopScanner = async () => {
  if (html5QrCode && isScanning.value) {
    try {
      await html5QrCode.stop()
      isScanning.value = false
    } catch (err) {
      // 忽略"scanner is not running"错误，这不影响功能
      if (!err.toString().includes('not running')) {
        console.error('停止扫描失败:', err)
      }
      isScanning.value = false
    }
  }
}

// 提交到后端
const submitToBackend = async () => {
  if (!scanResult.value) {
    ElMessage.warning('没有扫描数据')
    return
  }

  resultDialogVisible.value = false

  emit('submit-data', scanResult.value)

  // 提示用户数据已准备好，等待父组件处理
  ElMessage.success('二维码数据已获取，请继续操作')
}

// 关闭扫描器
const handleClose = () => {
  stopScanner()
  dialogVisible.value = false
}

// 清理资源
onBeforeUnmount(() => {
  if (html5QrCode && isScanning.value) {
    html5QrCode.stop().catch(err => console.error('清理扫描器失败:', err))
  }
})
</script>

<style scoped>
.qrcode-scanner {
  display: inline-block;
}

.scanner-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.qr-reader {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
  overflow: hidden;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .qr-reader {
    max-width: 100%;
  }
  
  /* 确保扫描框在移动端不会太大 */
  :deep(.html5-qrcode-element) {
    max-width: 100% !important;
  }
}

.scan-error {
  margin-top: 16px;
  color: #f56c6c;
  font-size: 14px;
  text-align: center;
  padding: 0 20px;
}
</style>