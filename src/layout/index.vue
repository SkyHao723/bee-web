<template>
  <div :class="classObj" class="app-wrapper" :style="{ '--current-color': theme, '--current-color-light': theme + '1a', '--current-color-dark-bg': theme + '33' }">
    <!-- 电脑端：显示侧边栏 + 主体内容 -->
    <template v-if="!isMobile">
      <div v-if="device === 'mobile' && sidebar.opened" class="drawer-bg" @click="handleClickOutside"/>
      <sidebar v-if="!sidebar.hide" class="sidebar-container" />
      <div :class="{ hasTagsView: needTagsView, sidebarHide: sidebar.hide }" class="main-container">
        <div :class="{ 'fixed-header': fixedHeader }">
          <navbar @setLayout="setLayout" />
          <tags-view v-if="needTagsView" />
        </div>
        <app-main />
        <settings ref="settingRef" />
      </div>
    </template>

    <!-- 移动端：只显示主体内容，底部显示 Dock 栏 -->
    <template v-else>
      <div class="mobile-layout-container">
        <navbar v-if="showMobileNavbar" class="mobile-navbar-fixed" />
        <div class="mobile-content-scrollable">
          <app-main />
        </div>
      </div>
      <bottom-dock />
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useDevice } from '@/composables/useDevice'
import Sidebar from './components/Sidebar/index.vue'
import { AppMain, Navbar, Settings, TagsView, BottomDock } from './components'
import useAppStore from '@/store/modules/app'
import useSettingsStore from '@/store/modules/settings'

const { isMobile } = useDevice()

const settingsStore = useSettingsStore()
const theme = computed(() => settingsStore.theme)
const sidebar = computed(() => useAppStore().sidebar)
const device = computed(() => useAppStore().device)
const needTagsView = computed(() => settingsStore.tagsView)
const fixedHeader = computed(() => settingsStore.fixedHeader)

// 可选：移动端是否显示顶部导航栏
const showMobileNavbar = computed(() => {
  // 可根据路由或配置决定是否显示，默认 true 以显示顶栏
  return true
})

// 动态绑定 class（保留原有样式逻辑）
const classObj = computed(() => ({
  hideSidebar: !sidebar.value.opened,
  openSidebar: sidebar.value.opened,
  withoutAnimation: sidebar.value.withoutAnimation,
  mobile: device.value === 'mobile'
}))

const { width, height } = useWindowSize()
const WIDTH = 992 // refer to Bootstrap's responsive design

watch(() => device.value, () => {
  if (device.value === 'mobile' && sidebar.value.opened) {
    useAppStore().closeSideBar({ withoutAnimation: false })
  }
})

watchEffect(() => {
  if (width.value - 1 < WIDTH) {
    useAppStore().toggleDevice('mobile')
    useAppStore().closeSideBar({ withoutAnimation: true })
  } else {
    useAppStore().toggleDevice('desktop')
  }
})

function handleClickOutside() {
  useAppStore().closeSideBar({ withoutAnimation: false })
}

const settingRef = ref(null)
function setLayout() {
  settingRef.value.openSetting()
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/mixin.scss" as mix;
@use "@/assets/styles/variables.module.scss" as vars;

.app-wrapper {
  @include mix.clearfix;
  position: relative;
  height: 100%;
  width: 100%;

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.main-container:has(.fixed-header) {
  height: 100vh;
  overflow: hidden;
}

// 移动端时为底部Dock留出空间
.mobile .main-container {
  padding-bottom: 60px;
}

// 移动端布局容器 - 使用 Flexbox 布局
.mobile-layout-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

// 移动端固定顶栏
.mobile-navbar-fixed {
  flex-shrink: 0; /* 防止被压缩 */
  position: sticky;
  top: 0;
  z-index: 10;
}

// 移动端可滚动内容区域
.mobile-content-scrollable {
  flex: 1; /* 占据剩余空间 */
  overflow-y: auto; /* 只有内容区域可滚动 */
  overflow-x: hidden;
  padding-bottom: 60px; /* 为底部 Dock 栏留出空间 */
  -webkit-overflow-scrolling: touch; /* iOS 平滑滚动 */
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{vars.$base-sidebar-width});
  transition: width 0.28s;
}

.hideSidebar .fixed-header {
  width: calc(100% - 54px);
}

.sidebarHide .fixed-header {
  width: 100%;
}

.mobile .fixed-header {
  width: 100%;
}
</style>
