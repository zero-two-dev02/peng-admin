import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { errorMessage } from "../utils/errors";
export async function confirmAction(message: string) {
  try {
    await ElMessageBox.confirm(message, "确认操作", {
      type: "warning",
      confirmButtonText: "确认执行",
      cancelButtonText: "取消",
      dangerouslyUseHTMLString: false,
    });
    return true;
  } catch {
    return false;
  }
}
export function useMutation() {
  const saving = ref(false);
  const saveError = ref("");
  async function run(
    action: () => Promise<unknown>,
    onSuccess?: () => Promise<unknown> | void,
    confirmation?: string,
  ) {
    if (saving.value) return false;
    saving.value = true;
    saveError.value = "";
    try {
      if (confirmation && !(await confirmAction(confirmation))) return false;
      await action();
      ElMessage.success("操作成功");
      await onSuccess?.();
      return true;
    } catch (error) {
      saveError.value = errorMessage(error);
      return false;
    } finally {
      saving.value = false;
    }
  }
  return { saving, saveError, run };
}
