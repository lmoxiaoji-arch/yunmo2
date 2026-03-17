<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { EngineViewer } from '@/engine/viewer'

const viewerContainer = ref(null)
const currentCompass = ref('Front')
let engineInstance = null

onMounted(() => {
  if (viewerContainer.value) {
    engineInstance = new EngineViewer(viewerContainer.value)
    
    viewerContainer.value.addEventListener('compass-update', (e) => {
      if (currentCompass.value !== e.detail) {
        currentCompass.value = e.detail
      }
    })
  }
})

const handleCompare = (isHolding) => {
  if (engineInstance) {
    engineInstance.toggleBaseMap(isHolding)
  }
}

onBeforeUnmount(() => {
  if (engineInstance) {
    engineInstance.destroy()
  }
})
</script>

<template>
  <div class="viewer-container" ref="viewerContainer">
    <!-- UI 层: 指南针与 Hold-to-Compare -->
    <div class="ui-layer">
      <div class="compass">{{ currentCompass }}</div>
      <button 
        class="compare-btn"
        @mousedown="handleCompare(true)"
        @mouseup="handleCompare(false)"
        @mouseleave="handleCompare(false)"
        @touchstart.prevent="handleCompare(true)"
        @touchend.prevent="handleCompare(false)"
      >
        按住变基底 (v1)
      </button>
    </div>
  </div>
</template>

<style scoped>
.viewer-container {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, #1a2a40 0%, #000000 100%);
  position: relative;
  overflow: hidden;
}

.ui-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none; /* 让鼠标穿透给 WebGL 画布 */
  z-index: 10;
}

.compass {
  position: absolute;
  top: 30px;
  right: 30px;
  color: rgba(255, 255, 255, 0.4);
  font-family: monospace;
  font-size: 1rem;
  letter-spacing: 2px;
}

.compare-btn {
  position: absolute;
  bottom: 40px;
  right: 40px;
  pointer-events: auto; /* 恢复对比按钮自身的点击能力 */
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 30px;
  font-size: 0.9rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.compare-btn:active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}
</style>
