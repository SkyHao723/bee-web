<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <svg-icon icon-class="setting" class="header-icon" />
            <span>设置</span>
          </div>
        </div>
      </template>
      
      <div class="settings-menu">
        <el-menu
          :default-active="activeMenu"
          class="settings-menu-list"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/user/profile">
            <svg-icon icon-class="user" class="menu-icon" />
            <span>个人中心</span>
          </el-menu-item>
          
          <el-menu-item index="/system/equipment">
            <svg-icon icon-class="monitor" class="menu-icon" />
            <span>设备管理</span>
          </el-menu-item>
          
          <el-menu-item index="/beekeeper/beekeeper">
            <svg-icon icon-class="user" class="menu-icon" />
            <span>蜂农管理</span>
          </el-menu-item>
        </el-menu>
      </div>
    </el-card>
  </div>
</template>

<script setup name="Settings">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SvgIcon from '@/components/SvgIcon'
import usePermissionStore from '@/store/modules/permission'
import useUserStore from '@/store/modules/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const handleMenuSelect = async (key) => {
  console.log('跳转路径:', key)
  
  try {
    // 检查是否已加载路由
    if (userStore.roles.length === 0) {
      // 未加载用户信息，先加载
      await userStore.getInfo()
      await permissionStore.generateRoutes()
    }
    
    // 检查路由是否存在
    const routeExists = router.getRoutes().some(r => 
      r.path === key || 
      (r.children && r.children.some(c => c.path === key))
    )
    
    if (routeExists) {
      router.push(key)
    } else {
      // 路由不存在，重新加载路由
      await permissionStore.generateRoutes()
      router.push(key)
    }
  } catch (error) {
    console.error('跳转失败:', error)
    ElMessage.error('跳转失败，请重试')
  }
}

onMounted(() => {
  console.log('设置页面加载')
  console.log('当前路径:', route.path)
  console.log('已加载路由:', router.getRoutes().map(r => r.path))
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  
  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .header-icon {
    width: 20px;
    height: 20px;
    fill: #007AFF;
  }
}

.settings-menu {
  margin-top: 20px;
}

.settings-menu-list {
  border: none;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 8px;
}

.settings-menu-list :deep(.el-menu-item) {
  margin: 4px 0;
  border-radius: 6px;
  height: 48px;
  line-height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #333;
  transition: all 0.3s;
}

.settings-menu-list :deep(.el-menu-item:hover) {
  background: rgba(0, 122, 255, 0.05);
  color: #333;
}

.settings-menu-list :deep(.el-menu-item.is-active) {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.menu-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-menu-list {
    display: flex;
    overflow-x: auto;
    min-height: auto;
    padding: 8px 12px;
  }
  
  .settings-menu-list :deep(.el-menu-item) {
    min-width: 100px;
    justify-content: center;
  }
}
</style>