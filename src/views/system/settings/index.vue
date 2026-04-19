<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <svg-icon icon-class="theme" class="header-icon" />
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
          <el-menu-item index="/equipment">
            <svg-icon icon-class="monitor" class="menu-icon" />
            <span>设备管理</span>
          </el-menu-item>
          
          <el-menu-item index="/beekeeper">
            <svg-icon icon-class="user" class="menu-icon" />
            <span>蜂农管理</span>
          </el-menu-item>
        </el-menu>
      </div>
      
      <div class="logout-section">
        <el-button type="danger" class="logout-btn" @click="handleLogout">
          <svg-icon icon-class="exit-fullscreen" class="logout-icon" />
          <span>退出登录</span>
        </el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const handleMenuSelect = async (key) => {
  console.log('=== 开始跳转 ===')
  console.log('目标路径:', key)
  console.log('当前用户角色:', userStore.roles)
  console.log('已注册路由:', router.getRoutes().map(r => r.path))
  
  try {
    if (userStore.roles.length === 0) {
      console.log('用户信息未加载，开始获取...')
      await userStore.getInfo()
      console.log('用户信息已加载，角色:', userStore.roles)
      await permissionStore.generateRoutes()
      console.log('动态路由已生成')
    }
    
    const allRoutes = router.getRoutes()
    console.log('所有已注册路由:', allRoutes.map(r => ({ path: r.path, name: r.name })))
    
    const routeExists = allRoutes.some(r => 
      r.path === key || 
      (r.children && r.children.some(c => c.path === key))
    )
    
    console.log('路由是否存在:', routeExists)
    
    if (routeExists) {
      console.log('路由存在，准备跳转')
      router.push(key)
    } else {
      console.warn('路由不存在，尝试重新生成路由...')
      await permissionStore.generateRoutes()
      
      const routeExistsAfterReload = router.getRoutes().some(r => 
        r.path === key || 
        (r.children && r.children.some(c => c.path === key))
      )
      
      if (routeExistsAfterReload) {
        console.log('重新加载后路由存在，准备跳转')
        router.push(key)
      } else {
        console.error('路由仍然不存在，可能是权限问题')
        ElMessage.error('您没有访问该页面的权限，请联系管理员分配菜单权限')
      }
    }
  } catch (error) {
    console.error('跳转失败:', error)
    ElMessage.error('跳转失败，请重试')
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logOut().then(() => {
      ElMessage.success('退出登录成功')
      router.push('/login')
    }).catch(() => {
      ElMessage.error('退出登录失败')
    })
  }).catch(() => {
    // 用户取消
  })
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

.logout-section {
  margin-top: 30px;
  padding: 20px 0;
  border-top: 1px solid #eee;
}

.logout-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  letter-spacing: 4px;
}

.logout-icon {
  width: 18px;
  height: 18px;
}

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