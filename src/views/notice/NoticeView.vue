<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { notices } from "../../api/notices";
import type { Notice, NoticeDetail } from "../../types/operations";
import { useAuthStore } from "../../stores/auth";
import { useQuery } from "../../composables/useQuery";
import { useMutation } from "../../composables/useMutation";
import { displayTime, localToUtcInput } from "../../utils/safety";
import PageHeader from "../../components/PageHeader.vue";
import QueryState from "../../components/QueryState.vue";
import PagePagination from "../../components/PagePagination.vue";
const auth = useAuthStore();
const filter = reactive({ title: "", status: "" });
const applied = ref({ ...filter });
const page = ref(1);
const dialog = ref(false);
const editing = ref<NoticeDetail>();
const form = reactive({ title: "", summary: "", content: "" });
const detailId = ref(0);
const detailOpen = ref(false);
const scheduleOpen = ref(false);
const scheduled = ref<Notice>();
const publishTime = ref("");
const { data, loading, error, load } = useQuery((signal) =>
  notices.page(
    {
      pageNo: page.value,
      pageSize: 20,
      title: applied.value.title || undefined,
      status:
        applied.value.status === "" ? undefined : Number(applied.value.status),
    },
    signal,
  ),
);
const detail = useQuery(() => notices.get(detailId.value));
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
function create() {
  editing.value = undefined;
  Object.assign(form, { title: "", summary: "", content: "" });
  saveError.value = "";
  dialog.value = true;
}
async function show(row: Notice) {
  detailId.value = row.id;
  detailOpen.value = true;
  await detail.load();
}
function edit() {
  const value = detail.data.value;
  if (!value || value.status !== 0) return;
  editing.value = { ...value };
  Object.assign(form, {
    title: value.title,
    summary: value.summary,
    content: value.content,
  });
  saveError.value = "";
  dialog.value = true;
}
async function save() {
  await run(
    () =>
      editing.value
        ? notices.update({
            ...form,
            id: editing.value.id,
            version: editing.value.version,
          })
        : notices.create({ ...form }),
    async () => {
      dialog.value = false;
      await load();
      if (detailOpen.value) await detail.load();
    },
  );
}
async function action(row: Notice, kind: "publish" | "offline" | "delete") {
  await run(
    () =>
      kind === "delete" ? notices.delete(row.id) : notices.action(kind, row.id),
    load,
    `确认${{ publish: "发布", offline: "下线", delete: "删除" }[kind]}公告「${row.title}」？`,
  );
}
function schedule(row: Notice) {
  scheduled.value = row;
  publishTime.value = "";
  saveError.value = "";
  scheduleOpen.value = true;
}
async function saveSchedule() {
  await run(
    async () => {
      if (
        !publishTime.value ||
        new Date(publishTime.value).getTime() <= Date.now()
      )
        throw new Error("请选择未来时间。");
      return notices.action(
        "schedule",
        scheduled.value!.id,
        localToUtcInput(publishTime.value),
      );
    },
    async () => {
      scheduleOpen.value = false;
      await load();
    },
    `确认定时发布公告「${scheduled.value?.title}」？时间以您浏览器所在时区输入。`,
  );
}
onMounted(load);
</script>
<template>
  <PageHeader
    title="公告管理"
    description="草稿 → 发布/定时发布 → 下线。编辑使用服务端版本号。"
    ><el-button
      v-if="auth.hasPermission('notice:create')"
      type="primary"
      @click="create"
      >创建公告</el-button
    ></PageHeader
  >
  <form class="filter-bar" @submit.prevent="search">
    <label>标题<input v-model.trim="filter.title" maxlength="128" /></label
    ><label
      >状态<select v-model="filter.status">
        <option value="">全部</option>
        <option value="0">草稿</option>
        <option value="1">已发布/待定时生效</option>
        <option value="2">已下线</option>
      </select></label
    ><el-button type="primary" native-type="submit" :loading="loading"
      >查询</el-button
    >
  </form>
  <el-alert
    v-if="saveError && !dialog && !scheduleOpen"
    :title="saveError"
    type="error"
    :closable="false"
  />
  <section class="surface">
    <QueryState
      :loading="loading"
      :error="error"
      :empty="data?.list.length === 0"
      @retry="load"
      ><el-table :data="data?.list ?? []"
        ><el-table-column prop="id" label="ID" width="80" /><el-table-column
          prop="title"
          label="标题"
          min-width="200"
        /><el-table-column
          prop="summary"
          label="摘要"
          min-width="200"
        /><el-table-column label="状态" width="150"
          ><template #default="{ row }"
            ><el-tag>{{
              ["草稿", "已发布/定时", "已下线"][row.status] ?? "未知"
            }}</el-tag></template
          ></el-table-column
        ><el-table-column
          prop="version"
          label="版本"
          width="80"
        /><el-table-column label="发布时间（本地）" min-width="200"
          ><template #default="{ row }">{{
            displayTime(row.publishTime, true)
          }}</template></el-table-column
        ><el-table-column label="操作" min-width="300"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="show(row)"
              >详情/编辑</el-button
            ><el-button
              v-if="row.status === 0 && auth.hasPermission('notice:publish')"
              link
              type="primary"
              :disabled="saving"
              @click="action(row, 'publish')"
              >发布</el-button
            ><el-button
              v-if="row.status === 0 && auth.hasPermission('notice:publish')"
              link
              type="primary"
              @click="schedule(row)"
              >定时</el-button
            ><el-button
              v-if="row.status === 1 && auth.hasPermission('notice:offline')"
              link
              type="warning"
              :disabled="saving"
              @click="action(row, 'offline')"
              >下线</el-button
            ><el-button
              v-if="row.status !== 1 && auth.hasPermission('notice:delete')"
              link
              type="danger"
              :disabled="saving"
              @click="action(row, 'delete')"
              >删除</el-button
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
  <el-drawer v-model="detailOpen" title="公告详情" size="min(760px, 94vw)"
    ><QueryState
      :loading="detail.loading.value"
      :error="detail.error.value"
      @retry="detail.load"
      ><template v-if="detail.data.value"
        ><h2>{{ detail.data.value.title }}</h2>
        <p>{{ detail.data.value.summary }}</p>
        <p>
          版本 {{ detail.data.value.version }} · 状态
          {{ ["草稿", "已发布/定时", "已下线"][detail.data.value.status] }}
        </p>
        <div class="plain-content">{{ detail.data.value.content }}</div>
        <el-button @click="detail.load">重新读取</el-button
        ><el-button
          v-if="
            detail.data.value.status === 0 &&
            auth.hasPermission('notice:update')
          "
          type="primary"
          @click="edit"
          >编辑草稿</el-button
        ></template
      ></QueryState
    ></el-drawer
  >
  <el-dialog
    v-model="dialog"
    :title="editing ? '编辑草稿' : '创建公告'"
    width="min(720px, 94vw)"
    :close-on-click-modal="false"
    :show-close="!saving"
    :close-on-press-escape="!saving"
    ><form class="editor-form" @submit.prevent="save">
      <fieldset :disabled="saving">
        <label
          >标题<input
            v-model.trim="form.title"
            maxlength="128"
            required /></label
        ><label
          >摘要<textarea
            v-model.trim="form.summary"
            maxlength="255"
            required
          /></label
        ><label
          >正文（纯文本）<textarea
            v-model="form.content"
            maxlength="16000"
            rows="10"
            required
          />
        </label>
      </fieldset>
      <p v-if="editing">
        版本
        {{
          editing.version
        }}。冲突后关闭此编辑框，重新读取详情再修改；不会自动覆盖。
      </p>
      <el-alert
        v-if="saveError"
        :title="saveError"
        type="error"
        :closable="false"
      />
      <div class="actions">
        <el-button :disabled="saving" @click="dialog = false">取消</el-button
        ><el-button type="primary" native-type="submit" :loading="saving"
          >保存公告</el-button
        >
      </div>
    </form></el-dialog
  >
  <el-dialog
    v-model="scheduleOpen"
    title="定时发布"
    width="min(520px, 94vw)"
    :close-on-click-modal="false"
    :show-close="!saving"
    :close-on-press-escape="!saving"
    ><form class="editor-form" @submit.prevent="saveSchedule">
      <label
        >发布时间（浏览器本地时区）<input
          v-model="publishTime"
          :disabled="saving"
          type="datetime-local"
          required
      /></label>
      <p>
        将转换为 UTC 提交。设置后状态为已发布，但到达发布时间前公开接口不可见。
      </p>
      <el-alert
        v-if="saveError"
        :title="saveError"
        type="error"
        :closable="false"
      /><el-button type="primary" native-type="submit" :loading="saving"
        >确认定时发布</el-button
      >
    </form></el-dialog
  >
</template>
