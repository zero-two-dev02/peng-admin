<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { products } from "../../api/products";
import type { Category } from "../../types/operations";
import { useAuthStore } from "../../stores/auth";
import { useQuery } from "../../composables/useQuery";
import { useMutation } from "../../composables/useMutation";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
const auth = useAuthStore();
const { data, loading, error, load } = useQuery(products.categories);
const { saving, saveError, run } = useMutation();
const open = ref(false);
const id = ref<number>();
const form = reactive({ code: "", name: "", status: 1 });
function edit(row?: Category) {
  id.value = row?.id;
  Object.assign(form, {
    code: row?.code ?? "",
    name: row?.name ?? "",
    status: row?.status ?? 1,
  });
  saveError.value = "";
  open.value = true;
}
async function save() {
  await run(
    () =>
      id.value
        ? products.updateCategory({
            id: id.value,
            name: form.name,
            status: form.status,
          })
        : products.createCategory({ code: form.code, name: form.name }),
    async () => {
      open.value = false;
      await load();
    },
  );
}
onMounted(load);
</script>
<template>
  <PageHeader
    title="商品类目"
    description="维护编码、名称和启用状态。编码不可修改；当前没有类目删除接口。"
    ><el-button
      v-if="auth.hasPermission('product:category:create')"
      type="primary"
      @click="edit()"
      >创建类目</el-button
    ></PageHeader
  >
  <section class="surface">
    <el-button :loading="loading" @click="load">刷新列表</el-button
    ><QueryState
      :loading="loading"
      :error="error"
      :empty="data?.length === 0"
      @retry="load"
      ><el-table :data="data ?? []"
        ><el-table-column prop="id" label="ID" width="100" /><el-table-column
          prop="code"
          label="编码"
          min-width="180"
        /><el-table-column
          prop="name"
          label="名称"
          min-width="200"
        /><el-table-column label="状态" width="110"
          ><template #default="{ row }"
            ><el-tag :type="row.status === 1 ? 'success' : 'info'">{{
              row.status === 1 ? "启用" : "停用"
            }}</el-tag></template
          ></el-table-column
        ><el-table-column
          v-if="auth.hasPermission('product:category:update')"
          label="操作"
          width="120"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="edit(row)"
              >编辑</el-button
            ></template
          ></el-table-column
        ></el-table
      ></QueryState
    >
  </section>
  <el-dialog
    v-model="open"
    :title="id ? '编辑类目' : '创建类目'"
    width="min(560px,94vw)"
    :close-on-click-modal="false"
    :show-close="!saving"
    :close-on-press-escape="!saving"
    ><form class="editor-form" @submit.prevent="save">
      <fieldset :disabled="saving">
        <label
          >类目编码<input
            v-model.trim="form.code"
            :readonly="!!id"
            pattern="[a-z][a-z0-9-]*"
            maxlength="64"
            required /></label
        ><label
          >名称<input v-model.trim="form.name" maxlength="64" required /></label
        ><label v-if="id"
          >状态<select v-model.number="form.status">
            <option :value="1">启用</option>
            <option :value="0">停用</option>
          </select></label
        >
      </fieldset>
      <el-alert
        v-if="saveError"
        :title="saveError"
        type="error"
        :closable="false"
      /><el-button type="primary" native-type="submit" :loading="saving"
        >保存类目</el-button
      >
    </form></el-dialog
  >
</template>
