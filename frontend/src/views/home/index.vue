<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const showLogin = ref(false)
const passcode = ref('')
const isLoading = ref(false)
const errMsg = ref('')

const gotoPublic = () => {
  // 模拟公域展示：可以跳一个纯 3D Carousel 或者指定一个公开的 Demo ID
  router.push('/viewer/public-demo')
}

const triggerPrivate = () => {
  // 检查 localStorage 是否有 7 天免密 Token
  const savedToken = localStorage.getItem('yunmoAuth')
  if (savedToken) {
    // 假设 Token 验证能顺带拉出绑定的 projectId
    const projectId = savedToken.split(':')[1] || 'project_A'
    router.push(`/viewer/${projectId}`)
  } else {
    showLogin.value = true
  }
}

const handleVerify = async () => {
  if (passcode.value.length !== 6) {
    errMsg.value = '提取码需为 6 位字符'
    return
  }
  
  isLoading.value = true
  errMsg.value = ''
  
  try {
    const res = await axios.post('/api/auth/verify', { passcode: passcode.value })
    if (res.data.success && res.data.projectId) {
      // 写入假 token (7天免密机制)
      localStorage.setItem('yunmoAuth', `token_authed:${res.data.projectId}`)
      router.push(`/viewer/${res.data.projectId}`)
    }
  } catch (err) {
    // 规格书中提到的递增冻结此时由后端抛出的 429 Too Many Requests 返回
    errMsg.value = err.response?.data?.error || '提取码验证失败'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="home-container">
    <div class="intro-box">
      <h1>光刻工艺互动展示系统</h1>
      <p class="subtitle">极致的光学级数字再造</p>
      
      <div class="actions">
        <button class="btn btn-outline" @click="gotoPublic">工艺陈列室 (公域)</button>
        <button class="btn btn-primary" @click="triggerPrivate">私有交付信道</button>
      </div>
    </div>

    <!-- 极简暗黑风格弹窗 -->
    <div v-if="showLogin" class="modal-overlay" @click.self="showLogin = false">
      <div class="modal-content">
        <h3>请输入专属提取码</h3>
        <input 
          v-model="passcode" 
          type="text" 
          maxlength="6" 
          placeholder="6位字符" 
          @keyup.enter="handleVerify"
        />
        <p class="error-msg" v-if="errMsg">{{ errMsg }}</p>
        <button class="btn btn-primary submit-btn" :disabled="isLoading" @click="handleVerify">
          {{ isLoading ? '验证中...' : '进入空间' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: radial-gradient(circle at center, #1b2735 0%, #090a0f 100%);
  color: white;
}

.intro-box {
  text-align: center;
  animation: fadeIn 1.5s ease-out forwards;
}

h1 { font-size: 2.5rem; letter-spacing: 4px; font-weight: 300; margin-bottom: 10px; }
.subtitle { color: #8b9bb4; letter-spacing: 2px; font-size: 0.9rem; margin-bottom: 40px; }

.actions { display: flex; gap: 20px; justify-content: center; }
.btn {
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 1rem;
  cursor: pointer;
  backdrop-filter: blur(5px);
  transition: all 0.3s;
}
.btn-primary { background: rgba(255, 255, 255, 0.9); color: black; border: none; }
.btn-primary:not(:disabled):hover { background: white; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255,255,255,0.2); }
.btn-outline { background: transparent; color: white; border: 1px solid rgba(255, 255, 255, 0.3); }
.btn-outline:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.6); }

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-content {
  background: #111;
  padding: 40px;
  border-radius: 12px;
  border: 1px solid #333;
  width: 90%;
  max-width: 350px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}
.modal-content h3 { margin: 0 0 25px 0; font-weight: 400; font-size: 1.1rem; color: #acc; }
.modal-content input {
  width: 100%;
  padding: 15px;
  background: #000;
  border: 1px solid #444;
  color: white;
  text-align: center;
  font-size: 1.5rem;
  letter-spacing: 8px;
  border-radius: 6px;
  margin-bottom: 20px;
  outline: none;
  transition: border-color 0.3s;
  box-sizing: border-box;
}
.modal-content input:focus { border-color: #fff; }
.error-msg { color: #ff5555; font-size: 0.85rem; margin-top: -10px; margin-bottom: 15px; }
.submit-btn { width: 100%; }
</style>
