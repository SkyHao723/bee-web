<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="蜂箱ID" prop="beehiveId">
        <el-input
          v-model="queryParams.beehiveId"
          placeholder="请输入蜂箱ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="蜂厂ID" prop="apiaryId">
        <el-input
          v-model="queryParams.apiaryId"
          placeholder="请输入蜂厂ID"
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
          v-hasPermi="['system:equipment:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:equipment:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:equipment:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['system:equipment:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- PC/平板端：表格视图 -->
    <el-table v-loading="loading" :data="equipmentList" @selection-change="handleSelectionChange" v-if="!isMobile">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="设备编号" align="center" prop="equipmentId" />
      <el-table-column label="蜂箱" align="center" prop="beehiveName">
        <template #default="scope">
          {{ scope.row.beehiveName || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="蜂厂" align="center" prop="apiaryName">
        <template #default="scope">
          {{ scope.row.apiaryName || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="设备状态" align="center" prop="deviceStatus">
        <template #default="scope">
          <el-tag v-if="scope.row.deviceStatus === 0" type="info">未激活</el-tag>
          <el-tag v-else-if="scope.row.deviceStatus === 1" type="success">已激活</el-tag>
          <el-tag v-else-if="scope.row.deviceStatus === 2" type="danger">异常</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="二维码" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="success" icon="Printer" @click="showQrCode(scope.row)" v-hasPermi="['system:equipment:query']">查看</el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:equipment:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['system:equipment:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 移动端：卡片视图 -->
    <div v-else v-loading="loading" class="card-list-container">
      <div v-if="equipmentList.length === 0" class="empty-state">
        <el-empty description="暂无数据" />
      </div>
      <div 
        v-for="item in equipmentList" 
        :key="item.equipmentId" 
        class="equipment-card"
      >
        <div class="card-header">
          <span class="card-title">{{ item.equipmentId }}</span>
          <el-tag 
            v-if="item.deviceStatus === 0" 
            type="info" 
            size="small"
          >未激活</el-tag>
          <el-tag 
            v-else-if="item.deviceStatus === 1" 
            type="success" 
            size="small"
          >已激活</el-tag>
          <el-tag 
            v-else-if="item.deviceStatus === 2" 
            type="danger" 
            size="small"
          >异常</el-tag>
        </div>
        
        <div class="card-body">
          <div class="info-item">
            <span class="info-label">蜂箱：</span>
            <span class="info-value">{{ item.beehiveName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">蜂厂：</span>
            <span class="info-value">{{ item.apiaryName || '-' }}</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button 
            type="success" 
            size="default"
            icon="Printer" 
            @click="showQrCode(item)" 
            v-hasPermi="['system:equipment:query']"
          >查看</el-button>
          <el-button 
            type="primary" 
            size="default"
            icon="Edit" 
            @click="handleUpdate(item)" 
            v-hasPermi="['system:equipment:edit']"
          >修改</el-button>
          <el-button 
            type="danger" 
            size="default"
            icon="Delete" 
            @click="handleDelete(item)" 
            v-hasPermi="['system:equipment:remove']"
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

    <!-- 添加或修改设备管理对话框 -->
    <el-dialog :title="title" v-model="open" :width="dialogWidth" append-to-body>
      <el-form ref="equipmentRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="设备说明">
              <el-input placeholder="添加设备自动生成二维码" disabled />
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

    <!-- 二维码查看对话框 -->
    <el-dialog title="设备二维码" v-model="qrCodeOpen" :width="qrDialogWidth" append-to-body>
      <div style="text-align: center;">
        <img v-if="qrCodeLoadFail" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=error" style="width: 200px; height: 200px; opacity: 0.5;" />
        <img v-else :src="currentQrCodeImage" style="width: 200px; height: 200px;" @error="qrCodeLoadFail = true" />
        <div style="margin-top: 10px;">
          <p>设备编号: {{ currentEquipment.equipmentId }}</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="qrCodeOpen = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Equipment">
import { listEquipment, getEquipment, delEquipment, addEquipment, updateEquipment } from "@/api/system/equipment"
import { listApiary } from "@/api/apiary/apiary"
import { Html5Qrcode } from "html5-qrcode"
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

const qrDialogWidth = computed(() => {
  return isMobile.value ? '90%' : '400px'
})

const equipmentList = ref([])
const apiaryOptions = ref([])
const open = ref(false)
const qrCodeOpen = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")
const currentQrCode = ref("")
const currentQrCodeImage = ref("")
const currentEquipment = ref({})
const qrCodeLoadFail = ref(false)

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    beehiveId: null,
    apiaryId: null,
    deviceStatus: null
  },
  rules: {
    apiaryId: [
      { required: true, message: "蜂厂ID不能为空", trigger: "blur" }
    ]
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询设备管理列表 */
function getList() {
  loading.value = true
  listEquipment(queryParams.value).then(response => {
    equipmentList.value = response.rows
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
    equipmentId: null,
    beehiveId: null,
    apiaryId: null,
    deviceStatus: 0
  }
  proxy.resetForm("equipmentRef")
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
  ids.value = selection.map(item => item.equipmentId)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  // 加载蜂厂下拉列表
  listApiary().then(res => {
    apiaryOptions.value = res.rows
  })
  open.value = true
  title.value = "添加设备管理"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _equipmentId = row.equipmentId || ids.value
  getEquipment(_equipmentId).then(response => {
    form.value = response.data
    // 加载蜂厂下拉列表
    listApiary().then(res => {
      apiaryOptions.value = res.rows
    })
    open.value = true
    title.value = "修改设备管理"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["equipmentRef"].validate(valid => {
    if (valid) {
      if (form.value.equipmentId != null) {
        updateEquipment(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addEquipment(form.value).then(() => {
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
  const _equipmentIds = row.equipmentId || ids.value
  proxy.$modal.confirm('是否确认删除设备管理编号为"' + _equipmentIds + '"的数据项？').then(function() {
    return delEquipment(_equipmentIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('system/equipment/export', {
    ...queryParams.value
  }, `equipment_${new Date().getTime()}.xlsx`)
}

// 查看二维码
function showQrCode(row) {
  currentEquipment.value = row
  // 密文：设备ID_固定密文
  const fixedSecret = "BEE_HIVE_SECRET_2026"
  const dataToHash = row.equipmentId + "_" + fixedSecret

  currentQrCode.value = dataToHash
  // 使用 goqr.me API 生成二维码
  currentQrCodeImage.value = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(dataToHash)
  qrCodeOpen.value = true
}

// 复制密文
function copyQrCode() {
  navigator.clipboard.writeText(currentQrCode.value).then(() => {
    proxy.$modal.msgSuccess("已复制到剪贴板")
  })
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

/* 设备卡片样式 */
.equipment-card {
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
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
  
  .el-button {
    min-width: 70px;
    min-height: 44px; /* 确保触控区域足够大 */
    font-size: 14px;
    flex: 1;
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
  .equipment-card {
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
