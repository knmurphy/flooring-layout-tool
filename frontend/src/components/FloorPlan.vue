<template>
  <div ref="konvaContainer" class="konva-container"></div>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import Konva from 'konva'
import { openDB } from 'idb'
import { convertPDFToImage } from '../utils/pdfUtils'

export default defineComponent({
  name: 'FloorPlan',
  props: {
    fileId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const konvaContainer = ref(null)
    const stage = ref(null)
    const layer = ref(null)
    const backgroundGroup = ref(null)

    const initKonva = () => {
      stage.value = new Konva.Stage({
        container: konvaContainer.value,
        width: konvaContainer.value.offsetWidth,
        height: konvaContainer.value.offsetHeight,
      })
      layer.value = new Konva.Layer()
      backgroundGroup.value = new Konva.Group()
      layer.value.add(backgroundGroup.value)
      stage.value.add(layer.value)
    }

    const loadPDFBackground = async () => {
      if (!props.fileId) {
        console.warn('No fileId provided')
        return
      }

      try {
        const db = await openDB('PDFStorage', 1)
        const file = await db.get('pdfs', props.fileId)
        if (file) {
          const { dataUrl, width, height } = await convertPDFToImage(file)
          const backgroundImage = new Image()
          backgroundImage.onload = () => {
            const imageNode = new Konva.Image({
              image: backgroundImage,
              width: width,
              height: height,
            })
            backgroundGroup.value.add(imageNode)
            layer.value.batchDraw()
          }
          backgroundImage.src = dataUrl
        } else {
          console.warn(`No PDF found for fileId: ${props.fileId}`)
        }
      } catch (error) {
        console.error('Error loading PDF:', error)
      }
    }

    onMounted(() => {
      initKonva()
      if (props.fileId) {
        loadPDFBackground()
      }
    })

    watch(() => props.fileId, (newFileId) => {
      if (newFileId) {
        loadPDFBackground()
      }
    })

    return {
      konvaContainer
    }
  }
})
</script>

<style scoped>
.konva-container {
  width: 100%;
  height: 100%;
}
</style>