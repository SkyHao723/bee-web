<!-- src/layout/components/BottomDock.vue -->
<template>
  <div class="footer-nav-container" v-if="device === 'mobile'">
    <div class="footer-nav">
      <div 
        v-for="item in menuList" 
        :key="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="navigate(item.path)"
      >
        <div class="icon-wrapper">
          <svg-icon :icon-class="item.icon" class="nav-icon" />
          <div class="active-dot"></div>
        </div>
        <span class="nav-text">{{ item.title }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import SvgIcon from '@/components/SvgIcon'
import useAppStore from '@/store/modules/app'
import usePermissionStore from '@/store/modules/permission'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

// 获取设备类型
const device = computed(() => appStore.device)

// 菜单数据 - 从 permissionStore 中动态获取侧边栏路由
const menuList = computed(() => {
  const routes = permissionStore.sidebarRouters || []
  const menus = []
  
  // 递归提取所有可见的叶子节点路由（最终可点击的菜单项）
  const extractVisibleRoutes = (routeList, parentPath = '') => {
    routeList.forEach(route => {
      // 跳过隐藏的菜单
      if (route.hidden) return
      
      // 如果有子路由
      if (route.children && route.children.length > 0) {
        // 如果只有一个子路由且不是 alwaysShow，直接使用子路由
        const visibleChildren = route.children.filter(child => !child.hidden)
        
        if (visibleChildren.length === 1 && !route.alwaysShow) {
          const child = visibleChildren[0]
          const fullPath = parentPath ? `${parentPath}/${child.path}` : (child.path.startsWith('/') ? child.path : `/${child.path}`)
          menus.push({
            path: fullPath,
            title: child.meta?.title || route.meta?.title || '未命名',
            icon: child.meta?.icon || route.meta?.icon || 'Menu'
          })
        } else {
          // 多个子路由或 alwaysShow，递归处理子路由
          const currentPath = parentPath ? `${parentPath}/${route.path}` : (route.path.startsWith('/') ? route.path : `/${route.path}`)
          extractVisibleRoutes(visibleChildren, currentPath)
        }
      } 
      // 没有子路由，直接添加
      else {
        const fullPath = parentPath ? `${parentPath}/${route.path}` : (route.path.startsWith('/') ? route.path : `/${route.path}`)
        menus.push({
          path: fullPath,
          title: route.meta?.title || '未命名',
          icon: route.meta?.icon || 'Menu'
        })
      }
    })
  }
  
  extractVisibleRoutes(routes)
  
  // 添加设置按钮
  const hasSetting = menus.some(item => item.path === '/system/settings/index')
  if (!hasSetting) {
    menus.push({
      path: '/system/settings/index',
      title: '设置',
      icon: 'setting'
    })
  }
  
  // 限制最多显示6个菜单项
  return menus.slice(0, 6)
})

// 判断是否激活
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// 导航
const navigate = (path) => {
  router.push(path)
}
</script>

<style lang="scss" scoped>
// 定义主题色变量
$primary-color: #007AFF; // 更现代的 iOS 风格蓝色
$text-gray: #64748b; // 👈 加深灰色，提高对比度
$text-dark: #1e293b; // 👈 深色文字，确保在透明背景下清晰可见
$bg-glass: rgba(255, 255, 255, 0.3); // 👈 从 0.6 改为 0.3，更加透明

.footer-nav-container {
  position: fixed;
  bottom: 20px; // 悬浮感：距离底部一段距离
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 1000;
  padding: 0 16px;
  // 适配 iOS 安全区域
  padding-bottom: env(safe-area-inset-bottom);
}

.footer-nav {
  display: flex;
  width: 100%;
  max-width: 550px; // 增加最大宽度以容纳6个按钮
  height: 56px; // 稍微降低高度以适应更多按钮
  background: $bg-glass;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    -webkit-tap-highlight-color: transparent;

    .icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 22px; // 稍微降低图标容器高度
      margin-bottom: 2px; // 减少图标与文字间距
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      :deep(.svg-icon) {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
        line-height: 1 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin-right: 0 !important;
        margin-left: 0;
      }

      .nav-icon {
        color: $text-dark;
        transition: color 0.3s;
        filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.8));
      }

      .active-dot {
        position: absolute;
        bottom: -2px;
        left: 50%;
        transform: translateX(-50%) scale(0);
        width: 4px;
        height: 4px;
        background: $primary-color;
        border-radius: 50%;
        opacity: 0;
        transition: all 0.3s ease;
      }
    }

    .nav-text {
      font-size: 9px; // 稍微减小文字大小
      font-weight: 600;
      color: $text-dark;
      line-height: 1;
      text-align: center;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
      transition: all 0.3s;
    }

    // 激活状态样式
    &.active {
      .icon-wrapper {
        transform: translateY(-2px) scale(1.1);
        .nav-icon {
          color: $primary-color;
        }
        .active-dot {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }
      }
      .nav-text {
        color: $primary-color;
        transform: scale(1.05);
      }
    }

    // 点击时的反馈效果
    &:active {
      opacity: 0.7;
      transform: scale(0.95);
    }
  }
}
</style>
