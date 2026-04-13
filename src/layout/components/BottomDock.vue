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
          <el-icon class="nav-icon">
            <component :is="getIconComponent(item.icon)" />
          </el-icon>
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
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import useAppStore from '@/store/modules/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

// 获取设备类型
const device = computed(() => appStore.device)

// 菜单数据 - 从路由配置中动态获取有权限的菜单
const menuList = computed(() => {
  // 这里可以根据实际项目需求从 store 或路由配置中获取
  // 示例：写死几个常用菜单
  return [
    { path: '/index', title: '首页', icon: 'HomeFilled' },
    { path: '/beehive', title: '蜂箱', icon: 'Box' },
    { path: '/system/user', title: '用户', icon: 'User' },
    { path: '/bigdisplay', title: '大屏', icon: 'Monitor' }
  ]
})

// 获取图标组件
const getIconComponent = (iconName) => {
  return ElementPlusIconsVue[iconName] || ElementPlusIconsVue['Menu']
}

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
  max-width: 500px; // 限制大屏下的宽度
  height: 64px;
  background: $bg-glass;
  backdrop-filter: blur(20px); // 👈 从 15px 增加到 20px，增强毛玻璃效果以补偿透明度
  border: 1px solid rgba(255, 255, 255, 0.15); // 👈 从 0.2 改为 0.15，边框也更透明
  border-radius: 40px; // 圆润的边角
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
      height: 26px; // 稍微增加高度
      margin-bottom: 4px; // 👈 从 13px 改为 4px，图标下移，减小与文字间距
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      :deep(.el-icon) {
        font-size: 22px !important;
        line-height: 1 !important; // 👈 关键：消除图标行高
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        transform: translateX(6px); // 👈 向右微调 3px
      }

      .nav-icon {
        color: $text-dark; // 👈 使用深色，确保在透明背景下清晰可见
        transition: color 0.3s;
        filter: drop-shadow(0 1px 2px rgba(255, 255, 255, 0.8)); // 👈 添加白色阴影增强对比
      }

      .active-dot {
        position: absolute;
        bottom: -3px; // 👈 进一步下移到 -10px，远离文字
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
      font-size: 11px;
      font-weight: 600; // 👈 从 500 增加到 600，加粗文字
      color: $text-dark; // 👈 使用深色，确保在透明背景下清晰可见
      line-height: 1; // 确保文字行高一致，避免垂直偏移
      text-align: center; // 文字水平居中
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9); // 👈 添加白色阴影增强可读性
      transition: all 0.3s;
    }

    // 激活状态样式
    &.active {
      .icon-wrapper {
        transform: translateY(-2px) scale(1.1); // 激活时轻微上浮放大
        .nav-icon {
          color: $primary-color;
        }
        .active-dot {
          opacity: 1;
          transform: translateX(-50%) scale(1); // 保持水平居中 + 缩放显示
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
