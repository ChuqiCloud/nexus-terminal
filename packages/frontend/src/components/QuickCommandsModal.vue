<script setup lang="ts">
import { defineProps, defineEmits, watch, onMounted, onUnmounted } from 'vue';
import QuickCommandsView from '../views/QuickCommandsView.vue';
import { useWorkspaceEventSubscriber } from '../composables/workspaceEvents';

const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'execute-command', command: string): void;
}>();

const closeModal = () => {
  emit('close');
};

const handleCommandExecute = (command: string) => {
  emit('execute-command', command);
  closeModal();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleKeydown);
  } else {
    document.removeEventListener('keydown', handleKeydown);
  }
});

const onWorkspaceEvent = useWorkspaceEventSubscriber();

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

onMounted(() => {
  onWorkspaceEvent('terminal:sendCommand', () => {
    console.log('[QuickCommandsModal] Received terminal:sendCommand event, closing modal.');
    closeModal();
  });
});
</script>

<template>
  <div v-if="isVisible" class="qcm-overlay" @click.self="closeModal">
    <div class="qcm-panel" role="dialog" aria-modal="true" aria-labelledby="quick-commands-title">
      <header class="qcm-header">
        <div class="qcm-header__left">
          <i class="fas fa-bolt qcm-header__icon"></i>
          <h3 id="quick-commands-title" class="qcm-title">快捷指令</h3>
        </div>
        <button class="qcm-close" @click="closeModal" title="关闭" type="button">
          <i class="fas fa-times"></i>
        </button>
      </header>

      <div class="qcm-body">
        <QuickCommandsView @execute-command="handleCommandExecute" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.qcm-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.78);
}

.qcm-panel {
  --qcm-bg: #000000;
  --qcm-border: rgba(94, 94, 94, 0.55);
  --qcm-border-soft: rgba(167, 167, 167, 0.1);
  --qcm-text: #ffffff;
  --qcm-muted: #a7a7a7;
  --qcm-dim: #757575;
  --qcm-accent: #76b900;
  --qcm-accent-soft: rgba(118, 185, 0, 0.12);
  display: flex;
  width: min(100%, 560px);
  max-height: 85vh;
  min-height: min(640px, 85vh);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--qcm-border);
  border-radius: 2px;
  background: var(--qcm-bg);
  box-shadow: rgba(0, 0, 0, 0.3) 0 0 5px 0;
  color: var(--qcm-text);
}

.qcm-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--qcm-border-soft);
  background: var(--qcm-bg);
}

.qcm-header__left {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.qcm-header__icon {
  color: var(--qcm-accent);
  font-size: 12px;
}

.qcm-title {
  margin: 0;
  overflow: hidden;
  color: var(--qcm-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qcm-close {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 2px;
  background: transparent;
  color: var(--qcm-dim);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.qcm-close:hover {
  border-color: var(--qcm-accent);
  background: var(--qcm-accent-soft);
  color: var(--qcm-accent);
}

.qcm-close i,
.qcm-close .fas {
  color: currentColor;
  font-size: 12px;
}

.qcm-body {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

:global(html.light) .qcm-overlay,
:global(body.light) .qcm-overlay,
:global([data-theme="light"]) .qcm-overlay {
  background: rgba(0, 0, 0, 0.48);
}

:global(html.light) .qcm-panel,
:global(body.light) .qcm-panel,
:global([data-theme="light"]) .qcm-panel {
  --qcm-bg: #f5f5f7;
  --qcm-border: rgba(0, 0, 0, 0.12);
  --qcm-border-soft: rgba(0, 0, 0, 0.08);
  --qcm-text: #1d1d1f;
  --qcm-muted: rgba(0, 0, 0, 0.8);
  --qcm-dim: rgba(0, 0, 0, 0.48);
  --qcm-accent: #0071e3;
  --qcm-accent-soft: rgba(0, 113, 227, 0.1);
  box-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px 0;
}

@media (max-width: 640px) {
  .qcm-overlay {
    padding: 8px;
  }

  .qcm-panel {
    min-height: 70vh;
    max-height: calc(100vh - 16px);
  }
}
</style>
