<script setup lang="ts">
import { copy } from "@/utils/clipboard";
import { Copy, Key } from "@vicons/ionicons5";
import { NButton, NIcon, NInput, NInputNumber, NModal, NSpace, useMessage } from "naive-ui";
import { ref } from "vue";

interface Props {
  modelValue: string;
  placeholder?: string;
  size?: "small" | "medium" | "large";
}

interface Emits {
  (e: "update:modelValue", value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Multiple keys separated by commas",
  size: "small",
});

const emit = defineEmits<Emits>();

const message = useMessage();

// Key generator modal related
const showKeyGeneratorModal = ref(false);
const keyCount = ref(1);
const isGenerating = ref(false);

// Generate random string
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate keys
function generateKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < keyCount.value; i++) {
    keys.push(`sk-${generateRandomString(48)}`);
  }
  return keys;
}

// Open key generator modal
function openKeyGenerator() {
  showKeyGeneratorModal.value = true;
  keyCount.value = 1;
}

// Confirm generate keys
function confirmGenerateKeys() {
  if (isGenerating.value) {
    return;
  }

  try {
    isGenerating.value = true;
    const newKeys = generateKeys();
    const currentValue = props.modelValue || "";

    let updatedValue = currentValue.trim();

    // Handle comma compatibility
    if (updatedValue && !updatedValue.endsWith(",")) {
      updatedValue += ",";
    }

    // Add newly generated keys
    if (updatedValue) {
      updatedValue += newKeys.join(",");
    } else {
      updatedValue = newKeys.join(",");
    }

    emit("update:modelValue", updatedValue);
    showKeyGeneratorModal.value = false;

    message.success(`Successfully generated ${keyCount.value} keys`);
  } finally {
    isGenerating.value = false;
  }
}

// Copy proxy keys
async function copyProxyKeys() {
  const proxyKeys = props.modelValue || "";
  if (!proxyKeys.trim()) {
    message.warning("No keys to copy");
    return;
  }

  // Convert comma-separated keys to line-separated
  const formattedKeys = proxyKeys
    .split(",")
    .map(key => key.trim())
    .filter(key => key.length > 0)
    .join("\n");

  const success = await copy(formattedKeys);
  if (success) {
    message.success("Keys copied to clipboard");
  } else {
    message.error("Copy failed, please copy manually");
  }
}

// Handle input value change
function handleInput(value: string) {
  emit("update:modelValue", value);
}
</script>

<template>
  <div class="proxy-keys-input">
    <n-input
      :value="modelValue"
      :placeholder="placeholder"
      clearable
      :size="size"
      @update:value="handleInput"
    >
      <template #suffix>
        <n-space :size="4" :wrap-item="false">
          <n-button text type="primary" :size="size" @click="openKeyGenerator">
            <template #icon>
              <n-icon :component="Key" />
            </template>
            Generate
          </n-button>
          <n-button text type="tertiary" :size="size" @click="copyProxyKeys" style="opacity: 0.7">
            <template #icon>
              <n-icon :component="Copy" />
            </template>
            Copy
          </n-button>
        </n-space>
      </template>
    </n-input>

    <!-- Key generator modal -->
    <n-modal
      v-model:show="showKeyGeneratorModal"
      preset="dialog"
      title="Generate Proxy Keys"
      positive-text="Confirm Generation"
      negative-text="Cancel"
      :positive-button-props="{ loading: isGenerating }"
      @positive-click="confirmGenerateKeys"
    >
      <n-space vertical :size="16">
        <div>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px">
            Please enter the number of keys to generate (max 100):
          </p>
          <n-input-number
            v-model:value="keyCount"
            :min="1"
            :max="100"
            placeholder="Enter quantity"
            style="width: 100%"
            :disabled="isGenerating"
          />
        </div>
        <div style="color: #999; font-size: 12px; line-height: 1.4">
          <p>Generated keys will be appended to the current input content, separated by commas</p>
        </div>
      </n-space>
    </n-modal>
  </div>
</template>

<style scoped>
.proxy-keys-input {
  width: 100%;
}
</style>
