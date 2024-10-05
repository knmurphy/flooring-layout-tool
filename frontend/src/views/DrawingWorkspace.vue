<template>
  <div class="drawing-workspace">
    <FloorPlan :fileId="fileId" />
    <Toolbox />
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
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
    const fileId = ref(null)

    onMounted(() => {
      fileId.value = route.params.fileId
    })

    return {
      fileId
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

