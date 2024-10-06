<template>
  <el-card class="toolbox" :body-style="{ padding: '0px' }" v-draggable>
    <template #header>
      <div class="card-header">
        <span>Drawing Tools</span>
      </div>
    </template>
    <el-menu class="tool-menu">
      <el-menu-item 
        @click="setTool('cursor')"
        :class="{ 'is-active': selectedTool === 'cursor' }"
      >
        <el-icon><Pointer /></el-icon>
        <span>Select</span>
      </el-menu-item>
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
import { Crop, Star, Pointer } from '@element-plus/icons-vue'
import MaterialPalette from './MaterialPalette.vue'

export default defineComponent({
  name: 'DrawingToolbox',
  components: {
    Crop,
    Star,
    Pointer,
    MaterialPalette
  },
  props: {
    selectedTool: {
      type: String,
      default: 'cursor'
    }
  },
  emits: ['toolSelected', 'patternSelected'],
  setup(props, { emit }) {
    const tools = ref([
      { name: 'rectangle', label: 'Rectangle', icon: 'Crop' },
      { name: 'polygon', label: 'Polygon', icon: 'Star' },
    ])

    const setTool = (toolName) => {
      emit('toolSelected', toolName)
    }

    const onPatternSelected = (pattern) => {
      emit('patternSelected', pattern)
    }

    return {
      tools,
      setTool,
      onPatternSelected
    }
  }
})
</script>

<style scoped>
.toolbox {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
}

.tool-menu {
  border-right: none;
}
</style>
