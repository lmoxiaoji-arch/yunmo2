<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { EngineViewer } from '@/engine/viewer'
import { crafts } from '@/data/crafts'

const route = useRoute()
const isShowroom = computed(() => route.params.projectId === 'public-demo')

const viewerContainer = ref(null)
const currentCompass = ref('Front')
let engineInstance = null

// Showroom 状态
const searchQuery = ref('')
const selectedCraft = ref(null)
const viewMode = ref('grid') // 'grid' | 'carousel'

const filteredCrafts = computed(() => {
  if (!searchQuery.value) return crafts
  const query = searchQuery.value.toLowerCase()
  return crafts.filter(c => 
    c.name.toLowerCase().includes(query) || 
    c.description.toLowerCase().includes(query)
  )
})

onMounted(() => {
  if (!isShowroom.value && viewerContainer.value) {
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

const openDetail = (craft) => {
  selectedCraft.value = craft
}

const closeDetail = () => {
  selectedCraft.value = null
}

onBeforeUnmount(() => {
  if (engineInstance) {
    engineInstance.destroy()
  }
})
</script>

<template>
  <div class="viewer-layout">
    <!-- 3D 模式 (私域) -->
    <div v-if="!isShowroom" class="viewer-container" ref="viewerContainer">
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

    <!-- 陈列室模式 (Showroom) -->
    <div v-else class="showroom-container">
      <div class="showroom-header">
        <div class="header-left">
          <h1>工艺陈列室</h1>
          <div class="search-box">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="搜索特定工艺..."
            />
            <span class="search-icon">🔍</span>
          </div>
        </div>
        
        <div class="view-toggles">
          <button 
            :class="['toggle-btn', { active: viewMode === 'grid' }]"
            @click="viewMode = 'grid'"
          >
            精细网格
          </button>
          <button 
            :class="['toggle-btn', { active: viewMode === 'carousel' }]"
            @click="viewMode = 'carousel'"
          >
            沉浸轮播
          </button>
        </div>
      </div>

      <!-- 模式一: Grid Matrix -->
      <Transition name="fade" mode="out-in">
        <div v-if="viewMode === 'grid'" key="grid" class="craft-grid">
          <div 
            v-for="craft in filteredCrafts" 
            :key="craft.id" 
            class="craft-card"
            @click="openDetail(craft)"
          >
            <div class="card-image">
              <img :src="craft.thumbnail" :alt="craft.name" />
              <div class="hover-overlay">
                <span>点击查看详情</span>
              </div>
            </div>
            <div class="card-info">
              <h3>{{ craft.name }}</h3>
              <p>{{ craft.description }}</p>
            </div>
          </div>
        </div>

        <!-- 模式二: 3D Carousel -->
        <div v-else key="carousel" class="carousel-stage">
          <div class="carousel-container">
            <div 
              v-for="(craft, index) in filteredCrafts" 
              :key="craft.id"
              class="carousel-item"
              :style="{ '--index': index, '--total': filteredCrafts.length }"
              @click="openDetail(craft)"
            >
              <div class="carousel-card">
                <img :src="craft.thumbnail" :alt="craft.name" />
                <div class="carousel-info">
                  <h3>{{ craft.name }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 弹出胶囊 (Capsule Detail) -->
      <Transition name="fade">
        <div v-if="selectedCraft" class="capsule-overlay" @click.self="closeDetail">
          <div class="capsule-content">
            <button class="modal-close" @click="closeDetail">×</button>
            <div class="capsule-body">
              <div class="detail-image">
                <img :src="selectedCraft.fullImage" :alt="selectedCraft.name" />
              </div>
              <div class="detail-info">
                <h2>{{ selectedCraft.name }}</h2>
                <div class="info-section">
                  <span class="label">工艺简介</span>
                  <p>{{ selectedCraft.details.intro }}</p>
                </div>
                <div class="info-row">
                  <div class="info-section">
                    <span class="label">推荐尺寸</span>
                    <p>{{ selectedCraft.details.recommendedSize }}</p>
                  </div>
                </div>
                <div class="info-section">
                  <span class="label">优势</span>
                  <p class="text-success">{{ selectedCraft.details.pros }}</p>
                </div>
                <div class="info-section">
                  <span class="label">局限</span>
                  <p class="text-warning">{{ selectedCraft.details.cons }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.viewer-layout {
  width: 100vw;
  height: 100vh;
  background: #090a0f;
  color: white;
  overflow: hidden;
}

/* 3D Viewer Styles */
.viewer-container {
  width: 100%; height: 100%;
  background: radial-gradient(circle at center, #1a2a40 0%, #000000 100%);
  position: relative;
}
.ui-layer {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: 10;
}
.compass {
  position: absolute;
  top: 30px; right: 30px;
  color: rgba(255, 255, 255, 0.4);
  font-family: monospace;
  font-size: 1rem;
  letter-spacing: 2px;
}
.compare-btn {
  position: absolute;
  bottom: 40px; right: 40px;
  pointer-events: auto;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 30px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* Showroom Styles */
.showroom-container {
  width: 100%;
  height: 100%;
  padding: 40px 60px;
  overflow-y: auto;
  box-sizing: border-box;
  perspective: 1000px;
}
.showroom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 50px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}
.showroom-header h1 {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 4px;
  margin: 0;
}
.search-box {
  position: relative;
  width: 300px;
}
.search-box input {
  width: 100%;
  padding: 10px 40px 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: white;
  outline: none;
  transition: all 0.3s;
}
.search-box input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}
.search-icon {
  position: absolute;
  right: 15px; top: 50%;
  transform: translateY(-50%);
  opacity: 0.5;
}

.view-toggles {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.view-toggles .toggle-btn {
  padding: 8px 20px;
  border: none;
  background: transparent;
  color: #8b9bb4;
  cursor: pointer;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s;
}
.view-toggles .toggle-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

/* Grid Matrix */
.craft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
}
.craft-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}
.craft-card:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.07);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}
.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}
.card-image img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.6s;
}
.craft-card:hover .card-image img { transform: scale(1.1); }
.hover-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.3s;
}
.craft-card:hover .hover-overlay { opacity: 1; }
.card-info { padding: 20px; }
.card-info h3 { margin: 0 0 10px 0; font-weight: 400; font-size: 1.1rem; }
.card-info p { margin: 0; font-size: 0.9rem; color: #8b9bb4; line-height: 1.5; }

/* 3D Carousel Stage */
.carousel-stage {
  width: 100%;
  height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.carousel-container {
  display: flex;
  gap: 40px;
  transform-style: preserve-3d;
  animation: carouselRotate 20s linear infinite;
}
.carousel-item {
  width: 300px;
  flex-shrink: 0;
  cursor: pointer;
  transform: rotateY(calc(var(--index) * (360deg / var(--total)))) translateZ(400px);
  transition: all 0.5s;
}
.carousel-item:hover {
  transform: rotateY(calc(var(--index) * (360deg / var(--total)))) translateZ(450px) scale(1.05);
  z-index: 100;
}
.carousel-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}
.carousel-card img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}
.carousel-info {
  padding: 15px;
  text-align: center;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}
.carousel-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 300;
  letter-spacing: 1px;
}

@keyframes carouselRotate {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(360deg); }
}

/* Capsule Detail Popup */
.capsule-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}
.capsule-content {
  background: #111;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0,0,0,0.6);
}
.modal-close {
  position: absolute;
  top: 20px; right: 20px;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
  transition: background 0.3s;
}
.modal-close:hover { background: rgba(255,255,255,0.2); }

.capsule-body { display: flex; height: 100%; }
.detail-image { flex: 1.2; background: #000; }
.detail-image img { width: 100%; height: 100%; object-fit: contain; }
.detail-info { flex: 1; padding: 50px; overflow-y: auto; }
.detail-info h2 { font-size: 1.8rem; font-weight: 300; margin: 0 0 30px 0; letter-spacing: 2px; }
.info-section { margin-bottom: 25px; }
.label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: #556677; margin-bottom: 8px; }
.detail-info p { margin: 0; line-height: 1.6; color: #ccc; }
.text-success { color: #4ade80 !important; }
.text-warning { color: #fbbf24 !important; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
