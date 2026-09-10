import { onScopeDispose, ref, shallowRef } from "vue";
import { errorMessage, normalizeError } from "../utils/errors";
export function useQuery<T>(loader: (signal: AbortSignal) => Promise<T>) {
  const data = shallowRef<T>();
  const loading = ref(false);
  const error = ref("");
  let sequence = 0;
  let controller: AbortController | undefined;
  async function load() {
    const current = ++sequence;
    controller?.abort();
    controller = new AbortController();
    loading.value = true;
    error.value = "";
    try {
      const result = await loader(controller.signal);
      if (current === sequence) data.value = result;
    } catch (failure) {
      if (current === sequence && normalizeError(failure).kind !== "cancelled")
        error.value = errorMessage(failure);
    } finally {
      if (current === sequence) loading.value = false;
    }
  }
  onScopeDispose(() => {
    sequence++;
    controller?.abort();
  });
  return { data, loading, error, load };
}
