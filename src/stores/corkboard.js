import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'corkboard-state'

export const useCorkboardStore = defineStore('corkboard', () => {
  const items = ref([])
  const connections = ref([])
  const connectMode = ref(false)
  const connectFrom = ref(null)
  let zCounter = 0

  // Bootstrap from localStorage
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      items.value = (parsed.items ?? []).map((i) => ({
        id: i.id,
        x: i.x,
        y: i.y,
        rotation: i.rotation,
        zIndex: i.zIndex,
        title: i.title ?? '',
        description: i.description ?? '',
        photoSrc: i.photoSrc ?? null,
        width: i.width ?? 200,
      }))
      connections.value = parsed.connections ?? []
      zCounter = Math.max(0, ...items.value.map((i) => i.zIndex ?? 0))
    } catch (_) {
      // ignore corrupt data
    }
  }

  // Persist on every change
  watch(
    [items, connections],
    () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ items: items.value, connections: connections.value }),
        )
      } catch (e) {
        console.warn('corkboard: localStorage quota exceeded', e)
      }
    },
    { deep: true },
  )

  function _randomRotation() {
    return Math.round((Math.random() * 16 - 8) * 10) / 10
  }

  function _spawnPosition() {
    return {
      x: 200 + Math.random() * 400,
      y: 100 + Math.random() * 300,
    }
  }

  function addItem(x, y) {
    const pos = x !== undefined && y !== undefined ? { x, y } : _spawnPosition()
    items.value.push({
      id: crypto.randomUUID(),
      x: pos.x,
      y: pos.y,
      rotation: _randomRotation(),
      zIndex: ++zCounter,
      title: '',
      description: '',
      photoSrc: null,
      width: 200,
    })
  }

  function updateItem(id, fields) {
    const item = items.value.find((i) => i.id === id)
    if (item) Object.assign(item, fields)
  }

  function moveItem(id, x, y) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.x = x
      item.y = y
      item.zIndex = ++zCounter
    }
  }

  function deleteItem(id) {
    items.value = items.value.filter((i) => i.id !== id)
    connections.value = connections.value.filter((c) => c.fromId !== id && c.toId !== id)
  }

  function startConnect(itemId) {
    connectMode.value = true
    connectFrom.value = itemId
  }

  function finishConnect(itemId) {
    if (connectFrom.value && connectFrom.value !== itemId) {
      const exists = connections.value.some(
        (c) =>
          (c.fromId === connectFrom.value && c.toId === itemId) ||
          (c.fromId === itemId && c.toId === connectFrom.value),
      )
      if (!exists) {
        connections.value.push({
          id: crypto.randomUUID(),
          fromId: connectFrom.value,
          toId: itemId,
        })
      }
    }
    cancelConnect()
  }

  function cancelConnect() {
    connectMode.value = false
    connectFrom.value = null
  }

  function removeConnection(id) {
    connections.value = connections.value.filter((c) => c.id !== id)
  }

  function importBoard(data) {
    items.value = (data.items ?? []).map((i) => ({
      id: i.id,
      x: i.x,
      y: i.y,
      rotation: i.rotation,
      zIndex: i.zIndex,
      title: i.title ?? '',
      description: i.description ?? '',
      photoSrc: i.photoSrc ?? null,
      width: i.width ?? 200,
    }))
    connections.value = data.connections ?? []
    zCounter = Math.max(0, ...items.value.map((i) => i.zIndex ?? 0))
  }

  return {
    items,
    connections,
    connectMode,
    connectFrom,
    addItem,
    updateItem,
    moveItem,
    deleteItem,
    startConnect,
    finishConnect,
    cancelConnect,
    removeConnection,
    importBoard,
  }
})
