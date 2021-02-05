<!--
 * @Author: KingWin
 * @Date: 2021-01-29 13:38:34
 * @LastEditTime: 2021-02-05 15:06:09
 * @Description: 
-->
<template>
  <div class="app-wrapper">
    <div class="sidebar-container">
      <file-search
        v-model="searchTitle"
        @create="fileCreate"
        @clear="getFileList"
        @change="handleChange"
        @search="handleSearch"
        @keyup.enter.native="handleSearch"
        clearable
      />
      <file-list :fileList="fileList" :active.sync="activeIndex" :selectedFile.sync="selectedFile">
        <template v-slot:menu>
          <li @click="handleFileTop">置顶</li>
          <li @click="fileDelete">删除</li>
        </template>
      </file-list>
    </div>
    <div class="main-container">
      <div class="placeholder" v-if="fileList.length === 0">暂无笔记</div>
      <file-edit
        v-else
        v-model="fileItem.content"
        :title.sync="fileItem.title"
        :boxShadow="false"
        :subfield="false"
        :shortCut="false"
        @titleBlur="updateTitle"
        @change="updateContent"
      />
    </div>
  </div>
</template>

<script>
import FileSearch from '@/components/FileSearch'
import FileList from '@/components/FileList'
import FileEdit from '@/components/FileEdit'
import dayjs from 'dayjs'

export default {
  name: 'Home',
  components: { FileSearch, FileList, FileEdit },
  data() {
    return {
      searchTitle: '',
      fileList: [],
      fileItem: {},
      activeIndex: 0,
      selectedFile: {} // 右侧菜单选中的文件数据
    }
  },
  mounted() {
    this.init()
  },
  watch: {
    activeIndex(newValue) {
      this.fileItem = this.fileList[newValue]
    }
  },
  methods: {
    async init() {
      await this.getFileList()
      if (this.fileList.length === 0) return
      const [firsetFileItem] = this.fileList
      this.fileItem = firsetFileItem
    },
    // 监听输入搜索内容
    handleChange(val) {
      if (!val) {
        this.getFileList()
      }
    },
    // 新增笔记
    fileCreate() {
      // markdown 存储标题和内容就够了
      const defaultFile = { title: '无标题笔记', content: '', isTop: false }
      this.$db.markdown.insert(defaultFile).then(async () => {
        await this.getFileList()
        const [firstFileItem] = this.fileList
        this.fileItem = firstFileItem
        this.activeIndex = 0
      })
    },
    // 删除笔记
    fileDelete() {
      this.$confirm('此操作将永久删除该笔记，是否继续', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '确定',
        type: 'warning'
      })
        .then(() => {
          const { _id } = this.selectedFile
          this.$db.markdown
            .remove({ _id })
            .then(num => {
              this.$message.success(`删除了${num}个项目`)
              this.init()
            })
            .catch(() => {
              this.$message.error('刪除失败')
            })
        })
        .catch(() => {})
    },
    // 搜索笔记
    handleSearch() {
      // 动态生成正则 不区分大小写
      const reg = new RegExp(`${this.searchTitle}`, 'i')
      const query = { title: reg }
      this.getFileList(query)
    },
    // 获取笔记列表
    async getFileList(query = {}) {
      const list = await this.$db.markdown.find(query).sort({ isTop: -1, updatedAt: -1 })
      // 格式化时间
      this.fileList = list.map(item => {
        // 添加内容备份
        item.originalContent = item.content
        item.createAt = dayjs(item.createAt).format('YYYY-MM-DD HH:mm:ss')
        item.updatedAt = dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm:ss')
        return item
      })
    },
    // 更新标题
    updateTitle(title) {
      const { _id } = this.fileItem
      this.$db.markdown.update({ _id, title: { $ne: title } }, { $set: { title } }).then(async () => {
        await this.refreshList()
      })
    },
    // 更新内容
    updateContent(content) {
      const { _id, originalContent } = this.fileItem
      if (originalContent === content) return
      // 防抖
      if (this.timerId) clearTimeout(this.timerId)
      this.timerId = setTimeout(() => {
        this.$db.markdown.update({ _id, content: { $ne: content } }, { $set: { content } }).then(async () => {
          this.refreshList()
        })
      }, 1000)
    },
    // 刷新列表并高亮第一个笔记
    async refreshList() {
      // 如果为第一个则不查找当前的笔记
      if (this.activeIndex === 0) return
      await this.getFileList()
      const [firstFileItem] = this.fileList
      this.fileItem = firstFileItem
      this.activeIndex = 0
    },
    // 置顶笔记
    handleFileTop() {
      const { _id, isTop } = this.selectedFile
      this.$db.markdown.update({ _id }, { $set: { isTop: !isTop } }).then(() => {
        this.init()
      })
    }
  }
}
</script>

<style lang="less" scoped>
.app-wrapper {
  display: flex;
  .sidebar-container {
    width: 300px;
    height: 100vh;
    border-right: 1px solid #eaeefb;
  }
  .main-container {
    flex: 1;
    overflow: hidden;

    .placeholder {
      color: #909399;
      text-align: center;
      line-height: 300px;
    }
  }
}
</style>
