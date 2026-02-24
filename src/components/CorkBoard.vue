<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCorkboardStore } from '@/stores/corkboard'
import BoardItem from './BoardItem.vue'
import StringLayer from './StringLayer.vue'
import BoardToolbar from './BoardToolbar.vue'
import ItemAside from './ItemAside.vue'

const store = useCorkboardStore()

const boardRef = ref(null)
const pointerPos = ref({ x: 0, y: 0 })
const hoveredItemId = ref(null)
const selectedItemId = ref(null)

const activeItem = computed(() => {
  const id = selectedItemId.value ?? hoveredItemId.value
  return id ? (store.items.find((i) => i.id === id) ?? null) : null
})

const dimmedIds = computed(() => {
  if (!hoveredItemId.value) return new Set()
  const lit = new Set([hoveredItemId.value])
  for (const c of store.connections) {
    if (c.fromId === hoveredItemId.value) lit.add(c.toId)
    if (c.toId === hoveredItemId.value) lit.add(c.fromId)
  }
  return new Set(store.items.map((i) => i.id).filter((id) => !lit.has(id)))
})

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

function onItemHover(id) {
  hoveredItemId.value = id
}

function onItemSelect(id) {
  selectedItemId.value = selectedItemId.value === id ? null : id
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
      :hovered-item-id="hoveredItemId"
      @remove-connection="store.removeConnection"
    />

    <BoardItem
      v-for="item in store.items"
      :key="item.id"
      :item="item"
      :connect-mode="store.connectMode"
      :dimmed="dimmedIds.has(item.id)"
      @drag="onDrag"
      @pin-click="onPinClick"
      @delete="store.deleteItem"
      @hover="onItemHover"
      @select="onItemSelect"
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

    <ItemAside :item="activeItem" />
  </div>
</template>

<style scoped>
.cork-board {
  position: fixed;
  inset: 0;
  overflow: hidden;

  background-image: url('@/assets/background.png');
  background-repeat: repeat;
  background-size: auto;
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
