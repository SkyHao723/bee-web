import { ref, onMounted, onUnmounted, computed } from 'vue'

/**
 * 响应式弹窗宽度 Hook
 * 根据屏幕宽度自动调整弹窗宽度，确保移动端显示正常
 * 
 * @param {string} desktopWidth - PC端宽度，默认 '500px'
 * @param {string} mobileWidth - 移动端宽度，默认 '90%'
 * @param {number} breakpoint - 断点阈值，默认 768px
 * @returns {object} dialogWidth - 响应式宽度值
 */
export function useResponsiveDialog(desktopWidth = '500px', mobileWidth = '90%', breakpoint = 768) {
  const isMobile = ref(false)
  
  /**
   * 检查屏幕宽度，判断是否为移动端
   */
  function checkMobile() {
    isMobile.value = window.innerWidth < breakpoint
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
  
  // 计算响应式宽度
  const dialogWidth = computed(() => {
    return isMobile.value ? mobileWidth : desktopWidth
  })
  
  return {
    dialogWidth,
    isMobile
  }
}
