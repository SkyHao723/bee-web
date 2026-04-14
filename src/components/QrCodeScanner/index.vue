<template>
  <div class="qr-code-scanner">
    <el-button
      type="primary"
      plain
      icon="Camera"
      @click="openScanner"
    >扫码绑定</el-button>
    
    <el-button
      type="success"
      plain
      icon="Picture"
      @click="openImageScanner"
      style="margin-left: 10px;"
    >图片识别</el-button>

    <!-- 摄像头扫描对话框 -->
    <el-dialog
      v-model="scannerVisible"
      title="扫描二维码"
      width="500px"
      :close-on-click-modal="false"
      @close="stopScanner"
    >
      <div id="qr-reader" class="scanner-container"></div>
      <div class="scanner-tips">
        <p>请将二维码对准摄像头</p>
      </div>
      <template #footer>
        <el-button @click="closeScanner">取消</el-button>
      </template>
    </el-dialog>
    
    <!-- 图片识别对话框 -->
    <el-dialog
      v-model="imageScannerVisible"
      title="图片识别二维码"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="image-upload-container">
        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          action=""
          :auto-upload="false"
          :on-change="handleImageChange"
          :show-file-list="false"
          accept="image/*"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽图片到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 jpg/png/gif 格式,文件大小不超过 5MB
            </div>
          </template>
        </el-upload>
        
        <div v-if="previewImage" class="image-preview">
          <img :src="previewImage" alt="预览图" />
        </div>
      </div>
      
      <div v-if="scanResult" class="scan-result">
        <el-alert
          :title="'识别结果: ' + scanResult"
          type="success"
          :closable="false"
          show-icon
        />
      </div>
      
      <template #footer>
        <el-button @click="closeImageScanner">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmScanResult"
          :disabled="!scanResult"
        >确认绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const emit = defineEmits(['submit-data'])

const scannerVisible = ref(false)
const imageScannerVisible = ref(false)
const previewImage = ref('')
const scanResult = ref('')
let html5QrCode = null

/**
 * 打开摄像头扫描器
 */
function openScanner() {
  scannerVisible.value = true
  nextTick(() => {
    startScanner()
  })
}

/**
 * 打开图片识别器
 */
function openImageScanner() {
  imageScannerVisible.value = true
  previewImage.value = ''
  scanResult.value = ''
}

/**
 * 启动摄像头扫描器
 */
function startScanner() {
  const qrReaderElement = document.getElementById('qr-reader')
  if (!qrReaderElement) {
    console.error('未找到二维码扫描容器元素')
    return
  }

  html5QrCode = new Html5Qrcode('qr-reader')
  
  html5QrCode.start(
    { facingMode: 'environment' },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    (decodedText) => {
      // 扫描成功
      handleScanSuccess(decodedText)
    },
    (errorMessage) => {
      // 扫描失败(正常情况,持续扫描中)
      // console.log(errorMessage)
    }
  ).catch((err) => {
    console.error('启动扫描器失败:', err)
    ElMessage.error('无法启动摄像头,请检查权限设置')
    closeScanner()
  })
}

/**
 * 停止摄像头扫描器
 */
async function stopScanner() {
  if (html5QrCode) {
    try {
      await html5QrCode.stop()
      html5QrCode.clear()
      html5QrCode = null
    } catch (err) {
      console.error('停止扫描器失败:', err)
    }
  }
}

/**
 * 关闭摄像头扫描器
 */
async function closeScanner() {
  await stopScanner()
  scannerVisible.value = false
}

/**
 * 处理图片选择
 */
async function handleImageChange(file) {
  if (!file.raw) return
  
  // 验证文件大小 (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    ElMessage.warning('图片大小不能超过 5MB')
    return
  }
  
  // 创建预览
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
    
    // 开始识别
    recognizeQRCode(e.target.result)
  }
  reader.readAsDataURL(file.raw)
}

/**
 * 识别图片中的二维码
 */
async function recognizeQRCode(imageData) {
  try {
    // 使用一个唯一的 ID 或者虚拟 ID，因为 scanFileV2 不需要实际的 DOM 元素
    const html5QrCodeInstance = new Html5Qrcode('qr-reader-image-' + Date.now())
    const result = await html5QrCodeInstance.scanFileV2(imageData, false)
    
    if (result && result.decodedText) {
      scanResult.value = result.decodedText
      ElMessage.success('识别成功')
    } else {
      ElMessage.warning('未在图片中检测到二维码')
      scanResult.value = ''
    }
  } catch (err) {
    console.error('识别失败:', err)
    ElMessage.error('识别失败,请确保图片中包含清晰的二维码')
    scanResult.value = ''
  }
}

/**
 * 确认扫描结果并绑定
 */
function confirmScanResult() {
  if (!scanResult.value) {
    ElMessage.warning('请先识别有效的二维码')
    return
  }
  
  emit('submit-data', scanResult.value)
  closeImageScanner()
  ElMessage.success('绑定成功')
}

/**
 * 关闭图片识别器
 */
function closeImageScanner() {
  imageScannerVisible.value = false
  previewImage.value = ''
  scanResult.value = ''
}

/**
 * 处理摄像头扫描成功
 */
function handleScanSuccess(decodedText) {
  stopScanner()
  scannerVisible.value = false
  emit('submit-data', decodedText)
  ElMessage.success('扫描成功')
}

/**
 * 组件卸载时清理资源
 */
onUnmounted(() => {
  stopScanner()
})
</script>

<style scoped lang="scss">
.qr-code-scanner {
  display: inline-block;
}

.scanner-container {
  width: 100%;
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.scanner-tips {
  text-align: center;
  margin-top: 10px;
  color: #606266;
  
  p {
    margin: 0;
    font-size: 14px;
  }
}

.image-upload-container {
  .upload-demo {
    margin-bottom: 20px;
  }
  
  .image-preview {
    margin-top: 20px;
    text-align: center;
    
    img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

.scan-result {
  margin-top: 20px;
}
</style>
