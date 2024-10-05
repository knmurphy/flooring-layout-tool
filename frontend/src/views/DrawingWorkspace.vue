<template>
  <div class="workspace">
    <h2>Drawing Workspace</h2>
    <FloorPlan />
  </div>
</template>

<script>
import FloorPlan from '../components/FloorPlan.vue';

export default {
  name: 'DrawingWorkspace',
  components: {
    FloorPlan,
  },
};
</script>

<style scoped>
.workspace {
  padding: 20px;
}
</style>
