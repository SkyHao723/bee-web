<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="蜂场名字" prop="apiaryName">
        <el-input
          v-model="queryParams.apiaryName"
          placeholder="请输入蜂场名字"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="蜂场联系人" prop="contactName">
        <el-input
          v-model="queryParams.contactName"
          placeholder="请输入蜂场联系人"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="蜂场联系电话" prop="contactPhone">
        <el-input
          v-model="queryParams.contactPhone"
          placeholder="请输入蜂场联系电话"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="蜂场地址" prop="apiaryAddress">
        <el-input
          v-model="queryParams.apiaryAddress"
          placeholder="请输入蜂场地址"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['system:apiary:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:apiary:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:apiary:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:apiary:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="apiaryList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="蜂场id" align="center" prop="apiaryId" />
      <el-table-column label="蜂场名字" align="center" prop="apiaryName" />
      <el-table-column label="蜂场联系人" align="center" prop="contactName" />
      <el-table-column label="蜂场联系电话" align="center" prop="contactPhone" />
      <el-table-column label="蜂场地址" align="center" prop="apiaryAddress" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:apiary:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:apiary:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改【请填写功能名称】对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="蜂场名字" prop="apiaryName">
              <el-input v-model="form.apiaryName" placeholder="请输入蜂场名字" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="蜂场联系人" prop="contactName">
              <el-input v-model="form.contactName" placeholder="请输入蜂场联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="蜂场联系电话" prop="contactPhone">
              <el-input v-model="form.contactPhone" placeholder="请输入蜂场联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="蜂场地址" prop="apiaryAddress">
              <el-input v-model="form.apiaryAddress" placeholder="请输入蜂场地址" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listApiary, getApiary, delApiary, addApiary, updateApiary } from "@/api/system/apiary"

export default {
  name: "Apiary",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 【请填写功能名称】表格数据
      apiaryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        apiaryName: null,
        contactName: null,
        contactPhone: null,
        apiaryAddress: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        apiaryName: [
          { required: true, message: "蜂场名字不能为空", trigger: "blur" }
        ],
        contactName: [
          { required: true, message: "蜂场联系人不能为空", trigger: "blur" }
        ],
        contactPhone: [
          { required: true, message: "蜂场联系电话不能为空", trigger: "blur" }
        ],
        apiaryAddress: [
          { required: true, message: "蜂场地址不能为空", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询【请填写功能名称】列表 */
    getList() {
      this.loading = true
      listApiary(this.queryParams).then(response => {
        this.apiaryList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        apiaryId: null,
        apiaryName: null,
        contactName: null,
        contactPhone: null,
        apiaryAddress: null
      }
      this.resetForm("form")
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.apiaryId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加【请填写功能名称】"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const apiaryId = row.apiaryId || this.ids
      getApiary(apiaryId).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改【请填写功能名称】"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.apiaryId != null) {
            updateApiary(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addApiary(this.form).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const apiaryIds = row.apiaryId || this.ids
      this.$modal.confirm('是否确认删除【请填写功能名称】编号为"' + apiaryIds + '"的数据项？').then(function() {
        return delApiary(apiaryIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/apiary/export', {
        ...this.queryParams
      }, `apiary_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>
