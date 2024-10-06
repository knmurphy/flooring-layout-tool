<template>
  <div class="drawing-workspace">
    <FloorPlan 
      :fileId="fileId" 
      :selectedTool="selectedTool" 
      :selectedPattern="selectedPattern" 
      @shapeSelected="onShapeSelected"
      @shapeUpdated="onShapeUpdated"
    />
    <Toolbox 
      :selectedTool="selectedTool"
      @toolSelected="onToolSelected" 
      @patternSelected="onPatternSelected"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import FloorPlan from '@/components/FloorPlan.vue'
import Toolbox from '@/components/Toolbox.vue'

export default defineComponent({
  components: { FloorPlan, Toolbox },
  setup() {
    const route = useRoute()
    const fileId = computed(() => route.params.fileId || '')
    const selectedTool = ref('cursor')
    const selectedPattern = ref({ name: 'Default', fill: '#cccccc' })

    const onToolSelected = (tool) => {
      selectedTool.value = tool
    }

    const onPatternSelected = (pattern) => {
      selectedPattern.value = pattern
    }

    const onShapeSelected = (shape) => {
      console.log('Shape selected:', shape)
    }

    const onShapeUpdated = (shape) => {
      console.log('Shape updated:', shape)
    }

    return {
      fileId,
      selectedTool,
      selectedPattern,
      onToolSelected,
      onPatternSelected,
      onShapeSelected,
      onShapeUpdated
    }
  }
})
</script>

<style scoped>
.drawing-workspace {
  position: relative;
  height: 100vh;
  width: 100%;
}

.konva-container {
  z-index: 1;
}

.toolbox {
  z-index: 2;
}
</style>

