<script setup>
defineProps({
  connectMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['add-card', 'cancel-connect'])
</script>

<template>
  <div class="toolbar">
    <button class="btn" @click="emit('add-card')">+ Card</button>
    <button v-if="connectMode" class="btn btn-cancel" @click="emit('cancel-connect')">
      ✕ Cancel Connect
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  position: fixed;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
  z-index: 9000;
}

.btn {
  padding: 8px 14px;
  border: none;
  border-radius: 4px;
  background: #2c3e50;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  letter-spacing: 0.03em;
  transition: background 0.15s;
}

.btn:hover {
  background: #3d556b;
}

.btn-cancel {
  background: #c0392b;
}

.btn-cancel:hover {
  background: #e74c3c;
}
</style>
