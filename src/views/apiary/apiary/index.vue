<template>
  <div class="app-container">
    <!-- PC端布局：左右分栏 -->
    <div v-if="!isMobile" class="desktop-layout">
      <!-- 左侧：搜索和操作区 -->
      <div class="left-panel">
        <el-form :model="queryParams" ref="queryRef" :inline="false" label-width="80px" class="search-form">
          <el-form-item label="蜂场名称" prop="apiaryName">
            <el-input
              v-model="queryParams.apiaryName"
              placeholder="请输入蜂场名称"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="联系人" prop="contactName">
            <el-input
              v-model="queryParams.contactName"
              placeholder="请输入联系人"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input
              v-model="queryParams.contactPhone"
              placeholder="请输入联系电话"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="蜂场地址" prop="apiaryAddress">
            <el-input
              v-model="queryParams.apiaryAddress"
              placeholder="请输入蜂场地址"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery" style="width: 100%">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery" style="width: 100%; margin-top: 8px">重置</el-button>
          </el-form-item>
        </el-form>

        <el-divider />

        <div class="action-buttons">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['apiary:apiary:add']"
            style="width: 100%; margin-bottom: 8px"
          >新增</el-button>
          <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['apiary:apiary:edit']"
            style="width: 100%; margin-bottom: 8px"
          >修改</el-button>
          <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['apiary:apiary:remove']"
            style="width: 100%; margin-bottom: 8px"
          >删除</el-button>
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['apiary:apiary:export']"
            style="width: 100%"
          >导出</el-button>
        </div>
      </div>

      <!-- 右侧：卡片列表 -->
      <div class="right-panel">
        <div v-loading="loading" class="card-list-container">
          <div v-if="apiaryList.length === 0" class="empty-state">
            <el-empty description="暂无数据" />
          </div>
          <el-card 
            v-for="item in apiaryList" 
            :key="item.apiaryId" 
            class="apiary-card"
            shadow="hover"
          >
            <template #header>
              <div class="card-header">
                <span class="card-title">{{ item.apiaryName }}</span>
              </div>
            </template>
            <div class="card-body">
              <div class="info-item">
                <span class="info-label">联系人：</span>
                <span class="info-value">{{ item.contactName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">联系电话：</span>
                <span class="info-value">{{ item.contactPhone }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">蜂场地址：</span>
                <span class="info-value">{{ item.apiaryAddress }}</span>
              </div>
            </div>
            <template #footer>
              <div class="card-footer">
                <el-button 
                  link 
                  type="primary" 
                  icon="Edit" 
                  @click="handleUpdate(item)" 
                  v-hasPermi="['apiary:apiary:edit']"
                >修改</el-button>
                <el-button 
                  link 
                  type="danger" 
                  icon="Delete" 
                  @click="handleDelete(item)" 
                  v-hasPermi="['apiary:apiary:remove']"
                >删除</el-button>
              </div>
            </template>
          </el-card>
        </div>
        
        <pagination
          v-show="total>0"
          :total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
          style="margin-top: 16px; text-align: right"
        />
      </div>
    </div>

    <!-- 移动端布局：上下结构 -->
    <div v-else class="mobile-layout">
      <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
        <el-form-item label="蜂场名称" prop="apiaryName">
          <el-input
            v-model="queryParams.apiaryName"
            placeholder="请输入蜂场名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName">
          <el-input
            v-model="queryParams.contactName"
            placeholder="请输入联系人"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input
            v-model="queryParams.contactPhone"
            placeholder="请输入联系电话"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="蜂场地址" prop="apiaryAddress">
          <el-input
            v-model="queryParams.apiaryAddress"
            placeholder="请输入蜂场地址"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5">
          <el-button
            type="primary"
            plain
            icon="Plus"
            @click="handleAdd"
            v-hasPermi="['apiary:apiary:add']"
          >新增</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="Edit"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['apiary:apiary:edit']"
          >修改</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="danger"
            plain
            icon="Delete"
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['apiary:apiary:remove']"
          >删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="warning"
            plain
            icon="Download"
            @click="handleExport"
            v-hasPermi="['apiary:apiary:export']"
          >导出</el-button>
        </el-col>
        <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
      </el-row>

      <div v-loading="loading" class="card-list-container">
        <div v-if="apiaryList.length === 0" class="empty-state">
          <el-empty description="暂无数据" />
        </div>
        <el-card 
          v-for="item in apiaryList" 
          :key="item.apiaryId" 
          class="apiary-card"
          shadow="hover"
        >
          <template #header>
            <div class="card-header">
              <span class="card-title">{{ item.apiaryName }}</span>
            </div>
          </template>
          <div class="card-body">
            <div class="info-item">
              <span class="info-label">联系人：</span>
              <span class="info-value">{{ item.contactName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">联系电话：</span>
              <span class="info-value">{{ item.contactPhone }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">蜂场地址：</span>
              <span class="info-value">{{ item.apiaryAddress }}</span>
            </div>
          </div>
          <template #footer>
            <div class="card-footer">
              <el-button 
                size="small"
                type="primary" 
                icon="Edit" 
                @click="handleUpdate(item)" 
                v-hasPermi="['apiary:apiary:edit']"
              >修改</el-button>
              <el-button 
                size="small"
                type="danger" 
                icon="Delete" 
                @click="handleDelete(item)" 
                v-hasPermi="['apiary:apiary:remove']"
              >删除</el-button>
            </div>
          </template>
        </el-card>
      </div>
      
      <pagination
        v-show="total>0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 添加或修改蜂厂管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="apiaryRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="蜂场名称" prop="apiaryName">
              <el-input v-model="form.apiaryName" placeholder="请输入蜂场名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="form.contactName" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="蜂场地址" prop="apiaryAddress">
              <el-input v-model="form.apiaryAddress" placeholder="请输入蜂场地址" />
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

<script setup name="Apiary">
import { listApiary, getApiary, delApiary, addApiary, updateApiary } from "@/api/apiary/apiary"
import { useWindowSize } from '@vueuse/core'

const { proxy } = getCurrentInstance()

// 响应式检测
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const apiaryList = ref([])
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
    apiaryName: null,
    contactName: null,
    contactPhone: null,
    apiaryAddress: null
  },
  rules: {
    apiaryName: [
      { required: true, message: "蜂场名称不能为空", trigger: "blur" }
    ],
    contactName: [
      { required: true, message: "联系人不能为空", trigger: "blur" }
    ],
    contactPhone: [
      { required: true, message: "联系电话不能为空", trigger: "blur" }
    ],
    apiaryAddress: [
      { required: true, message: "蜂场地址不能为空", trigger: "blur" }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询蜂厂管理列表 */
const getList = () => {
  loading.value = true
  listApiary(queryParams.value).then(response => {
    apiaryList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

/** 取消按钮操作 */
const cancel = () => {
  open.value = false
  reset()
}

/** 表单重置 */
const reset = () => {
  form.value = {}
  proxy.resetForm("apiaryRef")
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 多选框选中数据 */
const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.apiaryId)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加蜂厂管理"
}

/** 修改按钮操作 */
const handleUpdate = (row) => {
  reset()
  const apiaryId = row.apiaryId || ids.value
  getApiary(apiaryId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改蜂厂管理"
  })
}

/** 提交按钮 */
const submitForm = () => {
  proxy.$refs["apiaryRef"].validate(valid => {
    if (valid) {
      if (form.value.apiaryId) {
        updateApiary(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addApiary(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
const handleDelete = (row) => {
  const apiaryIds = row.apiaryId || ids.value
  proxy.$modal.confirm('是否确认删除蜂厂管理编号为"' + apiaryIds + '"的数据项？').then(function() {
    return delApiary(apiaryIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy.download('apiary/apiary/export', {
    ...queryParams.value
  }, `apiary_${new Date().getTime()}.xlsx`)
}

onMounted(() => {
  getList()
})

</script>

<style scoped lang="scss">
/* PC端左右分栏布局 */
.desktop-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 120px);
}

/* 左侧面板 */
.left-panel {
  width: 280px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow-y: auto;
  
  .search-form {
    :deep(.el-form-item) {
      margin-bottom: 16px;
      
      .el-form-item__label {
        font-weight: 500;
      }
    }
  }
  
  .action-buttons {
    margin-top: 16px;
  }
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 卡片列表容器 */
.card-list-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px 0;
  overflow-y: auto;
  flex: 1;
}

/* 蜂场卡片样式 */
.apiary-card {
  background: #fff;
  border-radius: 12px;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
  
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 2px solid #f0f0f0;
  }
  
  :deep(.el-card__body) {
    padding: 20px;
    flex: 1;
  }
  
  :deep(.el-card__footer) {
    padding: 12px 20px;
    border-top: 1px solid #f0f0f0;
  }
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  gap: 12px;
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
  min-width: 80px;
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
  
  .el-button {
    min-width: 70px;
    font-size: 14px;
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 0;
  grid-column: 1 / -1;
}

/* 移动端布局 */
.mobile-layout {
  .card-list-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px 0;
  }
  
  .apiary-card {
    &:active {
      transform: scale(0.98);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
    
    :deep(.el-card__header) {
      padding: 12px 16px;
    }
    
    :deep(.el-card__body) {
      padding: 16px;
    }
    
    :deep(.el-card__footer) {
      padding: 10px 16px;
    }
  }
  
  .card-title {
    font-size: 16px;
  }
  
  .info-item {
    font-size: 13px;
  }
  
  .info-label {
    min-width: 70px;
  }
  
  .card-footer {
    .el-button {
      min-width: 70px;
      min-height: 40px;
      font-size: 13px;
    }
  }
}

/* 深色模式适配 */
html.dark {
  .left-panel {
    background: var(--el-bg-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .apiary-card {
    background: var(--el-bg-color);
    border-color: var(--el-border-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    }
    
    :deep(.el-card__header),
    :deep(.el-card__footer) {
      border-color: var(--el-border-color);
    }
  }
  
  .card-header {
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
