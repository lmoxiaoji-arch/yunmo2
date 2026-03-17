import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { materialShader } from './core'

// ── 面常量定义 (消除幻数: CC-175) ──────────────────────
// Three.js BoxGeometry 面顺序: +X, -X, +Y, -Y, +Z, -Z
const FACE = Object.freeze({
  RIGHT:  0,
  LEFT:   1,
  TOP:    2,
  BOTTOM: 3,
  FRONT:  4,
  BACK:   5
})

// ── 默认 Shader 参数 ──────────────────────────────────
const DEFAULT_SHADER_CONFIG = Object.freeze({
  parallaxScale: 0.05,
  ambientColor: [0.2, 0.2, 0.2],
  lightColor: [1.0, 1.0, 1.0],
  lightDir: [1, 1, 1]
})

export class EngineViewer {
  constructor(container, options = {}) {
    this.container = container
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.controls = null
    this.box = null

    // 命名材质映射表 (Apple SceneKit 风格: 通过名称而非下标查找)
    this.namedMaterials = {}

    // 合并外部配置与默认值 (Progressive Disclosure)
    this.shaderConfig = { ...DEFAULT_SHADER_CONFIG, ...options.shader }

    // 加载失败的回调 (供 Vue 层接收并展示 UI 反馈)
    this.onLoadError = options.onLoadError || null

    this._boundResize = this._onWindowResize.bind(this)
    this._boundAnimate = this._animate.bind(this)

    this._init()
  }

  // ── 初始化 ─────────────────────────────────────────
  _init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.container.appendChild(this.renderer.domElement)

    this.camera.position.z = 5

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 3
    this.controls.maxDistance = 10

    // 环境光
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5))

    // 定向光
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(2, 2, 5)
    this.scene.add(dirLight)

    window.addEventListener('resize', this._boundResize)

    this._buildProductBox()
    this._boundAnimate()
  }

  // ── 材质工厂 (单一职责: 只负责创建一个 ShaderMaterial) ─
  _createShaderMaterial(baseTex, cloudTex, specTex, name) {
    const uniforms = THREE.UniformsUtils.clone(materialShader.uniforms)
    uniforms.baseMap.value = baseTex
    uniforms.cloudMap.value = cloudTex
    uniforms.specularMap.value = specTex
    uniforms.uParallaxScale.value = this.shaderConfig.parallaxScale

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: materialShader.vertexShader,
      fragmentShader: materialShader.fragmentShader,
      transparent: true,
      name // Three.js Material.name，可用于调试和查找
    })

    // 通过名称注册到映射表
    this.namedMaterials[name] = mat
    return mat
  }

  // ── 贴图加载 (带错误回调，不再静默吞错) ────────────
  _loadTexture(url) {
    const loader = new THREE.TextureLoader()
    return new Promise((resolve) => {
      loader.load(
        url,
        (tex) => resolve(tex),
        undefined,
        (err) => {
          console.warn(`贴图加载失败: ${url}`, err)
          if (this.onLoadError) {
            this.onLoadError({ url, error: err })
          }
          // 返回 null，让 Shader 优雅降级
          resolve(null)
        }
      )
    })
  }

  // ── 构建产品盒子 (以 FACE 常量驱动) ────────────────
  async _buildProductBox() {
    const [frontBase, frontCloud, frontSpec] = await Promise.all([
      this._loadTexture('/project_A/v1/front_base.png'),
      this._loadTexture('/project_A/v1/front_cloud.png'),
      this._loadTexture('/project_A/v1/front_specular.png')
    ])

    const frontMat = this._createShaderMaterial(frontBase, frontCloud, frontSpec, 'front')

    const placeholderMat = new THREE.MeshLambertMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.8,
      name: 'placeholder'
    })

    // 按 FACE 常量有序排列材质数组
    const materials = new Array(6).fill(placeholderMat)
    materials[FACE.FRONT] = frontMat

    const geometry = new THREE.BoxGeometry(2, 4, 0.4)
    this.box = new THREE.Mesh(geometry, materials)
    this.scene.add(this.box)
  }

  // ── 通过名称获取材质 (替代硬编码下标) ──────────────
  getMaterial(name) {
    return this.namedMaterials[name] || null
  }

  // ── 窗口自适应 ─────────────────────────────────────
  _onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  // ── 渲染循环 ──────────────────────────────────────
  _animate() {
    requestAnimationFrame(this._boundAnimate)
    if (this.controls) this.controls.update()

    const frontMat = this.getMaterial('front')
    if (this.box && frontMat) {
      frontMat.uniforms.uCameraPos.value.copy(this.camera.position)
      this._updateCompass()
    }

    this.renderer.render(this.scene, this.camera)
  }

  // ── 罗盘事件 ──────────────────────────────────────
  _updateCompass() {
    const { x, z } = this.camera.position
    let dir = 'Front'
    if (Math.abs(x) > Math.abs(z)) {
      dir = x > 0 ? 'Right' : 'Left'
    } else {
      dir = z > 0 ? 'Front' : 'Back'
    }
    this.container.dispatchEvent(new CustomEvent('compass-update', { detail: dir }))
  }

  // ── Hold-to-Compare 交互 ──────────────────────────
  toggleBaseMap(isHolding) {
    const frontMat = this.getMaterial('front')
    if (!frontMat) return

    if (isHolding) {
      this._cachedBaseMap = frontMat.uniforms.baseMap.value
      frontMat.uniforms.baseMap.value = null
    } else {
      frontMat.uniforms.baseMap.value = this._cachedBaseMap
    }
  }

  // ── 销毁 (释放 GPU 资源，防止内存泄漏: PP-40) ─────
  destroy() {
    window.removeEventListener('resize', this._boundResize)

    // 释放所有命名材质
    Object.values(this.namedMaterials).forEach(mat => mat.dispose())
    this.namedMaterials = {}

    if (this.box) {
      this.box.geometry.dispose()
    }

    this.renderer.dispose()
    this.container.innerHTML = ''
  }
}
