<template>
  <router-view />
</template>

<script setup>
import useSettingsStore from '@/store/modules/settings'
import { handleThemeStyle } from '@/utils/theme'
import { watch } from 'vue'
import { usePreferredDark, useToggle } from '@vueuse/core'

const settingsStore = useSettingsStore()
const preferredDark = usePreferredDark()
const toggleDark = useToggle()

onMounted(() => {
  nextTick(() => {
    // 初始化主题样式
    handleThemeStyle(useSettingsStore().theme)
    
    // 如果开启了跟随系统主题，立即同步
    if (settingsStore.followSystemTheme) {
      settingsStore.syncWithSystemTheme()
    }
  })
})

// 监听系统主题变化
watch(preferredDark, (newValue) => {
  // 只有在开启跟随系统主题时才响应
  if (settingsStore.followSystemTheme) {
    if (newValue !== settingsStore.isDark) {
      settingsStore.isDark = newValue
      toggleDark(newValue)
    }
  }
})
</script>

