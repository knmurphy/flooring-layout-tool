<template>
  <div class="drawing-workspace">
    <FloorPlan :fileId="fileId" :selectedTool="selectedTool" :selectedPattern="selectedPattern" />
    <Toolbox @toolSelected="onToolSelected" @patternSelected="onPatternSelected" />
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
    const selectedTool = ref('')
    const selectedPattern = ref({ name: 'Default', fill: '#cccccc' })

    const onToolSelected = (tool) => {
      selectedTool.value = tool
    }

    const onPatternSelected = (pattern) => {
      selectedPattern.value = pattern
    }

    return {
      fileId,
      selectedTool,
      selectedPattern,
      onToolSelected,
      onPatternSelected
    }
  }
})
</script>

<style scoped>
.drawing-workspace {
  position: relative;
  height: 100%;
}
</style>

