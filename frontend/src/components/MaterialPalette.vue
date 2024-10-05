<template>
  <div class="material-palette">
    <el-divider>Materials</el-divider>
    <el-menu class="material-menu">
      <el-menu-item v-for="pattern in patterns" :key="pattern.name" @click="selectPattern(pattern)">
        <el-icon><Brush /></el-icon>
        <span>{{ pattern.name }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Brush } from '@element-plus/icons-vue'

export default defineComponent({
  name: 'MaterialPalette',
  components: {
    Brush
  },
  setup() {
    const patterns = ref([
      { name: 'Hardwood', fill: '#8B4513' },
      { name: 'Tile', fill: '#D3D3D3' },
      { name: 'Carpet', fill: '#DEB887' },
    ])

    const selectPattern = (selectedPattern) => {
      console.log('Selected pattern:', selectedPattern)
      // Implement pattern selection logic
    }

    return {
      patterns,
      selectPattern
    }
  }
})
</script>
