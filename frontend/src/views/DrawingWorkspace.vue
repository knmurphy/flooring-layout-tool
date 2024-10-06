<template>
  <div class="drawing-workspace">
    <FloorPlan 
      ref="floorPlan"
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
      @updateShape="onUpdateShape"
    />
  </div>
</template>

<script>
import { defineComponent, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import FloorPlan from '@/components/FloorPlan.vue'
import Toolbox from '@/components/Toolbox.vue'

export default defineComponent({
  name: 'DrawingWorkspace',
  components: {
    FloorPlan,
    Toolbox
  },
  setup() {
    const route = useRoute()
    const fileId = computed(() => route.params.fileId || '')
    const selectedTool = ref('cursor')
    const selectedPattern = ref({ name: 'Default', fill: '#cccccc' })
    const selectedShape = ref(null)
    const floorPlan = ref(null)

    const onToolSelected = (tool) => {
      selectedTool.value = tool
    }

    const onShapeSelected = (shape) => {
      selectedShape.value = shape
    }

    const onPatternSelected = (pattern) => {
      selectedPattern.value = pattern
    }

    const onShapeUpdated = (shape) => {
      console.log('Shape updated:', shape)
      // Implement any necessary logic for shape updates
    }

    const onUpdateShape = (updates) => {
      console.log('Shape updates:', updates)
      if (floorPlan.value) {
        floorPlan.value.updateSelectedShape(updates)
      }
    }

    return {
      fileId,
      selectedTool,
      selectedPattern,
      selectedShape,
      floorPlan,
      onToolSelected,
      onShapeSelected,
      onPatternSelected,
      onShapeUpdated,
      onUpdateShape
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

