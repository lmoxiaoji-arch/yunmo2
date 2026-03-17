// src/engine/core.js
import * as THREE from 'three'

// ── Shader 默认参数 (外部化到常量，消除幻数: CC-175) ───
// 这些值可通过 EngineViewer 的 options.shader 被外部覆盖
export const SHADER_DEFAULTS = Object.freeze({
  parallaxScale: 0.05,
  shininess: 32.0,
  cloudBlendFactor: 0.5
})

// UV 视差云膜与基础色叠加的着色器光影核心
export const materialShader = {
  uniforms: {
    baseMap: { value: null },
    cloudMap: { value: null },
    maskMap: { value: null },
    specularMap: { value: null },
    uParallaxScale: { value: SHADER_DEFAULTS.parallaxScale },
    uCameraPos: { value: new THREE.Vector3() },
    uLightDir: { value: new THREE.Vector3(1, 1, 1).normalize() },
    uAmbientColor: { value: new THREE.Color(0.2, 0.2, 0.2) },
    uLightColor: { value: new THREE.Color(1.0, 1.0, 1.0) }
  },

  vertexShader: /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */`
    uniform sampler2D baseMap;
    uniform sampler2D cloudMap;
    uniform sampler2D maskMap;
    uniform sampler2D specularMap;

    uniform float uParallaxScale;
    uniform vec3 uCameraPos;
    uniform vec3 uLightDir;
    uniform vec3 uAmbientColor;
    uniform vec3 uLightColor;

    varying vec2 vUv;
    varying vec3 vWorldPos;
    varying vec3 vNormal;

    // 常量提取 (CC-175: Replace Magic Numbers)
    const float SHININESS = ${SHADER_DEFAULTS.shininess};
    const float CLOUD_BLEND = ${SHADER_DEFAULTS.cloudBlendFactor};

    void main() {
      // 1. 基础纹理
      vec4 baseColor = texture2D(baseMap, vUv);

      // 2. 视差偏移 UV
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      vec2 parallaxUv = vUv + viewDir.xy * uParallaxScale * -1.0;
      vec4 cloudColor = texture2D(cloudMap, parallaxUv);

      // 3. Lambert 漫反射
      float diff = max(dot(vNormal, uLightDir), 0.0);
      vec3 diffuse = uLightColor * diff;

      // 4. Blinn-Phong 高光
      vec4 specData = texture2D(specularMap, vUv);
      float specIntensity = specData.r;
      vec3 reflectDir = reflect(-uLightDir, vNormal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), SHININESS);
      vec3 specularHighlight = uLightColor * spec * specIntensity;

      // 5. 最终合成
      vec3 finalColor = (baseColor.rgb + cloudColor.rgb * CLOUD_BLEND) * (uAmbientColor + diffuse) + specularHighlight;
      gl_FragColor = vec4(finalColor, baseColor.a);
    }
  `
}
