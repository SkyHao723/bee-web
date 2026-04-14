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

    <el-table v-loading="loading" :data="equipmentList" @selection-change="handleSelectionChange">
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
    
    <pagination
      v-show="total>0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改设备管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
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
    <el-dialog title="设备二维码" v-model="qrCodeOpen" width="400px" append-to-body>
      <div style="text-align: center;">
        <img v-if="qrCodeLoadFail" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=error" style="width: 200px; height: 200px; opacity: 0.5;" />
        <img v-else :src="currentQrCodeImage" style="width: 200px; height: 200px;" @error="qrCodeLoadFail = true" />
        <div style="margin-top: 10px;">
          <p>设备编号: {{ currentEquipment.equipmentId }}</p>
          <p style="word-break: break-all; font-size: 12px; color: #999;">密文: {{ currentQrCode }}</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="copyQrCode">复制密文</el-button>
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

const { proxy } = getCurrentInstance()

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
