<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="48px">
          <el-form-item label="名称" prop="appName">
            <el-input
              v-model="queryParams.appName"
              placeholder="请输入参数名称"
              clearable
              size="small"
              style="width: 160px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="类型" prop="appType">
            <el-input
              v-model="queryParams.appType"
              placeholder="请输入类型"
              clearable
              size="small"
              style="width: 160px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="AppId" prop="appId">
            <el-input
              v-model="queryParams.AppId"
              placeholder="请输入Id"
              clearable
              size="small"
              style="width: 160px"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="handleResetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="success"
              size="mini"
              @click="handleBatchStart"
            >开启服务</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['sysTools:serverControl']"
              type="danger"
              size="mini"
              @click="handleBatchStop"
            >停服下线</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['sysTools:serverControl']"
              type="danger"
              size="mini"
              @click="handleBatchMaintenance"
            >开始维护</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['sysTools:serverControl']"
              type="success"
              size="mini"
              @click="handleBatchMaintenanceFinish"
            >结束维护</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['sysTools:serverControl']"
              type="warning"
              icon="el-icon-download"
              size="mini"
              @click="handleExport"
            >导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              v-permisaction="['sysTools:serverControl']"
              type="success"
              size="mini"
              @click="handleBatchUpdateService"
            >更新组件</el-button>
          </el-col>
        </el-row>

        <el-table
          v-loading="loading"
          :data="serverList"
          border
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChang"
        >
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column
            label="序号"
            width="55"
            prop="id"
          />
          <el-table-column
            label="名称"
            sortable="custom"
            width="100"
            prop="appName"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="类型"
            sortable="custom"
            width="75"
            prop="appType"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="AppId"
            sortable="custom"
            width="100"
            prop="appId"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="状态"
            sortable="custom"
            width="90"
            prop="appState"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.appState===0">未启动</span>
              <span v-else-if="scope.row.appState===1">启动中</span>
              <span v-else-if="scope.row.appState===2" style="color: green">运行中</span>
              <span v-else-if="scope.row.appState===4">维护中</span>
              <span v-else-if="scope.row.appState===8">维护结束</span>
              <span v-else-if="scope.row.appState===16">下线</span>
              <span v-else>未知</span>
            </template>
          </el-table-column>
          <el-table-column
            label="地址"
            sortable="custom"
            width="170"
            prop="address"
          />
          <el-table-column
            label="描述"
            prop="description"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="操作"
            class-name="small-padding fixed-width"
            width="320"
          >
            <template slot-scope="scope">
              <el-button
                :disabled="scope.row.appState !== 0"
                size="mini"
                type="success"
                @click="handleStartService(scope.row)"
              >开启服务</el-button>
              <el-button
                :disabled="scope.row.appState === 0"
                size="mini"
                type="danger"
                @click="handleStopService(scope.row)"
              >停服下线</el-button>
              <el-button
                :disabled="scope.row.appState !== 2"
                size="mini"
                type="danger"
                @click="handleMaintenance(scope.row)"
              >开始维护</el-button>
              <el-button
                :disabled="scope.row.appState !== 4"
                size="mini"
                type="primary"
                @click="handleMaintenanceFinish(scope.row)"
              >结束维护</el-button>
              <el-button
                :disabled="scope.row.appState !== 0"
                size="mini"
                type="success"
                @click="handleUpdateService(scope.row)"
              >更新组件</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination
          v-show="total>0"
          :total="total"
          :page.sync="queryParams.pageIndex"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { getServerList, serverControl } from '@/api/monitor/server-control'
import { formatJson } from '@/utils'

export default {
  name: 'SysServerControl',
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      appTypes: [],
      appIds: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 总条数
      total: 0,
      // 参数表格数据
      serverList: [],
      // 排序字段
      order: 'createdAtOrder',
      // 弹出层标题
      title: '',
      isEdit: false,
      // 是否显示弹出层
      open: false,
      // 类型数据字典
      typeOptions: [],
      // 日期范围
      dateRange: [],
      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 50,
        appName: undefined,
        appType: undefined,
        appId: undefined,
        appState: 0,
        createdAtOrder: 'desc'
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        appName: [{ required: true, message: 'App名称不能为空', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询参数列表 */
    getList() {
      this.appTypes = []
      this.appIds = []
      this.loading = true
      getServerList().then(response => {
        this.serverList = response.data.list
        this.total = response.data.count
        this.loading = false
      })
    },
    // 参数系统内置字典翻译
    typeFormat(row, column) {
      return this.selectDictLabel(this.typeOptions, row.appId)
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        id: undefined,
        appName: undefined,
        appType: undefined,
        appId: undefined
      }
      this.resetForm('form')
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageIndex = 1
      this.getList()
    },
    /** 重置按钮操作 */
    handleResetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.queryParams['createdAtOrderOrder'] = 'desc'
      this.handleQuery()
    },
    // 开启
    handleBatchStart() {
      this.controlServer(4)
    },
    // 关闭
    handleBatchStop() {
      this.controlServer(5)
    },
    // 维护
    handleBatchMaintenance() {
      this.controlServer(1)
    },
    // 维护完成
    handleBatchMaintenanceFinish() {
      this.controlServer(2)
    },
    // 更新
    handleBatchUpdateService() {
      this.controlServer(6)
    },
    // 控制服务器
    controlServer(ctlId, obj) {
      // 默认批量操作
      let appTypes = this.appTypes
      let appIds = this.appIds
      // 单个操作
      if (obj !== undefined) {
        appTypes = [obj.appType]
        appIds = [obj.appId]
      }

      if (appTypes.length === 0 || appIds.length === 0 || appTypes.length !== appIds.length) {
        this.$message({
          message: '请选择要操作的数据' + appTypes.length + '---' + appIds.length,
          type: 'warning'
        })
        return
      }

      /*
      CtlId_Maintenance       CtlId = 1 //开始维护
	    CtlId_MaintenanceFinish CtlId = 2 //维护完成
	    CtlId_ShowServerList    CtlId = 3 //显示列表
	    CtlId_StartService      CtlId = 4 //启动服务
	    CtlId_StopService       CtlId = 5 //停止服务
      CtlId_UpdateService     CtlId = 6 //更新服务
      */

      // 合法性检查
      if (ctlId < 1 && ctlId > 6) {
        this.$message({
          message: '操作类型错误',
          type: 'warning'
        })
        return
      }

      var list = []
      var len = appTypes.length
      for (let i = 0; i < len; i++) {
        list.push({
          appType: appTypes[i],
          appId: appIds[i]
        })
      }

      var msg = ''
      if (ctlId === 1) {
        msg = '是否确认开始维护服务?'
      } else if (ctlId === 2) {
        msg = '是否确认停止维护服务?'
      } else if (ctlId === 4) {
        msg = '是否确认开启服务?'
      } else if (ctlId === 5) {
        msg = '是否确认关闭服务?'
      } else if (ctlId === 6) {
        msg = '是否确认更新服务?'
      } else {
        this.$message({
          message: '操作类型错误,暂时不处理',
          type: 'warning'
        })
        return
      }
      this.$confirm(msg, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(function() {
        return serverControl(ctlId, list)
      }).then((response) => {
        if (response.code === 200) {
          this.msgSuccess(response.msg)
          this.open = false
          this.getList()
        } else {
          this.msgError(response.msg)
        }
      }).catch(function() {})
    },
    handleSortChang(column, prop, order) {
      prop = column.prop
      order = column.order
      if (this.order !== '' && this.order !== prop + 'Order') {
        this.queryParams[this.order] = undefined
      }
      if (order === 'descending') {
        this.queryParams[prop + 'Order'] = 'desc'
        this.order = prop + 'Order'
      } else if (order === 'ascending') {
        this.queryParams[prop + 'Order'] = 'asc'
        this.order = prop + 'Order'
      } else {
        this.queryParams[prop + 'Order'] = undefined
      }
      this.getList()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.appTypes = selection.map(item => item.appType)
      this.appIds = selection.map(item => item.appId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },

    // 启停服务
    handleStartService(row) {
      if (row.appState !== 0) {
        this.$message({
          message: '该服务已经启动',
          type: 'warning'
        })
        return
      }

      this.controlServer(4, {
        appType: row.appType,
        appId: row.appId
      })
    },

    handleStopService(row) {
      if (row.appState === 0) {
        this.$message({
          message: '该服务已经停止',
          type: 'warning'
        })
        return
      }

      this.controlServer(5, {
        appType: row.appType,
        appId: row.appId
      })
    },

    // 维护命令
    handleMaintenance(row) {
      if (row.appState !== 2) {
        this.$message({
          message: '该服务不是运行状态',
          type: 'warning'
        })
        return
      }

      this.controlServer(1, {
        appType: row.appType,
        appId: row.appId
      })
    },

    // 维护完成
    handleMaintenanceFinish(row) {
      if (row.appState !== 4) {
        this.$message({
          message: '该服务不是维护状态',
          type: 'warning'
        })
        return
      }

      this.controlServer(2, {
        appType: row.appType,
        appId: row.appId
      })
    },
    // 更新服务
    handleUpdateService(row) {
      this.controlServer(6, {
        appType: row.appType,
        appId: row.appId
      })
    },
    /** 导出按钮操作 */
    handleExport() {
      // const queryParams = this.queryParams
      this.$confirm('是否确认导出所有参数数据项?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.downloadLoading = true
        import('@/vendor/Export2Excel').then(excel => {
          const tHeader = ['序号', '名称', '类型', 'appId', '状态', '地址', '描述']
          const filterVal = ['id', 'appName', 'appType', 'appId', 'appState', 'address', 'description']
          const list = this.serverList
          const data = formatJson(filterVal, list)
          excel.export_json_to_excel({
            header: tHeader,
            data,
            filename: '服务控制',
            autoWidth: true, // Optional
            bookType: 'xlsx' // Optional
          })
          this.downloadLoading = false
        })
      })
    }
  }
}
</script>
