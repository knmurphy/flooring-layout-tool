<template>
  <div class="material-palette">
    <el-divider>Materials</el-divider>
    <el-menu class="material-menu">
      <el-menu-item 
        v-for="pattern in patterns" 
        :key="pattern.name" 
        @click="selectPattern(pattern)"
        :class="{ 'is-active': selectedPattern === pattern }"
      >
        <el-icon><Brush /></el-icon>
        <span>{{ pattern.name }}</span>
        <div class="color-preview" :style="{ backgroundColor: pattern.fill }"></div>
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
  setup(props, { emit }) {
    const patterns = ref([
      { name: 'Hardwood', fill: '#8B4513' },
      { name: 'Tile', fill: '#D3D3D3' },
      { name: 'Carpet', fill: '#DEB887' },
    ])
    const selectedPattern = ref(null)

    const selectPattern = (pattern) => {
      selectedPattern.value = pattern
      emit('patternSelected', pattern)
      console.log('Selected pattern:', pattern)
    }

    return {
      patterns,
      selectedPattern,
      selectPattern
    }
  }
})
</script>

<style scoped>
.material-menu .el-menu-item {
  display: flex;
  align-items: center;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-left: auto;
}

.is-active {
  background-color: #ecf5ff;
}
</style>
