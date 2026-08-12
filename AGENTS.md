# yudao-admin 教学协作规则

称呼我为主人。

如果发现我的需求设计不合理，请不要执行；先指出架构问题、扩展性问题、安全问题和维护成本，再和我一起重新设计方案。

## DeepSeek 全局委派规则

- 对实现、调试、原型、受限重构、测试、机械修改、日志分析和文档初稿，先判断委派是否真正节省时间；适合时自动使用 `$delegate-deepseek`，不为了委派而委派。
- 简单、机械、独立、低风险且容易验证的任务，优先通过 OpenCode 使用 `deepseek/deepseek-v4-flash`。
- 中等复杂、多文件、约束较多且适合委派的任务，优先通过 OpenCode 使用 `deepseek/deepseek-v4-pro`。
- 安全、认证、授权、支付、事务、并发、数据一致性、数据库迁移、生产配置、不可逆操作和核心架构由 Codex 直接处理；用户要亲自学习的核心逻辑默认不委派。
- 不通过 Claude Code 执行本委派流程。
- 常规委派无需逐次征求批准，但开始时简短告知。新增权限、安装依赖、扩大写入范围、显著费用、凭据使用、不可逆操作或重要产品决策仍需先获得批准。
- DeepSeek 只提供候选实现；Codex 必须审查完整差异、修复问题、运行相关验证，并在最终结果中报告模型、参与范围、耗时、Token、费用、缺陷、修复、验证证据和未验证项。
- 如果 OpenCode、指定模型或必要权限不可用，Codex 直接继续处理并说明原因，不得无界重试或重复发送大型提示词。

## 目标与边界

- 工作区：`D:\java-projects\yudao-admin`
- 从零逐步开发本项目的 Vue 3 管理端；不得复制或改造 `D:\java-projects\admin` 中的既有模板代码。
- 后端工作区：`D:\java-projects\yudao-cloud`。公开接口、权限码和后端完成状态以该项目的 `AGENTS.md` 与 API 契约为准。
- 前后端是独立 Git 仓库；一次提交不得混入另一方的文件。

## 技术基线

- Vue 3、Vite、TypeScript、pnpm。
- 已按需引入 Vue Router、Pinia、Axios；后续组件库、权限框架、菜单框架仍按功能边界逐步引入。

## 开发与教学规则

1. 每次开始前读取本文件；联调或消费新接口前，同时检查后端 `D:\java-projects\yudao-cloud\AGENTS.md`。
2. 一次只完成一个可验证的前端边界：工程基础、登录态、路由、页面、API 客户端或具体管理功能。
3. API 类型、请求地址和响应 JSON 属于前后端契约；不得猜测后端字段。
4. 默认由学习者完成页面结构、状态流转和核心交互；Codex 先搭文件、类型和可编译框架，除非学习者明确要求代写。
5. 提交前运行最小相关检查，并按逻辑职责做原子提交。

## 当前进度

- 已创建 Vue 3 + TypeScript + Vite 基础工程，并完成依赖安装与独立 Git 初始化。
- 已完成最小渲染链路讲解与默认欢迎页替换。
- 已接入 Vue Router，并完成首页、登录页、404、顶部导航和受保护路由守卫。
- 已接入 Pinia 与 Axios，完成真实登录、内存登录态、Bearer Token 请求拦截、无效 Token 清理、读取当前用户和注销登录。
- 已完成用户列表分页页：`GET /system/user/page`，支持用户名和状态筛选、第一页自动加载、上一页/下一页。
- 已完成角色列表页：`GET /system/role/list`，展示启用角色的 code/name。
- 已完成权限列表页：`GET /system/permission/list`，展示权限 code/name。
- 已完成用户已分配角色查看：`GET /system/user/role-list`，展示用户当前角色 code/name/status。
- 已完成角色已分配权限查看：`GET /system/role/permission-codes`，展示角色当前权限 code。
- 已完成角色分页列表：`GET /system/role/page`，支持角色编码和状态筛选。
- 已完成用户基本信息更新：`PUT /system/user/update`，只更新昵称和状态。
- 已完成用户角色分配：`PUT /system/user/assign-roles`，用完整角色编码集合替换用户角色。
- 已完成角色权限分配：`PUT /system/role/assign-permissions`，通过确认提示后用完整权限编码集合替换角色权限。
- 已完成用户密码重置：`PUT /system/user/reset-password`，前端不回显密码，并提示重置会使目标用户的当前登录态失效。
- 已完成角色基本信息编辑与删除：`PUT /system/role/update`、`DELETE /system/role/delete`，删除前要求确认。
- 已完成权限名称编辑与删除：`PUT /system/permission/update`、`DELETE /system/permission/delete`，删除前要求确认。

## 下一步

- 后续可继续推进用户、角色、权限的创建操作，或进入菜单与前端细粒度权限控制；涉及授权、删除、重置密码等高风险写操作时先讲清楚边界。
- 写接口前先读后端契约；前端权限控制仅改善体验，后端接口鉴权仍是安全边界。
