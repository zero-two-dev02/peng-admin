<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { products } from "../../api/products";
import type { Spu, SpuDetail, Sku } from "../../types/operations";
import { useAuthStore } from "../../stores/auth";
import { useQuery } from "../../composables/useQuery";
import { useMutation } from "../../composables/useMutation";
import { fenToYuan, yuanToFen } from "../../utils/safety";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
import PagePagination from "../../components/PagePagination.vue";
const auth = useAuthStore();
const filter = reactive({ code: "", name: "", categoryId: "", status: "" });
const applied = ref({ ...filter });
const page = ref(1);
const selectedId = ref(0);
const drawer = ref(false);
const editor = ref(false);
const editing = ref<SpuDetail>();
const form = reactive({
  code: "",
  name: "",
  categoryId: 0,
  description: "",
  skus: [{ code: "", specification: "", yuan: "0.00" }],
});
const skuOpen = ref(false);
const selectedSku = ref<Sku>();
const skuForm = reactive({ specification: "", yuan: "0.00" });
const { data, loading, error, load } = useQuery((signal) =>
  products.page(
    {
      pageNo: page.value,
      pageSize: 20,
      code: applied.value.code || undefined,
      name: applied.value.name || undefined,
      categoryId: applied.value.categoryId
        ? Number(applied.value.categoryId)
        : undefined,
      status:
        applied.value.status === "" ? undefined : Number(applied.value.status),
    },
    signal,
  ),
);
const detail = useQuery(() => products.detail(selectedId.value));
const categories = useQuery(products.categories);
const { saving, saveError, run } = useMutation();
function search() {
  applied.value = { ...filter };
  page.value = 1;
  void load();
}
function change(value: number) {
  page.value = value;
  void load();
}
async function show(row: Spu) {
  selectedId.value = row.id;
  drawer.value = true;
  saveError.value = "";
  await detail.load();
}
function create() {
  editing.value = undefined;
  Object.assign(form, {
    code: "",
    name: "",
    categoryId: 0,
    description: "",
    skus: [{ code: "", specification: "", yuan: "0.00" }],
  });
  saveError.value = "";
  editor.value = true;
  if (auth.hasPermission("product:category:read")) void categories.load();
}
function edit() {
  const item = detail.data.value;
  if (!item) return;
  editing.value = { ...item };
  Object.assign(form, {
    code: item.code,
    name: item.name,
    categoryId: item.categoryId,
    description: item.description,
  });
  saveError.value = "";
  editor.value = true;
  if (auth.hasPermission("product:category:read")) void categories.load();
}
async function refresh() {
  await load();
  if (drawer.value) await detail.load();
}
async function save() {
  await run(
    async () =>
      editing.value
        ? products.update({
            id: editing.value.id,
            version: editing.value.version,
            categoryId: form.categoryId,
            name: form.name,
            description: form.description,
          })
        : products.create({
            ...form,
            skus: form.skus.map((sku) => ({
              code: sku.code,
              specification: sku.specification,
              priceFen: yuanToFen(sku.yuan),
            })),
          }),
    async () => {
      editor.value = false;
      await refresh();
    },
  );
}
async function status(kind: "spu" | "sku", row: Spu | Sku) {
  await run(
    () =>
      products.status(kind, {
        id: row.id,
        expectedStatus: row.status,
        status: row.status === 0 ? 1 : 0,
      }),
    refresh,
    `确认将 ${row.code} ${row.status === 0 ? "上架/启用" : "下架/停用"}？将校验前置状态。`,
  );
}
async function archive(action: "archive" | "recover") {
  const row = detail.data.value;
  if (!row) return;
  await run(
    () => products.archive(action, { id: row.id, version: row.version }),
    refresh,
    `确认${action === "archive" ? "归档" : "恢复"}商品 ${row.code}？将校验版本 ${row.version}。`,
  );
}
function editSku(row: Sku) {
  selectedSku.value = { ...row };
  Object.assign(skuForm, {
    specification: row.specification,
    yuan: fenToYuan(row.priceFen),
  });
  saveError.value = "";
  skuOpen.value = true;
}
async function saveSku() {
  await run(
    () =>
      products.updateSku({
        id: selectedSku.value!.id,
        version: selectedSku.value!.version,
        specification: skuForm.specification,
        priceFen: yuanToFen(skuForm.yuan),
      }),
    async () => {
      skuOpen.value = false;
      await refresh();
    },
  );
}
onMounted(load);
</script>
<template>
  <PageHeader
    title="商品与规格"
    description="SPU 与 SKU 分层维护；价格以整数分提交，版本冲突不自动覆盖。"
    ><el-button
      v-if="auth.hasPermission('product:spu:create')"
      type="primary"
      @click="create"
      >创建商品</el-button
    ></PageHeader
  >
  <form class="filter-bar" @submit.prevent="search">
    <label>编码<input v-model.trim="filter.code" maxlength="64" /></label
    ><label>名称<input v-model.trim="filter.name" maxlength="128" /></label
    ><label
      >类目 ID<input v-model="filter.categoryId" type="number" min="1" /></label
    ><label
      >状态<select v-model="filter.status">
        <option value="">全部</option>
        <option value="0">下架</option>
        <option value="1">上架</option>
        <option value="2">归档</option>
      </select></label
    ><el-button type="primary" native-type="submit" :loading="loading"
      >查询</el-button
    >
  </form>
  <section class="surface">
    <QueryState
      :loading="loading"
      :error="error"
      :empty="data?.list.length === 0"
      @retry="load"
      ><el-table :data="data?.list ?? []"
        ><el-table-column prop="id" label="ID" width="90" /><el-table-column
          prop="code"
          label="编码"
          min-width="180"
        /><el-table-column
          prop="name"
          label="名称"
          min-width="180"
        /><el-table-column
          prop="categoryId"
          label="类目 ID"
          width="100"
        /><el-table-column label="状态" width="100"
          ><template #default="{ row }">{{
            ["下架", "上架", "归档"][row.status] ?? "未知"
          }}</template></el-table-column
        ><el-table-column label="操作" min-width="180"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="show(row)"
              >详情与 SKU</el-button
            ><el-button
              v-if="
                row.status !== 2 &&
                auth.hasPermission('product:spu:status:update')
              "
              link
              type="primary"
              :disabled="saving"
              @click="status('spu', row)"
              >{{ row.status === 0 ? "上架" : "下架" }}</el-button
            ></template
          ></el-table-column
        ></el-table
      ></QueryState
    ><PagePagination
      :page="page"
      :total="data?.total ?? 0"
      :disabled="loading"
      @change="change"
    />
  </section>
  <el-alert
    v-if="saveError && !editor && !skuOpen"
    :title="saveError"
    type="error"
    :closable="false"
  />
  <el-drawer v-model="drawer" title="商品详情与 SKU" size="min(1000px,96vw)"
    ><QueryState
      :loading="detail.loading.value"
      :error="detail.error.value"
      @retry="detail.load"
      ><template v-if="detail.data.value"
        ><h2>{{ detail.data.value.name }}</h2>
        <p>
          {{ detail.data.value.code }} · 类目
          {{ detail.data.value.categoryId }} · 版本
          {{ detail.data.value.version }} ·
          {{ ["下架", "上架", "归档"][detail.data.value.status] }}
        </p>
        <div class="plain-content">{{ detail.data.value.description }}</div>
        <div class="actions">
          <el-button @click="detail.load">重新读取</el-button
          ><el-button
            v-if="auth.hasPermission('product:spu:update')"
            type="primary"
            @click="edit"
            >编辑商品</el-button
          ><el-button
            v-if="
              detail.data.value.status !== 2 &&
              auth.hasPermission('product:spu:archive')
            "
            :disabled="saving"
            @click="archive('archive')"
            >归档</el-button
          ><el-button
            v-if="
              detail.data.value.status === 2 &&
              auth.hasPermission('product:spu:recover')
            "
            :disabled="saving"
            @click="archive('recover')"
            >恢复</el-button
          >
        </div>
        <h3>商品规格</h3>
        <el-table :data="detail.data.value.skus"
          ><el-table-column
            prop="id"
            label="SKU ID"
            width="100"
          /><el-table-column
            prop="code"
            label="编码"
            min-width="160"
          /><el-table-column
            prop="specification"
            label="规格"
            min-width="180"
          /><el-table-column label="价格（元）" width="130"
            ><template #default="{ row }">{{
              fenToYuan(row.priceFen)
            }}</template></el-table-column
          ><el-table-column label="状态" width="100"
            ><template #default="{ row }">{{
              row.status === 0 ? "下架" : "上架"
            }}</template></el-table-column
          ><el-table-column
            prop="version"
            label="版本"
            width="80"
          /><el-table-column label="操作" min-width="180"
            ><template #default="{ row }"
              ><el-button
                v-if="auth.hasPermission('product:sku:update')"
                link
                type="primary"
                @click="editSku(row)"
                >编辑</el-button
              ><el-button
                v-if="auth.hasPermission('product:sku:status:update')"
                link
                type="primary"
                :disabled="saving"
                @click="status('sku', row)"
                >{{ row.status === 0 ? "上架" : "下架" }}</el-button
              ></template
            ></el-table-column
          ></el-table
        ><el-alert
          v-if="saveError"
          :title="saveError"
          type="error"
          :closable="false" /></template></QueryState
  ></el-drawer>
  <el-dialog
    v-model="editor"
    :title="editing ? '编辑商品' : '创建商品（含初始 SKU）'"
    width="min(860px,96vw)"
    :close-on-click-modal="false"
    :show-close="!saving"
    :close-on-press-escape="!saving"
    ><form class="editor-form" @submit.prevent="save">
      <fieldset :disabled="saving">
        <label
          >商品编码<input
            v-model.trim="form.code"
            :readonly="!!editing"
            pattern="[a-z][a-z0-9-]*"
            maxlength="64"
            required /></label
        ><label
          >商品名称<input
            v-model.trim="form.name"
            maxlength="128"
            required /></label
        ><label
          >类目 ID<input
            v-model.number="form.categoryId"
            type="number"
            min="1"
            step="1"
            required
        /></label>
        <div v-if="auth.hasPermission('product:category:read')">
          <QueryState
            :loading="categories.loading.value"
            :error="categories.error.value"
            @retry="categories.load"
            ><label
              >从真实类目选择<select v-model.number="form.categoryId">
                <option :value="0">请选择</option>
                <option
                  v-for="category in categories.data.value"
                  :key="category.id"
                  :value="category.id"
                  :disabled="category.status !== 1"
                >
                  {{ category.id }} · {{ category.name
                  }}{{ category.status !== 1 ? "（停用）" : "" }}
                </option>
              </select></label
            ></QueryState
          >
        </div>
        <p v-else>没有类目目录读取权限，请输入已核实的类目 ID。</p>
        <label
          >商品描述（纯文本）<textarea
            v-model="form.description"
            maxlength="2000"
            rows="4"
          /></label
        ><template v-if="!editing"
          ><h3>初始 SKU（1—50 项）</h3>
          <div
            v-for="(sku, index) in form.skus"
            :key="index"
            class="sku-editor"
          >
            <label
              >SKU 编码<input
                v-model.trim="sku.code"
                pattern="[a-z][a-z0-9-]*"
                maxlength="64"
                required /></label
            ><label
              >规格<input
                v-model.trim="sku.specification"
                maxlength="255"
                required /></label
            ><label
              >价格（元）<input
                v-model="sku.yuan"
                inputmode="decimal"
                pattern="(0|[1-9][0-9]*)(\.[0-9]{1,2})?"
                required /></label
            ><el-button
              :disabled="form.skus.length <= 1"
              @click="form.skus.splice(index, 1)"
              >移除此行</el-button
            >
          </div>
          <el-button
            :disabled="form.skus.length >= 50"
            @click="
              form.skus.push({ code: '', specification: '', yuan: '0.00' })
            "
            >增加 SKU 行</el-button
          ></template
        >
      </fieldset>
      <p v-if="editing">
        当前版本 {{ editing.version }}。冲突后请关闭编辑框并重新读取详情。
      </p>
      <el-alert
        v-if="saveError"
        :title="saveError"
        type="error"
        :closable="false"
      /><el-button native-type="submit" type="primary" :loading="saving"
        >保存商品</el-button
      >
    </form></el-dialog
  >
  <el-dialog
    v-model="skuOpen"
    title="编辑 SKU"
    width="min(560px,94vw)"
    :close-on-click-modal="false"
    :show-close="!saving"
    :close-on-press-escape="!saving"
    ><form class="editor-form" @submit.prevent="saveSku">
      <p>SKU {{ selectedSku?.code }} · 版本 {{ selectedSku?.version }}</p>
      <label
        >规格<input
          v-model.trim="skuForm.specification"
          maxlength="255"
          required /></label
      ><label
        >价格（元）<input
          v-model="skuForm.yuan"
          inputmode="decimal"
          required /></label
      ><el-alert
        v-if="saveError"
        :title="saveError"
        type="error"
        :closable="false"
      /><el-button native-type="submit" type="primary" :loading="saving"
        >保存 SKU</el-button
      >
    </form></el-dialog
  >
</template>
