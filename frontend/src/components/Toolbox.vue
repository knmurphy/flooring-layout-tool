<template>
  <el-card class="toolbox" :body-style="{ padding: '0px' }" v-draggable>
    <template #header>
      <div class="card-header">
        <span>Drawing Tools</span>
      </div>
    </template>
    <el-menu class="tool-menu">
      <el-menu-item index="1" @click="setTool('rectangle')">
        <el-icon><Crop /></el-icon>
        <span>Rectangle</span>
      </el-menu-item>
      <el-menu-item index="2" @click="setTool('polygon')">
        <el-icon><Star /></el-icon>
        <span>Polygon</span>
      </el-menu-item>
    </el-menu>
    <MaterialPalette />
  </el-card>
</template>

<script>
import { defineComponent } from 'vue'
import { Crop, Star } from '@element-plus/icons-vue'
import MaterialPalette from './MaterialPalette.vue'

export default defineComponent({
  name: 'DrawingToolbox',
  components: {
    Crop,
    Star,
    MaterialPalette
  },
  setup() {
    const setTool = (selectedTool) => {
      console.log('Selected tool:', selectedTool)
      // Implement tool selection logic
    }

    return {
      setTool
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
</style>
