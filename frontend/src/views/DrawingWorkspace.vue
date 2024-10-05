<template>
  <div class="drawing-workspace">
    <FloorPlan :fileId="$route.params.fileId" />
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import FloorPlan from '@/components/FloorPlan.vue'

export default defineComponent({
  name: 'DrawingWorkspace',
  components: {
    FloorPlan
  }
})
</script>

