<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="对应的蜂场ID" prop="apiaryId">
        <el-input
          v-model="queryParams.apiaryId"
          placeholder="请输入对应的蜂场ID"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="蜂箱名称" prop="beehiveName">
        <el-input
          v-model="queryParams.beehiveName"
          placeholder="请输入蜂箱名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="蜂箱组" prop="beehiveGroup">
        <el-input
          v-model="queryParams.beehiveGroup"
          placeholder="请输入蜂箱组"
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
          v-hasPermi="['beehive:beehive:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['beehive:beehive:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['beehive:beehive:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['beehive:beehive:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="beehiveList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="蜂箱ID" align="center" prop="beehiveId" />
      <el-table-column label="对应的蜂场ID" align="center" prop="apiaryId" />
      <el-table-column label="蜂箱名称" align="center" prop="beehiveName" />
      <el-table-column label="蜂箱状态" align="center" prop="beehiveStatus" />
      <el-table-column label="蜂箱组" align="center" prop="beehiveGroup" />
      <el-table-column label="${comment}" align="center" prop="location" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['beehive:beehive:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['beehive:beehive:remove']">删除</el-button>
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

    <!-- 添加或修改蜂箱管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="beehiveRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="对应的蜂场ID" prop="apiaryId">
              <el-input v-model="form.apiaryId" placeholder="请输入对应的蜂场ID" />
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
import { listBeehive, getBeehive, delBeehive, addBeehive, updateBeehive } from "@/api/beehive/beehive"

const { proxy } = getCurrentInstance()

const beehiveList = ref([])
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
    apiaryId: null,
    beehiveName: null,
    beehiveStatus: null,
    beehiveGroup: null,
    location: null
  },
  rules: {
    apiaryId: [
      { required: true, message: "对应的蜂场ID不能为空", trigger: "blur" }
    ],
    beehiveName: [
      { required: true, message: "蜂箱名称不能为空", trigger: "blur" }
    ],
    beehiveStatus: [
      { required: true, message: "蜂箱状态不能为空", trigger: "change" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询蜂箱管理列表 */
function getList() {
  loading.value = true
  listBeehive(queryParams.value).then(response => {
    beehiveList.value = response.rows
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
    location: null
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
  open.value = true
  title.value = "添加蜂箱管理"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _beehiveId = row.beehiveId || ids.value
  getBeehive(_beehiveId).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改蜂箱管理"
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
        addBeehive(form.value).then(() => {
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
  proxy.download('beehive/beehive/export', {
    ...queryParams.value
  }, `beehive_${new Date().getTime()}.xlsx`)
}

getList()
</script>
