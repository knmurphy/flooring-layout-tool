<template>
  <el-card class="toolbox" :body-style="{ padding: '0px' }" v-draggable>
    <template #header>
      <div class="card-header">
        <span>Drawing Tools</span>
      </div>
    </template>
    <el-menu class="tool-menu">
      <el-menu-item 
        v-for="tool in tools" 
        :key="tool.name" 
        @click="setTool(tool.name)"
        :class="{ 'is-active': selectedTool === tool.name }"
      >
        <el-icon><component :is="tool.icon" /></el-icon>
        <span>{{ tool.label }}</span>
      </el-menu-item>
    </el-menu>
    <MaterialPalette @patternSelected="onPatternSelected" />
  </el-card>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Crop, Star } from '@element-plus/icons-vue'
import MaterialPalette from './MaterialPalette.vue'

export default defineComponent({
  name: 'DrawingToolbox',
  components: {
    Crop,
    Star,
    MaterialPalette
  },
  setup(props, { emit }) {
    const tools = [
      { name: 'rectangle', label: 'Rectangle', icon: 'Crop' },
      { name: 'polygon', label: 'Polygon', icon: 'Star' },
    ]
    const selectedTool = ref('')

    const setTool = (tool) => {
      selectedTool.value = tool
      emit('toolSelected', tool)
    }

    const onPatternSelected = (pattern) => {
      emit('patternSelected', pattern)
    }

    return {
      tools,
      selectedTool,
      setTool,
      onPatternSelected
    }
  }
})
</script>

<style scoped>
.toolbox {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
}

.is-active {
  background-color: #ecf5ff;
}
</style>
