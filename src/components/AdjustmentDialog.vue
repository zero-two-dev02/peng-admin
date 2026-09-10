<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { ElMessage } from "element-plus";
import { members } from "../api/members";
import { inventory } from "../api/inventory";
import { confirmAction } from "../composables/useMutation";
import { errorMessage, normalizeError } from "../utils/errors";
import { newBusinessNo } from "../utils/safety";
const props = defineProps<{
  modelValue: boolean;
  mode: "points" | "stock" | "initialize";
  initialTarget?: number;
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; done: [] }>();
const form = reactive({
  target: 0,
  changeValue: 1,
  businessType: "ADMIN_ADJUST",
  businessNo: "",
  remark: "",
});
const saving = ref(false);
const uncertain = ref(false);
const verifiedAbsent = ref(false);
const error = ref("");
const submitted = ref<typeof form>();
onBeforeRouteLeave(() => {
  if (!saving.value && !uncertain.value) return true;
  ElMessage.warning(
    "操作仍在提交或结果待核实，请留在当前页保留业务号并先查询流水。",
  );
  return false;
});
function preventLostIntent(event: BeforeUnloadEvent) {
  if (saving.value || uncertain.value) {
    event.preventDefault();
    event.returnValue = "";
  }
}
onMounted(() => window.addEventListener("beforeunload", preventLostIntent));
onBeforeUnmount(() =>
  window.removeEventListener("beforeunload", preventLostIntent),
);
const title = computed(() =>
  props.mode === "points"
    ? "人工积分调整"
    : props.mode === "initialize"
      ? "库存初始化"
      : "库存调整",
);
watch(
  () => props.modelValue,
  (open) => {
    if (open && !uncertain.value) {
      Object.assign(form, {
        target: props.initialTarget ?? 0,
        changeValue: 1,
        businessType:
          props.mode === "initialize" ? "ADMIN_INIT" : "ADMIN_ADJUST",
        businessNo: newBusinessNo(),
        remark: "",
      });
      error.value = "";
    }
  },
);
function close() {
  if (!saving.value && !uncertain.value) emit("update:modelValue", false);
}
async function submit() {
  if (saving.value || (uncertain.value && !verifiedAbsent.value)) return;
  if (
    form.target <= 0 ||
    !Number.isSafeInteger(form.target) ||
    !Number.isInteger(form.changeValue) ||
    form.changeValue === 0
  ) {
    error.value = "目标 ID 必须为正整数，调整数量必须为非零整数。";
    return;
  }
  saving.value = true;
  const payload =
    uncertain.value && submitted.value ? submitted.value : { ...form };
  try {
    if (
      !(await confirmAction(
        `${title.value}\n目标 ${props.mode === "points" ? "System 用户 ID" : "SKU ID"}：${payload.target}\n变动：${payload.changeValue > 0 ? "+" : ""}${payload.changeValue}\n业务类型：${payload.businessType}\n业务号：${payload.businessNo}\n原因：${payload.remark}\n确认目标和变动均准确？`,
      ))
    )
      return;
    submitted.value = payload;
    verifiedAbsent.value = false;
    const common = {
      businessType: payload.businessType,
      businessNo: payload.businessNo,
      changeValue: payload.changeValue,
      remark: payload.remark,
    };
    const result =
      props.mode === "points"
        ? await members.adjust({ ...common, memberUserId: payload.target })
        : props.mode === "initialize"
          ? await inventory.initialize({
              skuId: payload.target,
              initialStock: payload.changeValue,
              businessType: payload.businessType,
              businessNo: payload.businessNo,
              remark: payload.remark,
            })
          : await inventory.adjust({ ...common, skuId: payload.target });
    if (!result) {
      uncertain.value = true;
      error.value =
        "业务号已存在，本次未新增。请核对原流水，不要更换业务号重复提交。";
      return;
    }
    uncertain.value = false;
    ElMessage.success("调整成功，已刷新关联数据。");
    emit("done");
    emit("update:modelValue", false);
  } catch (failure) {
    uncertain.value = normalizeError(failure).uncertain;
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
async function verify() {
  if (saving.value || !submitted.value) return;
  saving.value = true;
  const payload = submitted.value;
  try {
    const query = {
      businessType: payload.businessType,
      businessNo: payload.businessNo,
      pageNo: 1,
      pageSize: 20,
    };
    const result =
      props.mode === "points"
        ? await members.records({ ...query, memberUserId: payload.target })
        : await inventory.records({ ...query, skuId: payload.target });
    const record = result.list.find(
      (row) =>
        row.businessNo === payload.businessNo &&
        row.changeValue === payload.changeValue &&
        row.remark === payload.remark,
    );
    if (record) {
      uncertain.value = false;
      emit("done");
      emit("update:modelValue", false);
      ElMessage.success("已查到匹配流水，确认本次业务已生效。");
    } else {
      verifiedAbsent.value = result.list.length === 0;
      error.value =
        result.list.length === 0
          ? "本次查询未找到流水，结果仍待核实。若重试，只能使用已锁定的同一请求。保留业务号并联系管理员核查。"
          : "该业务号存在内容不一致的流水，禁止重试或更换业务号。请保留当前业务号并联系管理员核查。";
    }
  } catch (failure) {
    error.value = errorMessage(failure);
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="min(600px, 94vw)"
    :close-on-click-modal="false"
    :close-on-press-escape="!uncertain && !saving"
    :show-close="!uncertain && !saving"
    @close="close"
  >
    <el-alert
      v-if="mode === 'points'"
      title="接口 memberUserId 实际接收 System 用户 ID，不是会员档案 ID。后端会自动激活会员，请只填写已经核实的用户。"
      type="warning"
      :closable="false"
    />
    <form class="editor-form" @submit.prevent="submit">
      <fieldset :disabled="saving || uncertain">
        <label
          >{{ mode === "points" ? "System 用户 ID" : "SKU ID"
          }}<input
            v-model.number="form.target"
            type="number"
            min="1"
            step="1"
            required /></label
        ><label
          >{{
            mode === "initialize"
              ? "初始库存（必须大于零）"
              : "变动量（正数增加，负数减少）"
          }}<input
            v-model.number="form.changeValue"
            type="number"
            :min="
              mode === 'initialize' ? 1 : mode === 'points' ? -100000 : -1000000
            "
            :max="mode === 'points' ? 100000 : 1000000"
            step="1"
            required /></label
        ><label
          >业务类型<input
            v-model.trim="form.businessType"
            maxlength="32"
            required /></label
        ><label
          >业务号（本次意图固定）<input
            v-model="form.businessNo"
            readonly
            required /></label
        ><label
          >调整原因<textarea
            v-model.trim="form.remark"
            maxlength="255"
            required
          />
        </label>
      </fieldset>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <div class="actions">
        <el-button v-if="!uncertain" :disabled="saving" @click="close"
          >取消</el-button
        ><el-button v-if="uncertain" :loading="saving" @click="verify"
          >先查询核实</el-button
        ><el-button
          type="primary"
          native-type="submit"
          :loading="saving"
          :disabled="uncertain && !verifiedAbsent"
          >{{ uncertain ? "以原业务号重试" : "确认调整" }}</el-button
        >
      </div>
    </form></el-dialog
  >
</template>
