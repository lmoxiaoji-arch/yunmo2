<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const isSidebarCollapsed = ref(false)
const projects = ref([])
const activeProject = ref(null)

onMounted(async () => {
  try {
    const res = await axios.get('/api/projects/list')
    projects.value = res.data.length ? res.data : [
      { id: "project_A", name: "演示光刻方盒 (V1)", model_type: "box" }
    ]
    activeProject.value = projects.value[0]
  } catch (e) {
    console.error('Failed to fetch projects', e)
  }
})

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const handleSaveConfig = async (isDraft) => {
  if (!activeProject.value) return
  try {
    const mockPayload = {
      projectId: activeProject.value.id,
      version: 'v1.0.1',
      isDraft,
      configJson: { 
        front: { base: 'url', cloud: 'url' } // 将来会被真实的表单数据接管
      },
      commitMsg: isDraft ? 'Auto Draft' : 'Publish Version'
    }
    await axios.post('/api/projects/save', mockPayload)
    alert(isDraft ? '草稿保存成功！' : '发布环境已更新！')
  } catch(e) {
    alert('保存失败: ' + e.message)
  }
}

// 图片上传处理 (直连后端 Multer & Sharp)
const handleFileUpload = async (e, side, layerType) => {
  const file = e.target.files[0]
  if (!file || !activeProject.value) return
  
  const formData = new FormData()
  formData.append('asset', file)
  formData.append('projectId', activeProject.value.id)
  formData.append('side', side)
  formData.append('layerType', layerType)
  
  try {
    const res = await axios.post('/api/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    // 成功后可以在这更新本地 configJson 状态，这里仅做 console
    console.log(`上传并优化成功: ${side}_${layerType}`, res.data)
    alert(`${layerType} 贴图更新成功`)
  } catch (err) {
    console.error(err)
    alert('上传失败: ' + (err.response?.data?.error || err.message))
  }
}
</script>

<template>
  <div class="admin-container">
    <aside :class="['sidebar', { 'collapsed': isSidebarCollapsed }]">
      <div class="sidebar-header">
        <h2 v-if="!isSidebarCollapsed">B端控制台</h2>
        <button class="toggle-btn" @click="toggleSidebar">
          {{ isSidebarCollapsed ? '→' : '← 收起' }}
        </button>
      </div>

      <ul class="nav-menu" v-if="!isSidebarCollapsed">
        <li class="active">项目管理</li>
        <li>资源库</li>
        <li>全局模板</li>
      </ul>
    </aside>

    <main class="content">
      <div class="header-bar">
        <h2 v-if="activeProject">项目配置 - {{ activeProject.name }}</h2>
        <div class="actions">
          <button class="primary-btn" @click="handleSaveConfig(false)">保存发布环境</button>
          <button class="ghost-btn" @click="handleSaveConfig(true)">存为草稿</button>
        </div>
      </div>

      <!-- 规格书 2.3 节：互斥叠罗汉 (Accordion) -->
      <div class="accordion-panel">
        <details class="accordion-item" open>
          <summary>Front (正面) 纹理配置</summary>
          <div class="panel-content">
            <div class="form-group">
              <label>基础底图 (Base Map)</label>
              <input type="file" accept="image/*" @change="e => handleFileUpload(e, 'front', 'base')" />
            </div>
            <div class="form-group">
              <label>云层图 (Cloud Parallax)</label>
              <input type="file" accept="image/*" @change="e => handleFileUpload(e, 'front', 'cloud')" />
              <input type="range" min="0" max="0.1" step="0.01" value="0.05" />
            </div>
            <div class="form-group">
              <label>灰度高光 (Specular)</label>
              <input type="file" accept="image/*" @change="e => handleFileUpload(e, 'front', 'specular')" />
            </div>
          </div>
        </details>

        <details class="accordion-item">
          <summary>Top (顶面) 纹理配置</summary>
          <div class="panel-content">
            <p>等待上传相关贴图以配置该面...</p>
          </div>
        </details>
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f8fafc;
  color: #334155;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}
.sidebar.collapsed { width: 60px; }

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  border-bottom: 1px solid #e2e8f0;
}
.sidebar-header h2 { font-size: 1rem; margin: 0; }
.toggle-btn { background: none; border: none; cursor: pointer; color: #64748b; }

.nav-menu { list-style: none; padding: 15px 0; margin: 0; }
.nav-menu li {
  padding: 12px 20px;
  cursor: pointer;
  color: #475569;
}
.nav-menu li.active { background: #eef2ff; color: #4f46e5; border-right: 3px solid #4f46e5; }
.nav-menu li:hover:not(.active) { background: #f1f5f9; }

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.header-bar {
  background: #ffffff;
  height: 60px;
  padding: 0 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
}
.header-bar h2 { font-size: 1.25rem; font-weight: 500; margin: 0; }

.actions button {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-left: 10px;
}
.primary-btn { background: #4f46e5; color: white; border: none; }
.primary-btn:hover { background: #4338ca; }
.ghost-btn { background: transparent; color: #64748b; border: 1px solid #cbd5e1; }

.accordion-panel {
  padding: 30px;
  max-width: 800px;
}
.accordion-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}
.accordion-item summary {
  padding: 15px 20px;
  background: #f8fafc;
  font-weight: 500;
  cursor: pointer;
  list-style: none;
  user-select: none;
}
.accordion-item summary::-webkit-details-marker { display: none; }
.panel-content {
  padding: 20px;
  border-top: 1px solid #e2e8f0;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  color: #475569;
}
</style>
