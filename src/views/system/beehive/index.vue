<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="蜂箱名称" prop="beehiveName">
        <el-input
          v-model="queryParams.beehiveName"
          placeholder="请输入蜂箱名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <span style="width: 8px; display: inline-block;"></span>
        <qr-code-scanner @submit-data="handleScanSubmit" />
      </el-form-item>
    </el-form>

    <!-- PC/平板端：表格视图 -->
    <el-table v-loading="loading" :data="beehiveList" @selection-change="handleSelectionChange" v-if="!isMobile">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="蜂箱ID" align="center" prop="beehiveId" />
      <el-table-column label="蜂厂" align="center" prop="apiaryName">
        <template #default="scope">
          {{ scope.row.apiaryName || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="蜂箱名称" align="center" prop="beehiveName" />
      <el-table-column label="蜂箱状态" align="center" prop="beehiveStatus">
        <template #default="scope">
          <el-tag v-if="scope.row.beehiveStatus === 0" type="info">未激活</el-tag>
          <el-tag v-else-if="scope.row.beehiveStatus === 1" type="success">已激活</el-tag>
          <el-tag v-else-if="scope.row.beehiveStatus === 2" type="danger">异常</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="蜂箱组" align="center" prop="beehiveGroup" />
      <el-table-column label="位置" align="center" prop="location" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:beehive:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:beehive:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 移动端：卡片视图 -->
    <div v-else v-loading="loading" class="card-list-container">
      <div v-if="beehiveList.length === 0" class="empty-state">
        <el-empty description="暂无数据" />
      </div>
      <div 
        v-for="item in beehiveList" 
        :key="item.beehiveId" 
        class="beehive-card"
      >
        <div class="card-header">
          <span class="card-title">{{ item.beehiveName }}</span>
          <el-tag 
            v-if="item.beehiveStatus === 0" 
            type="info" 
            size="small"
          >未激活</el-tag>
          <el-tag 
            v-else-if="item.beehiveStatus === 1" 
            type="success" 
            size="small"
          >已激活</el-tag>
          <el-tag 
            v-else-if="item.beehiveStatus === 2" 
            type="danger" 
            size="small"
          >异常</el-tag>
        </div>
        
        <div class="card-body">
          <div class="info-item">
            <span class="info-label">蜂箱ID：</span>
            <span class="info-value">{{ item.beehiveId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">蜂厂：</span>
            <span class="info-value">{{ item.apiaryName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">蜂箱组：</span>
            <span class="info-value">{{ item.beehiveGroup || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">位置：</span>
            <span class="info-value">{{ item.location || '-' }}</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button 
            type="primary" 
            size="default"
            icon="Edit" 
            @click="handleUpdate(item)" 
            v-hasPermi="['system:beehive:edit']"
          >修改</el-button>
          <el-button 
            type="danger" 
            size="default"
            icon="Delete" 
            @click="handleDelete(item)" 
            v-hasPermi="['system:beehive:remove']"
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

    <!-- 添加或修改蜂箱管理对话框 -->
    <el-dialog :title="title" v-model="open" :width="dialogWidth" append-to-body>
      <el-form ref="beehiveRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="蜂厂" prop="apiaryId">
              <el-select v-model="form.apiaryId" placeholder="请选择蜂厂" clearable>
                <el-option
                  v-for="item in apiaryOptions"
                  :key="item.apiaryId"
                  :label="item.apiaryName"
                  :value="item.apiaryId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="蜂箱名称" prop="beehiveName">
              <el-input v-model="form.beehiveName" placeholder="请输入蜂箱名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="蜂箱组" prop="beehiveGroup">
              <el-input v-model="form.beehiveGroup" placeholder="请输入蜂箱组" />
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

<script setup name="Beehive">
import { listBeehive, getBeehive, delBeehive, addBeehive, updateBeehive, bindBeehiveByQrCode, activateBeehive } from "@/api/system/beehive"
import { listApiary } from "@/api/apiary/apiary"
import QrCodeScanner from "@/components/QrCodeScanner"
import { nextTick, onMounted, onUnmounted } from "vue"

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

const beehiveList = ref([])
const apiaryOptions = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const scannedPower = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    beehiveId: null,
    apiaryId: null,
    beehiveName: null,
    beehiveStatus: null,
    beehiveGroup: null,
    location: null
  },
  rules: {
    beehiveName: [
      { required: true, message: "蜂箱名称不能为空", trigger: "blur" }
    ],
    apiaryId: [
      { required: true, message: "请选择蜂厂", trigger: "change" }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询蜂箱管理列表 */
function getList() {
  loading.value = true
  listBeehive(queryParams.value).then(response => {
    // 处理位置字段,去掉 "POINT()" 格式
    beehiveList.value = response.rows.map(item => {
      if (item.location && typeof item.location === 'string' && item.location.startsWith('POINT(')) {
        // 提取括号内的坐标值: "POINT(118.180149 39.63068)" -> "118.180149 39.63068"
        item.location = item.location.replace('POINT(', '').replace(')', '')
      }
      return item
    })
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
    beehiveId: null,
    apiaryId: null,
    beehiveName: null,
    beehiveStatus: null,
    beehiveGroup: null,
    location: null,
    power: null
  }
  proxy.resetForm("beehiveRef")
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
  ids.value = selection.map(item => item.beehiveId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  // 加载蜂厂下拉选项
  listApiary().then(res => {
    apiaryOptions.value = res.rows
    open.value = true
    title.value = "添加蜂箱管理"
  })
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _beehiveId = row.beehiveId || ids.value
  // 加载蜂厂下拉选项
  listApiary().then(res => {
    apiaryOptions.value = res.rows
    getBeehive(_beehiveId).then(response => {
      form.value = response.data
      open.value = true
      title.value = "修改蜂箱管理"
    })
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["beehiveRef"].validate(valid => {
    if (valid) {
      if (form.value.beehiveId != null) {
        updateBeehive(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        // 如果有power字段，使用activate接口激活蜂箱
        if (form.value.power) {
          activateBeehive(form.value).then(() => {
            proxy.$modal.msgSuccess("激活成功")
            open.value = false
            getList()
          })
        } else {
          addBeehive(form.value).then(() => {
            proxy.$modal.msgSuccess("新增成功")
            open.value = false
            getList()
          })
        }
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _beehiveIds = row.beehiveId || ids.value
  proxy.$modal.confirm('是否确认删除蜂箱管理编号为"' + _beehiveIds + '"的数据项？').then(function() {
    return delBeehive(_beehiveIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/beehive/export', {
    ...queryParams.value
  }, `beehive_${new Date().getTime()}.xlsx`)
}

/** 处理二维码扫描提交 */
function handleScanSubmit(qrCodeData) {
  // 显示确认对话框，让用户选择操作
  proxy.$modal.confirm('是否将此二维码绑定到蜂箱？二维码数据: ' + qrCodeData).then(() => {
    return bindBeehiveByQrCode(qrCodeData)
  }).then((response) => {
    // 绑定成功，打开添加弹窗
    reset()
    scannedPower.value = qrCodeData
    form.value.power = qrCodeData

    // 如果返回了设备信息，设置apiaryId
    if (response && response.data && response.data.apiaryId) {
      form.value.apiaryId = response.data.apiaryId
    }

    // 加载蜂厂下拉列表后打开弹窗
    listApiary().then(res => {
      apiaryOptions.value = res.rows

      nextTick(() => {
        open.value = true
        title.value = "绑定蜂箱"
      })
    })
  }).catch(() => {})
}

getList()
</script>

<style scoped lang="scss">
.button-group {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

/* 移动端卡片列表容器 */
.card-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
  min-height: 200px;
}

/* 蜂箱卡片样式 */
.beehive-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 12px;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.card-title {
  font-size: 16px;
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
  gap: 6px;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.4;
}

.info-label {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  min-width: 60px;
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
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  
  .el-button {
    min-width: 70px;
    min-height: 40px;
    font-size: 13px;
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
  .beehive-card {
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
