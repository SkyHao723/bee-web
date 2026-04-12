<template>
  <div class="app-container tree-sidebar-manage-wrap">
    <!-- 左侧蜂场列表 -->
    <div class="apiary-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 展开/收起按钮 -->
      <div class="collapse-button-container">
        <el-tooltip :content="sidebarCollapsed ? '展开' : '收起'" placement="right">
          <i class="collapse-button"
             :class="sidebarCollapsed ? 'el-icon-d-arrow-right' : 'el-icon-d-arrow-left'"
             @click="toggleSidebar" />
        </el-tooltip>
      </div>

      <div class="sidebar-header" v-show="!sidebarCollapsed">
        <span class="sidebar-title">
          <i class="el-icon-s-home"></i> 蜂场列表
        </span>
        <div class="sidebar-actions">
          <el-tooltip content="刷新" placement="right">
            <i class="action-icon el-icon-refresh" @click="loadApiaryList" />
          </el-tooltip>
        </div>
      </div>

      <div class="sidebar-content" v-show="!sidebarCollapsed">
        <div
          v-for="(item, index) in apiaryListWithAll"
          :key="item.apiaryId || 'all'"
          class="apiary-item"
          :class="{ active: selectedApiaryId === item.apiaryId }"
          @click="handleApiaryClick(item)"
        >
          <i :class="index === 0 ? 'el-icon-menu' : 'el-icon-office-building'" class="apiary-icon" />
          <span class="apiary-name" :title="item.apiaryName">{{ item.apiaryName }}</span>
        </div>
      </div>
    </div>

    <div class="tree-sidebar-content">
      <div class="content-inner">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
          <el-form-item label="用户名称" prop="userName">
            <el-input v-model="queryParams.userName" placeholder="请输入用户名称" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="手机号码" prop="phonenumber">
            <el-input v-model="queryParams.phonenumber" placeholder="请输入手机号码" clearable style="width: 240px" @keyup.enter.native="handleQuery" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="用户状态" clearable style="width: 240px">
              <el-option v-for="dict in dict.type.sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker v-model="dateRange" style="width: 240px" value-format="yyyy-MM-dd" type="daterange" range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期"></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleAdd" v-hasPermi="['system:user:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate" v-hasPermi="['system:user:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete" v-hasPermi="['system:user:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="info" plain icon="el-icon-upload2" size="mini" @click="handleImport" v-hasPermi="['system:user:import']">导入</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="el-icon-download" size="mini" @click="handleExport" v-hasPermi="['system:user:export']">导出</el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="用户名称" align="center" key="userName" v-if="columns.userName.visible" :show-overflow-tooltip="true">
            <template slot-scope="scope">
              {{ scope.row.userName }}
            </template>
          </el-table-column>
          <el-table-column label="用户昵称" align="center" key="nickName" prop="nickName" v-if="columns.nickName.visible" :show-overflow-tooltip="true" />
          <el-table-column label="手机号码" align="center" key="phonenumber" prop="phonenumber" v-if="columns.phonenumber.visible" width="120" />
          <el-table-column label="状态" align="center" key="status" v-if="columns.status.visible">
            <template slot-scope="scope">
              <el-switch v-model="scope.row.status" active-value="0" inactive-value="1" @change="handleStatusChange(scope.row)"></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" align="center" prop="createTime" v-if="columns.createTime.visible" width="160">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
            <template slot-scope="scope" v-if="scope.row.userId !== 1">
              <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['system:user:edit']">修改</el-button>
              <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['system:user:remove']">删除</el-button>
              <el-dropdown size="mini" @command="(command) => handleCommand(command, scope.row)" v-hasPermi="['system:user:resetPwd', 'system:user:edit']">
                <el-button size="mini" type="text" icon="el-icon-d-arrow-right">更多</el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="handleResetPwd" icon="el-icon-key" v-hasPermi="['system:user:resetPwd']">重置密码</el-dropdown-item>
                  <el-dropdown-item command="handleAuthRole" icon="el-icon-circle-check" v-hasPermi="['system:user:edit']">分配角色</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />
      </div>
    </div>

    <!-- 添加或修改用户配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="form.userId == undefined">
          <el-col :span="24">
            <el-form-item label="所属蜂场" prop="apiaryId">
              <el-select v-model="form.apiaryId" placeholder="请选择所属蜂场" style="width: 100%">
                <el-option 
                  v-for="item in apiaryList" 
                  :key="item.apiaryId" 
                  :label="item.apiaryName" 
                  :value="item.apiaryId">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 用户导入对话框 -->
    <excel-import-dialog ref="importUserRef" title="用户导入" action="/system/user/importData" template-action="/system/user/importTemplate" template-file-name="user_template" update-support-label="是否更新已经存在的用户数据" @success="getList" />
  </div>
</template>

<script>
import { listUser, getUser, delUser, addUser, updateUser, resetUserPwd, changeUserStatus } from "@/api/system/user"
import { listApiary } from "@/api/system/apiary"
import ExcelImportDialog from "@/components/ExcelImportDialog"
import UserViewDrawer from "./view"

export default {
  name: "User",
  dicts: ['sys_normal_disable', 'sys_user_sex'],
  components: { ExcelImportDialog, UserViewDrawer },
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
      // 用户表格数据
      userList: null,
      // 弹出层标题
      title: "",
      // 蜂场列表
      apiaryList: [],
      // 选中的蜂场ID
      selectedApiaryId: undefined,
      // 侧边栏是否收起
      sidebarCollapsed: false,
      // 是否显示弹出层
      open: false,
      // 默认密码
      initPassword: undefined,
      // 日期范围
      dateRange: [],
      // 表单参数
      form: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userName: undefined,
        phonenumber: undefined,
        status: undefined,
        apiaryId: undefined
      },
      // 列信息
      columns: {
        userId: { label: '用户编号', visible: true },
        userName: { label: '用户名称', visible: true },
        nickName: { label: '用户昵称', visible: true },
        deptName: { label: '部门', visible: true },
        phonenumber: { label: '手机号码', visible: true },
        status: { label: '状态', visible: true },
        createTime: { label: '创建时间', visible: true }
      },
      // 表单校验
      rules: {
        userName: [
          { required: true, message: "用户名称不能为空", trigger: "blur" },
          { min: 2, max: 20, message: '用户名称长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        nickName: [
          { required: true, message: "用户昵称不能为空", trigger: "blur" }
        ],
        password: [
          { required: true, message: "用户密码不能为空", trigger: "blur" },
          { min: 5, max: 20, message: '用户密码长度必须介于 5 和 20 之间', trigger: 'blur' },
          { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\\ |", trigger: "blur" }
        ],
        apiaryId: [
          { required: true, message: "所属蜂场不能为空", trigger: "change" }
        ]
      }
    }
  },
  created() {
    this.loadApiaryList()
    this.getList()
    this.getConfigKey("sys.user.initPassword").then(response => {
      this.initPassword = response.msg
    })
  },
  computed: {
    // 蜂场列表（包含"全部蜂场"选项）
    apiaryListWithAll() {
      const allOption = { apiaryId: undefined, apiaryName: '全部蜂场' }
      return [allOption, ...this.apiaryList]
    }
  },
  methods: {
    /** 查询用户列表 */
    getList() {
      this.loading = true
      listUser(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.userList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    /** 查询部门下拉树结构 */
    getDeptTree() {
      deptTreeSelect().then(response => {
        this.deptOptions = response.data
        this.enabledDeptOptions = this.filterDisabledDept(JSON.parse(JSON.stringify(response.data)))
      })
    },
    // 过滤禁用的部门
    filterDisabledDept(deptList) {
      return deptList.filter(dept => {
        if (dept.disabled) {
          return false
        }
        if (dept.children && dept.children.length) {
          dept.children = this.filterDisabledDept(dept.children)
        }
        return true
      })
    },
    // 节点单击事件
    handleNodeClick(data) {
      this.queryParams.deptId = data.id
      this.handleQuery()
    },
    // 用户状态修改
    handleStatusChange(row) {
      let text = row.status === "0" ? "启用" : "停用"
      this.$modal.confirm('确认要"' + text + '""' + row.userName + '"用户吗？').then(function() {
        return changeUserStatus(row.userId, row.status)
      }).then(() => {
        this.$modal.msgSuccess(text + "成功")
      }).catch(function() {
        row.status = row.status === "0" ? "1" : "0"
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
        userId: undefined,
        userName: undefined,
        nickName: undefined,
        password: undefined,
        phonenumber: undefined,
        apiaryId: undefined
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
      this.dateRange = []
      this.resetForm("queryForm")
      // 重置为第一个选项（全部蜂场）
      if (this.apiaryListWithAll.length > 0) {
        this.selectedApiaryId = this.apiaryListWithAll[0].apiaryId
        this.queryParams.apiaryId = this.apiaryListWithAll[0].apiaryId
      }
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.userId)
      this.single = selection.length != 1
      this.multiple = !selection.length
    },
    // 更多操作触发
    handleCommand(command, row) {
      switch (command) {
        case "handleResetPwd":
          this.handleResetPwd(row)
          break
        case "handleAuthRole":
          this.handleAuthRole(row)
          break
        default:
          break
      }
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      // 固定角色为蜂场管理员（role_id=2）
      this.form.roleIds = [2]
      this.open = true
      this.title = "添加用户"
      this.form.password = this.initPassword
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const userId = row.userId || this.ids
      getUser(userId).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改用户"
        this.form.password = ""
      })
    },
    /** 重置密码按钮操作 */
    handleResetPwd(row) {
      this.$prompt('请输入"' + row.userName + '"的新密码', "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        closeOnClickModal: false,
        inputPattern: /^.{5,20}$/,
        inputErrorMessage: "用户密码长度必须介于 5 和 20 之间",
        inputValidator: (value) => {
          if (/<|>|"|'|\||\\/.test(value)) {
            return "不能包含非法字符：< > \" ' \\\ |"
          }
        },
      }).then(({ value }) => {
        resetUserPwd(row.userId, value).then(() => {
          this.$modal.msgSuccess("修改成功，新密码是：" + value)
        })
      }).catch(() => {})
    },
    /** 分配角色操作 */
    handleAuthRole(row) {
      const userId = row.userId
      this.$router.push("/system/user-auth/role/" + userId)
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.userId != undefined) {
            updateUser(this.form).then(() => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addUser(this.form).then(() => {
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
      const userIds = row.userId || this.ids
      this.$modal.confirm('是否确认删除用户编号为"' + userIds + '"的数据项？').then(function() {
        return delUser(userIds)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/user/export', {
        ...this.queryParams
      }, `user_${new Date().getTime()}.xlsx`)
    },
    /** 详情按钮操作 */
    handleViewData(row) {
      this.$refs.userViewRef.open(row.userId)
    },
    /** 导入按钮操作 */
    handleImport() {
      this.$refs.importUserRef.open()
    },
    /** 加载蜂场列表 */
    loadApiaryList() {
      listApiary({ pageNum: 1, pageSize: 1000 }).then(response => {
        this.apiaryList = response.rows || []
        // 默认选择第一个（全部蜂场）
        if (this.selectedApiaryId === undefined && this.apiaryListWithAll.length > 0) {
          this.selectedApiaryId = this.apiaryListWithAll[0].apiaryId
        }
      })
    },
    /** 蜂场点击事件 */
    handleApiaryClick(item) {
      this.selectedApiaryId = item.apiaryId
      this.queryParams.apiaryId = item.apiaryId
      this.handleQuery()
    },
    /** 切换侧边栏展开/收起 */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    }
  }
}
</script>

<style lang="scss" scoped>
.tree-sidebar-manage-wrap {
  display: flex;
  height: calc(100vh - 84px);
}

// 蜂场侧边栏样式
.apiary-sidebar {
  flex-shrink: 0;
  width: 220px;
  background: #fff;
  border-right: 1px solid #e8eaed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: width 0.25s ease;

  &.collapsed {
    width: 42px;
  }

  // 展开/收起按钮容器
  .collapse-button-container {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 20px;
    background: #fff;
    border-radius: 0 4px 4px 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    .apiary-sidebar.collapsed & {
      right: 0;
      background: #f7f8fa;
      border-radius: 0 4px 4px 0;
    }
  }

  .collapse-button {
    font-size: 14px;
    color: #909399;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      color: #409eff;
      background: #ecf5ff;
    }
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    height: 40px;
    border-bottom: 1px solid #e8eaed;
    background: #f7f8fa;
    flex-shrink: 0;

    .sidebar-title {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      white-space: nowrap;
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 5px;

      i {
        color: #409eff;
        font-size: 14px;
      }
    }

    .sidebar-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
  }

  .action-icon {
    font-size: 14px;
    color: #909399;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      color: #409eff;
      background: #ecf5ff;
    }
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 6px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 4px;

      &:hover {
        background: #c0c4cc;
      }
    }

    .apiary-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      margin-bottom: 2px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;

      &:hover {
        background: #f0f7ff;
      }

      &.active {
        background: #e6f0fd;
        color: #409eff;
        font-weight: 600;

        .apiary-icon {
          color: #409eff !important;
        }
      }

      .apiary-icon {
        font-size: 14px;
        color: #f5a623;
        flex-shrink: 0;
      }

      .apiary-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }
    }
  }
}

.tree-sidebar-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.content-inner {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
</style>
