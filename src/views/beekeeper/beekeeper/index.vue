<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户账号" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入用户账号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户昵称" prop="nickName">
        <el-input
          v-model="queryParams.nickName"
          placeholder="请输入用户昵称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号码" prop="phonenumber">
        <el-input
          v-model="queryParams.phonenumber"
          placeholder="请输入手机号码"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['beekeeper:beekeeper:add']"
        >新增</el-button>
      </el-col>
    </el-row>

    <!-- PC/平板端：表格视图 -->
    <el-table v-loading="loading" :data="beekeeperList" @selection-change="handleSelectionChange" v-if="!isMobile">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户账号" align="center" prop="userName" />
      <el-table-column label="用户昵称" align="center" prop="nickName" />
      <el-table-column label="手机号码" align="center" prop="phonenumber" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['beekeeper:beekeeper:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['beekeeper:beekeeper:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 移动端：卡片视图 -->
    <div v-else v-loading="loading" class="card-list-container">
      <div v-if="beekeeperList.length === 0" class="empty-state">
        <el-empty description="暂无数据" />
      </div>
      <div 
        v-for="item in beekeeperList" 
        :key="item.userId" 
        class="beekeeper-card"
      >
        <div class="card-header">
          <span class="card-title">{{ item.nickName }}</span>
        </div>
        
        <div class="card-body">
          <div class="info-item">
            <span class="info-label">用户账号：</span>
            <span class="info-value">{{ item.userName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号码：</span>
            <span class="info-value">{{ item.phonenumber || '-' }}</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button 
            type="primary" 
            size="default"
            icon="Edit" 
            @click="handleUpdate(item)" 
            v-hasPermi="['beekeeper:beekeeper:edit']"
          >修改</el-button>
          <el-button 
            type="danger" 
            size="default"
            icon="Delete" 
            @click="handleDelete(item)" 
            v-hasPermi="['beekeeper:beekeeper:remove']"
          >删除</el-button>
        </div>
      </div>
    </div>
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改蜂农信息对话框 -->
    <el-dialog :title="title" v-model="open" :width="dialogWidth" append-to-body>
      <el-form ref="beekeeperRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="用户账号" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户账号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入密码" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Beekeeper">
import { listBeekeeper, getBeekeeper, delBeekeeper, addBeekeeper, updateBeekeeper } from "@/api/beekeeper/beekeeper"
import { onMounted, onUnmounted } from "vue"

const { proxy } = getCurrentInstance()

// 响应式状态：是否为移动端视图
const isMobile = ref(false)
const MOBILE_BREAKPOINT = 768 // 移动端断点

/**
 * 检查屏幕宽度，判断是否为移动端
 */
function checkMobile() {
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
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

// 弹窗响应式宽度
const dialogWidth = computed(() => {
  return isMobile.value ? '90%' : '500px'
})

const beekeeperList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptId: null,
    apiaryId: null,
    userName: null,
    nickName: null,
    userType: null,
    email: null,
    phonenumber: null,
    sex: null,
    avatar: null,
    password: null,
    status: null,
    loginIp: null,
    loginDate: null,
    pwdUpdateDate: null,
  },
  rules: {
    apiaryId: [
      { required: true, message: "蜂场ID不能为空", trigger: "blur" }
    ],
    userName: [
      { required: true, message: "用户账号不能为空", trigger: "blur" }
    ],
    nickName: [
      { required: true, message: "用户昵称不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询蜂农信息列表 */
function getList() {
  loading.value = true
  listBeekeeper(queryParams.value).then(response => {
    beekeeperList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    userId: null,
    deptId: null,
    apiaryId: null,
    userName: null,
    nickName: null,
    userType: null,
    email: null,
    phonenumber: null,
    sex: null,
    avatar: null,
    password: null,
    status: null,
    delFlag: null,
    loginIp: null,
    loginDate: null,
    pwdUpdateDate: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null
  }
  proxy.resetForm("beekeeperRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.userId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加蜂农信息"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _userId = row.userId || ids.value
  getBeekeeper(_userId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改蜂农信息"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["beekeeperRef"].validate(valid => {
    if (valid) {
      if (form.value.userId != null) {
        updateBeekeeper(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addBeekeeper(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _userIds = row.userId || ids.value
  proxy.$modal.confirm('是否确认删除蜂农信息编号为"' + _userIds + '"的数据项？').then(function() {
    return delBeekeeper(_userIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('beekeeper/beekeeper/export', {
    ...queryParams.value
  }, `beekeeper_${new Date().getTime()}.xlsx`)
}

getList()
</script>

<style scoped lang="scss">
/* 移动端卡片列表容器 */
.card-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
  min-height: 200px;
}

/* 蜂农卡片样式 */
.beekeeper-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

/* 卡片内容区域 */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
  line-height: 1.6;
}

.info-label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  min-width: 70px;
  flex-shrink: 0;
}

.info-value {
  color: var(--el-text-color-primary);
  flex: 1;
  word-break: break-all;
}

/* 卡片底部操作区 */
.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  
  .el-button {
    min-width: 80px;
    min-height: 44px; /* 确保触控区域足够大 */
    font-size: 14px;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 0;
}

/* 深色模式适配 */
html.dark {
  .beekeeper-card {
    background: var(--el-bg-color);
    border-color: var(--el-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .card-header,
  .card-footer {
    border-color: var(--el-border-color);
  }
  
  .info-label {
    color: var(--el-text-color-secondary);
  }
  
  .info-value {
    color: var(--el-text-color-primary);
  }
}
</style>
