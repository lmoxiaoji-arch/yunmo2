export const crafts = [
  {
    id: 'litho-a',
    name: '精微光刻阵列 (A型)',
    description: '采用高解析度激光直写技术，适用于0.5微米级精度的掩模制作。',
    thumbnail: 'https://picsum.photos/400/300?random=1',
    fullImage: 'https://picsum.photos/1200/800?random=1',
    details: {
      intro: '本工艺基于355nm固体激光器，通过动态聚焦系统实现大面积均匀曝光。',
      recommendedSize: '100mm x 100mm',
      pros: '高精度，低成本，无需物理掩模。',
      cons: '对环境振动敏感，吞吐量较低。'
    }
  },
  {
    id: 'litho-b',
    name: '纳米压印模板 (B型)',
    description: '通过物理压印实现纳米级图形转移，是大规模量产的理想选择。',
    thumbnail: 'https://picsum.photos/400/300?random=2',
    fullImage: 'https://picsum.photos/1200/800?random=2',
    details: {
      intro: '使用高硬度模板与紫外固化树脂，单步即可完成全场制备。',
      recommendedSize: '2英寸 - 6英寸',
      pros: '超高分辨率（<10nm），生产效率高。',
      cons: '模板制造成本高，易受颗粒污染。'
    }
  },
  {
    id: 'litho-c',
    name: '多重曝光复合工艺',
    description: '结合光刻与等离子蚀刻，实现超越瑞利极限的特征尺寸。',
    thumbnail: 'https://picsum.photos/400/300?random=3',
    fullImage: 'https://picsum.photos/1200/800?random=3',
    details: {
      intro: '通过LELE（Litho-Etch-Litho-Etch）流程，将间距减半。',
      recommendedSize: 'Silicon Wafer 8-inch',
      pros: '极大提升晶圆利用率。',
      cons: '流程极度复杂，良率控制难度大。'
    }
  }
]
