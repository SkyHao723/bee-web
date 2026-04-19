import defaultSettings from '@/settings'
import { useDark, useToggle, usePreferredDark } from '@vueuse/core'
import { useDynamicTitle } from '@/utils/dynamicTitle'

const isDark = useDark()
const toggleDark = useToggle(isDark)
const preferredDark = usePreferredDark()

const { sideTheme, showSettings, navType, tagsView, tagsViewPersist, tagsIcon, fixedHeader, sidebarLogo, dynamicTitle, footerVisible, footerContent } = defaultSettings

const storageSetting = JSON.parse(localStorage.getItem('layout-setting')) || ''

const useSettingsStore = defineStore(
  'settings',
  {
    state: () => ({
      title: '',
      theme: storageSetting.theme || '#409EFF',
      sideTheme: storageSetting.sideTheme || sideTheme,
      showSettings: showSettings,
      navType: storageSetting.navType === undefined ? navType : storageSetting.navType,
      tagsView: storageSetting.tagsView === undefined ? tagsView : storageSetting.tagsView,
      tagsViewPersist: storageSetting.tagsViewPersist === undefined ? tagsViewPersist : storageSetting.tagsViewPersist,
      tagsIcon: storageSetting.tagsIcon === undefined ? tagsIcon : storageSetting.tagsIcon,
      fixedHeader: storageSetting.fixedHeader === undefined ? fixedHeader : storageSetting.fixedHeader,
      sidebarLogo: storageSetting.sidebarLogo === undefined ? sidebarLogo : storageSetting.sidebarLogo,
      dynamicTitle: storageSetting.dynamicTitle === undefined ? dynamicTitle : storageSetting.dynamicTitle,
      footerVisible: storageSetting.footerVisible === undefined ? footerVisible : storageSetting.footerVisible,
      footerContent: footerContent,
      isDark: isDark.value,
      // 是否跟随系统主题
      followSystemTheme: storageSetting.followSystemTheme !== undefined ? storageSetting.followSystemTheme : false
    }),
    actions: {
      // 修改布局设置
      changeSetting(data) {
        const { key, value } = data
        if (this.hasOwnProperty(key)) {
          this[key] = value
        }
      },
      // 设置网页标题
      setTitle(title) {
        this.title = title
        useDynamicTitle()
      },
      // 切换暗黑模式
      toggleTheme() {
        this.isDark = !this.isDark
        toggleDark()
      },
      // 切换跟随系统主题
      toggleFollowSystemTheme() {
        this.followSystemTheme = !this.followSystemTheme
        if (this.followSystemTheme) {
          // 开启跟随系统时，立即同步系统当前状态
          this.syncWithSystemTheme()
        }
      },
      // 同步系统主题
      syncWithSystemTheme() {
        if (preferredDark.value !== this.isDark) {
          this.isDark = preferredDark.value
          toggleDark(preferredDark.value)
        }
      }
    }
  })

export default useSettingsStore
