import { computed } from 'vue'
import { usePreferredDark } from '@vueuse/core'
import useSettingsStore from '@/store/modules/settings'

/**
 * 未开启整站暗黑（html 非 .dark）时，左侧栏配色与 theme-dark / theme-light 类名
 * 跟随系统 prefers-color-scheme；整站暗黑时仍用 store 中的 sideTheme 与 CSS 变量。
 */
export function useSystemSidebarTheme() {
  const prefersDark = usePreferredDark()
  const settingsStore = useSettingsStore()

  const resolvedSideTheme = computed(() => {
    if (settingsStore.isDark) {
      return settingsStore.sideTheme
    }
    return prefersDark.value ? 'theme-dark' : 'theme-light'
  })

  const sidebarPrefersDark = computed(() => {
    if (settingsStore.isDark) return true
    return prefersDark.value
  })

  return { prefersDark, resolvedSideTheme, sidebarPrefersDark }
}
