<script setup lang="ts">
import { keysApi } from "@/api/keys";
import GroupInfoCard from "@/components/keys/GroupInfoCard.vue";
import GroupList from "@/components/keys/GroupList.vue";
import KeyTable from "@/components/keys/KeyTable.vue";
import type { Group } from "@/types/models";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const groups = ref<Group[]>([]);
const loading = ref(false);
const selectedGroup = ref<Group | null>(null);
const router = useRouter();
const route = useRoute();

onMounted(async () => {
  await loadGroups();
});

async function loadGroups() {
  try {
    loading.value = true;
    groups.value = await keysApi.getGroups();
    // Select default group
    if (groups.value.length > 0 && !selectedGroup.value) {
      const groupId = route.query.groupId;
      const found = groups.value.find(g => String(g.id) === String(groupId));
      if (found) {
        selectedGroup.value = found;
      } else {
        handleGroupSelect(groups.value[0]);
      }
    }
  } finally {
    loading.value = false;
  }
}

function handleGroupSelect(group: Group | null) {
  selectedGroup.value = group || null;
  if (String(group?.id) !== String(route.query.groupId)) {
    router.push({ name: "keys", query: { groupId: group?.id || "" } });
  }
}

async function handleGroupRefresh() {
  await loadGroups();
  if (selectedGroup.value) {
    // Reload current selected group info
    handleGroupSelect(groups.value.find(g => g.id === selectedGroup.value?.id) || null);
  }
}

async function handleGroupRefreshAndSelect(targetGroupId: number) {
  await loadGroups();
  // After refresh, switch to specified group
  const targetGroup = groups.value.find(g => g.id === targetGroupId);
  if (targetGroup) {
    handleGroupSelect(targetGroup);
  }
}

function handleGroupDelete(deletedGroup: Group) {
  // Remove deleted group from group list
  groups.value = groups.value.filter(g => g.id !== deletedGroup.id);

  // If deleted group was currently selected, switch to first group
  if (selectedGroup.value?.id === deletedGroup.id) {
    handleGroupSelect(groups.value.length > 0 ? groups.value[0] : null);
  }
}
</script>

<template>
  <div class="keys-container">
    <div class="sidebar">
      <group-list
        :groups="groups"
        :selected-group="selectedGroup"
        :loading="loading"
        @group-select="handleGroupSelect"
        @refresh="handleGroupRefresh"
        @refresh-and-select="handleGroupRefreshAndSelect"
      />
    </div>

    <!-- Right main content area, 80% width -->
    <div class="main-content">
      <!-- Group info card, more compact -->
      <div class="group-info">
        <group-info-card
          :group="selectedGroup"
          @refresh="handleGroupRefresh"
          @delete="handleGroupDelete"
        />
      </div>

      <!-- Key table section, main space -->
      <div class="key-table-section">
        <key-table :selected-group="selectedGroup" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.keys-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.sidebar {
  width: 100%;
  flex-shrink: 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-info {
  flex-shrink: 0;
}

.key-table-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

@media (min-width: 768px) {
  .keys-container {
    flex-direction: row;
  }

  .sidebar {
    width: 240px;
    height: calc(100vh - 159px);
  }
}
</style>
