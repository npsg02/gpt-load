<script setup lang="ts">
import { logApi } from "@/api/logs";
import type { LogFilter, RequestLog } from "@/types/models";
import { maskKey } from "@/utils/display";
import { DownloadOutline, EyeOffOutline, EyeOutline, Search } from "@vicons/ionicons5";
import {
  NButton,
  NDataTable,
  NDatePicker,
  NEllipsis,
  NIcon,
  NInput,
  NSelect,
  NSpace,
  NSpin,
  NTag,
} from "naive-ui";
import { computed, h, onMounted, reactive, ref, watch } from "vue";

interface LogRow extends RequestLog {
  is_key_visible: boolean;
}

// Data
const loading = ref(false);
const logs = ref<LogRow[]>([]);
const currentPage = ref(1);
const pageSize = ref(15);
const total = ref(0);
const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

// Filters
const filters = reactive({
  group_name: "",
  key_value: "",
  model: "",
  is_success: "" as "true" | "false" | "",
  status_code: "",
  source_ip: "",
  error_contains: "",
  start_time: null as number | null,
  end_time: null as number | null,
});

const successOptions = [
  { label: "Status", value: "" },
  { label: "Success", value: "true" },
  { label: "Failed", value: "false" },
];

// Fetch data
const loadLogs = async () => {
  loading.value = true;
  try {
    const params: LogFilter = {
      page: currentPage.value,
      page_size: pageSize.value,
      group_name: filters.group_name || undefined,
      key_value: filters.key_value || undefined,
      model: filters.model || undefined,
      is_success: filters.is_success === "" ? undefined : filters.is_success === "true",
      status_code: filters.status_code ? parseInt(filters.status_code, 10) : undefined,
      source_ip: filters.source_ip || undefined,
      error_contains: filters.error_contains || undefined,
      start_time: filters.start_time ? new Date(filters.start_time).toISOString() : undefined,
      end_time: filters.end_time ? new Date(filters.end_time).toISOString() : undefined,
    };

    const res = await logApi.getLogs(params);
    if (res.code === 0 && res.data) {
      logs.value = res.data.items.map(log => ({ ...log, is_key_visible: false }));
      total.value = res.data.pagination.total_items;
    } else {
      logs.value = [];
      total.value = 0;
      window.$message.error(res.message || "Failed to load logs", {
        keepAliveOnHover: true,
        duration: 5000,
        closable: true,
      });
    }
  } catch (_error) {
    window.$message.error("Failed to load logs request");
  } finally {
    loading.value = false;
  }
};

const formatDateTime = (timestamp: string) => {
  if (!timestamp) {
    return "-";
  }
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-");
};

const toggleKeyVisibility = (row: LogRow) => {
  row.is_key_visible = !row.is_key_visible;
};

// Columns definition
const createColumns = () => [
  {
    title: "Time",
    key: "timestamp",
    width: 160,
    render: (row: LogRow) => formatDateTime(row.timestamp),
  },
  {
    title: "Status",
    key: "is_success",
    width: 50,
    render: (row: LogRow) =>
      h(
        NTag,
        { type: row.is_success ? "success" : "error", size: "small", round: true },
        { default: () => (row.is_success ? "Success" : "Failed") }
      ),
  },
  {
    title: "Type",
    key: "is_stream",
    width: 50,
    render: (row: LogRow) =>
      h(
        NTag,
        { type: row.is_stream ? "info" : "default", size: "small", round: true },
        { default: () => (row.is_stream ? "Stream" : "Non-stream") }
      ),
  },
  { title: "Status Code", key: "status_code", width: 60 },
  { title: "Duration(ms)", key: "duration_ms", width: 80 },
  { title: "Retries", key: "retries", width: 50 },
  { title: "Group", key: "group_name", width: 120 },
  { title: "Model", key: "model", width: 300 },
  {
    title: "Key",
    key: "key_value",
    width: 200,
    render: (row: LogRow) =>
      h(NSpace, { align: "center", wrap: false }, () => [
        h(
          NEllipsis,
          { style: "max-width: 150px" },
          { default: () => (row.is_key_visible ? row.key_value : maskKey(row.key_value || "")) }
        ),
        h(
          NButton,
          { size: "tiny", text: true, onClick: () => toggleKeyVisibility(row) },
          {
            icon: () =>
              h(NIcon, null, { default: () => h(row.is_key_visible ? EyeOffOutline : EyeOutline) }),
          }
        ),
      ]),
  },
  {
    title: "Request Path",
    key: "request_path",
    width: 220,
    render: (row: LogRow) =>
      h(NEllipsis, { style: "max-width: 200px" }, { default: () => row.request_path }),
  },
  {
    title: "Upstream Address",
    key: "upstream_addr",
    width: 220,
    render: (row: LogRow) =>
      h(NEllipsis, { style: "max-width: 200px" }, { default: () => row.upstream_addr }),
  },
  { title: "Source IP", key: "source_ip", width: 140 },
  {
    title: "Error Message",
    width: 270,
    key: "error_message",
    render: (row: LogRow) =>
      h(NEllipsis, { style: "max-width: 250px" }, { default: () => row.error_message || "-" }),
  },
  {
    title: "User Agent",
    key: "user_agent",
    width: 220,
    render: (row: LogRow) =>
      h(NEllipsis, { style: "max-width: 200px" }, { default: () => row.user_agent }),
  },
];

const columns = createColumns();

// Lifecycle and Watchers
onMounted(loadLogs);
watch([currentPage, pageSize], loadLogs);

const handleSearch = () => {
  currentPage.value = 1;
  loadLogs();
};

const resetFilters = () => {
  filters.group_name = "";
  filters.key_value = "";
  filters.model = "";
  filters.is_success = "";
  filters.status_code = "";
  filters.source_ip = "";
  filters.error_contains = "";
  filters.start_time = null;
  filters.end_time = null;
  handleSearch();
};

const exportLogs = () => {
  const params: Omit<LogFilter, "page" | "page_size"> = {
    group_name: filters.group_name || undefined,
    key_value: filters.key_value || undefined,
    model: filters.model || undefined,
    is_success: filters.is_success === "" ? undefined : filters.is_success === "true",
    status_code: filters.status_code ? parseInt(filters.status_code, 10) : undefined,
    source_ip: filters.source_ip || undefined,
    error_contains: filters.error_contains || undefined,
    start_time: filters.start_time ? new Date(filters.start_time).toISOString() : undefined,
    end_time: filters.end_time ? new Date(filters.end_time).toISOString() : undefined,
  };
  logApi.exportLogs(params);
};

function changePage(page: number) {
  currentPage.value = page;
}

function changePageSize(size: number) {
  pageSize.value = size;
  currentPage.value = 1;
}
</script>

<template>
  <div class="log-table-container">
    <n-space vertical>
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="filter-section">
          <div class="filter-row">
            <div class="filter-grid">
              <div class="filter-item">
                <n-select
                  v-model:value="filters.is_success"
                  :options="successOptions"
                  size="small"
                  @update:value="handleSearch"
                />
              </div>
              <div class="filter-item">
                <n-input
                  v-model:value="filters.status_code"
                  placeholder="Status Code"
                  size="small"
                  clearable
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="filter-item">
                <n-input
                  v-model:value="filters.group_name"
                  placeholder="Group Name"
                  size="small"
                  clearable
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="filter-item">
                <n-input
                  v-model:value="filters.model"
                  placeholder="Model"
                  size="small"
                  clearable
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="filter-item">
                <n-input
                  v-model:value="filters.key_value"
                  placeholder="Key"
                  size="small"
                  clearable
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="filter-item">
                <n-date-picker
                  v-model:value="filters.start_time"
                  type="datetime"
                  clearable
                  size="small"
                  placeholder="Start Time"
                />
              </div>
              <div class="filter-item">
                <n-date-picker
                  v-model:value="filters.end_time"
                  type="datetime"
                  clearable
                  size="small"
                  placeholder="End Time"
                />
              </div>
              <div class="filter-item">
                <n-input
                  v-model:value="filters.error_contains"
                  placeholder="Error Message"
                  size="small"
                  clearable
                  @keyup.enter="handleSearch"
                />
              </div>
              <div class="filter-actions">
                <n-button ghost size="small" :disabled="loading" @click="handleSearch">
                  <template #icon>
                    <n-icon :component="Search" />
                  </template>
                  Search
                </n-button>
                <n-button size="small" @click="resetFilters">Reset</n-button>
                <n-button size="small" type="primary" ghost @click="exportLogs">
                  <template #icon>
                    <n-icon :component="DownloadOutline" />
                  </template>
                  Export Keys
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="table-main">
        <!-- Table -->
        <div class="table-container">
          <n-spin :show="loading">
            <n-data-table
              :columns="columns"
              :data="logs"
              :bordered="false"
              remote
              size="small"
              :scroll-x="1840"
            />
          </n-spin>
        </div>

        <!-- Pagination -->
        <div class="pagination-container">
          <div class="pagination-info">
            <span>Total {{ total }} records</span>
            <n-select
              v-model:value="pageSize"
              :options="[
                { label: '15/page', value: 15 },
                { label: '30/page', value: 30 },
                { label: '50/page', value: 50 },
                { label: '100/page', value: 100 },
              ]"
              size="small"
              style="width: 100px; margin-left: 12px"
              @update:value="changePageSize"
            />
          </div>
          <div class="pagination-controls">
            <n-button
              size="small"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
            >
              Previous
            </n-button>
            <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <n-button
              size="small"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
            >
              Next
            </n-button>
          </div>
        </div>
      </div>
    </n-space>
  </div>
</template>

<style scoped>
.log-table-container {
  /* background: white; */
  /* border-radius: 8px; */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  /* height: 100%; */
}
.toolbar {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end; /* Aligns buttons with the bottom of the filter items */
  gap: 16px;
}

.filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex: 1 1 auto; /* Let it take available space and wrap */
}

.filter-item {
  flex: 1 1 180px; /* Each item will have a base width of 180px and can grow */
  min-width: 180px; /* Prevent from becoming too narrow */
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .filter-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  .filter-actions .n-button {
    width: 100%;
  }
}

.table-main {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}
.table-container {
  /* background: white;
  border-radius: 8px; */
  flex: 1;
  overflow: auto;
  position: relative;
}
.empty-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}
.pagination-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
}
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.page-info {
  font-size: 13px;
  color: #666;
}
</style>
