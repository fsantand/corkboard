<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCorkboardStore } from '@/stores/corkboard'
import BoardItem from './BoardItem.vue'
import StringLayer from './StringLayer.vue'
import BoardToolbar from './BoardToolbar.vue'

const store = useCorkboardStore()

const boardRef = ref(null)
const pointerPos = ref({ x: 0, y: 0 })

function onPointerMove(e) {
  if (!boardRef.value) return
  const rect = boardRef.value.getBoundingClientRect()
  pointerPos.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

function onDrag(id, x, y) {
  if (!boardRef.value) return
  const board = boardRef.value
  // Clamp so items stay within the board
  const clampedX = Math.max(0, Math.min(x, board.offsetWidth - 20))
  const clampedY = Math.max(0, Math.min(y, board.offsetHeight - 20))
  store.moveItem(id, clampedX, clampedY)
}

function onPinClick(id) {
  if (!store.connectMode) {
    store.startConnect(id)
  } else {
    store.finishConnect(id)
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') store.cancelConnect()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    ref="boardRef"
    class="cork-board"
    :class="{ 'connect-mode': store.connectMode }"
    @pointermove="onPointerMove"
  >
    <StringLayer
      :items="store.items"
      :connections="store.connections"
      :connect-mode="store.connectMode"
      :connect-from="store.connectFrom"
      :pointer-pos="pointerPos"
    />

    <BoardItem
      v-for="item in store.items"
      :key="item.id"
      :item="item"
      :connect-mode="store.connectMode"
      @drag="onDrag"
      @pin-click="onPinClick"
      @delete="store.deleteItem"
    />

    <BoardToolbar
      :connect-mode="store.connectMode"
      @add-card="store.addItem"
      @cancel-connect="store.cancelConnect"
    />

    <!-- Connect mode hint -->
    <div v-if="store.connectMode" class="connect-hint">
      Click another pin to connect, or press Esc to cancel
    </div>
  </div>
</template>

<style scoped>
.cork-board {
  position: fixed;
  inset: 0;
  overflow: hidden;

  /* Cork base color */
  background-color: #c8a96e;

  /* Layered cork grain texture */
  background-image:
    radial-gradient(ellipse 2px 3px at 15% 25%, rgba(90, 55, 10, 0.25) 0%, transparent 100%),
    radial-gradient(ellipse 3px 2px at 42% 68%, rgba(90, 55, 10, 0.2) 0%, transparent 100%),
    radial-gradient(ellipse 2px 4px at 73% 12%, rgba(90, 55, 10, 0.22) 0%, transparent 100%),
    radial-gradient(ellipse 3px 2px at 88% 55%, rgba(90, 55, 10, 0.18) 0%, transparent 100%),
    radial-gradient(ellipse 2px 3px at 60% 80%, rgba(90, 55, 10, 0.25) 0%, transparent 100%),
    radial-gradient(ellipse 4px 2px at 30% 90%, rgba(90, 55, 10, 0.2) 0%, transparent 100%),
    radial-gradient(ellipse 2px 3px at 5% 50%, rgba(90, 55, 10, 0.18) 0%, transparent 100%),
    radial-gradient(ellipse 3px 2px at 95% 20%, rgba(90, 55, 10, 0.22) 0%, transparent 100%),
    radial-gradient(circle 4px at 20% 40%, rgba(120, 70, 15, 0.3) 0%, transparent 70%),
    radial-gradient(circle 3px at 55% 30%, rgba(120, 70, 15, 0.25) 0%, transparent 70%),
    radial-gradient(circle 5px at 80% 70%, rgba(120, 70, 15, 0.2) 0%, transparent 70%),
    radial-gradient(circle 4px at 10% 75%, rgba(120, 70, 15, 0.28) 0%, transparent 70%),
    radial-gradient(circle 3px at 70% 50%, rgba(120, 70, 15, 0.22) 0%, transparent 70%),
    radial-gradient(circle 2px at 35% 55%, rgba(220, 180, 100, 0.4) 0%, transparent 100%),
    radial-gradient(circle 2px at 65% 20%, rgba(220, 180, 100, 0.35) 0%, transparent 100%),
    radial-gradient(circle 2px at 90% 35%, rgba(220, 180, 100, 0.3) 0%, transparent 100%),
    radial-gradient(circle 2px at 48% 85%, rgba(220, 180, 100, 0.38) 0%, transparent 100%),
    linear-gradient(135deg, #d4a96a 0%, #c09050 40%, #b8884a 70%, #c8a060 100%);

  box-shadow: inset 0 0 80px rgba(80, 40, 0, 0.45);
}

.cork-board.connect-mode {
  cursor: crosshair;
}

.connect-hint {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  z-index: 9000;
  letter-spacing: 0.02em;
}
</style>
