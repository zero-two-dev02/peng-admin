# Yudao 运营管理端

本仓库保留参考工程的 MIT 许可与上游署名，详见 [LICENSE](LICENSE) 和
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

Vue 3 + TypeScript + Vite + Pinia + Vue Router + Axios + Element Plus。仅对接当前 yudao-cloud 已支持的运营管理能力，无生产 Mock 数据，不包含买家端。

当前目录为 `D:\java-projects\yudao-cloud\yudao-admin`，保留独立 Git 仓库。2026-09-09 第一阶段已重新通过 53 项单元/组件测试、类型检查与生产构建、17 项隔离浏览器测试；这不是本轮真实后端联调。详细记录见后端 `docs/delivery/phase-1.md`。

## 启动

```powershell
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 15174 --strictPort
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Windows 若 pnpm exec 无法解析命令，可使用项目 node_modules/.bin 下的 .cmd。若缓存位置与既有 node_modules 不一致，请沿用原 store-dir，不修改全局设置。Node 24 已验证；交付栈固定使用 15174 并禁止 Vite 静默改端口。

移动项目目录后不要直接沿用 `node_modules`：其中可能仍有指向旧目录的链接。保留旧依赖目录后，按锁文件重新安装；本轮旧目录保留为 `node_modules.phase1-backup`，已忽略。不要删除或重生成锁文件来掩盖依赖路径故障。

复制 .env.example 为 .env.development（不放凭据），开发请求固定浏览器 /api → Gateway 48080。API_PROXY_TARGET 仅由 Vite 配置读取。所有 VITE_* 都会公开给浏览器，不能放任何密码、Token、密钥。

## 会话安全

访问 Token 与权限快照仅在 Pinia 内存。刷新、新标签页、关闭页面后重新登录。登录后返回经过校验的站内路径；不提供刷新 Token，也不保存密码。权限仅控制 UI，后端才是授权边界。认证服务不可用不会当成 Token 失效。真实权限不足进入独立 403，可重新读取 /system/auth/me。

禁止前端访问支付回调及 Order/Inventory 内部接口。公告和商品描述均按文本渲染。不读取或记录敏感请求正文，不开启真实登录 trace/video/screenshot。

## 本地后端

在后端仓库根目录运行隔离交付栈。它创建只绑定 `127.0.0.1` 的临时 MySQL、Nacos、Redis、RabbitMQ，
执行全部 Flyway，并启动 Gateway、7 个业务服务和当前前端；不会复用本机 3306 数据库或既有容器。

```powershell
# 在后端工作区；首次缺少 JAR 时追加 -Build
.\infra\local-stack\start.ps1
.\infra\local-stack\status.ps1
.\infra\local-stack\acceptance.ps1
# 安全复制随机管理员密码，使用后清空剪贴板
.\infra\local-stack\copy-admin-password.ps1
# 验收结束后删除隔离容器与运行凭据
.\infra\local-stack\stop.ps1
```

前端目录的 `.\scripts\local-stack.ps1` 是上述后端启动器的薄封装。默认管理员用户名为 `peng_admin`，
密码、数据库凭据、服务账号和支付沙箱密钥均在每次启动时随机生成；受保护运行资料和日志位于被忽略的
`.delivery-local/local-stack/`。启动成功后访问 `http://127.0.0.1:15174`。完整说明与证据见后端
`infra/local-stack/README.md` 和 `docs/delivery/phase-2.md`。

## 生产部署

构建 dist，配置 Web 服务器静态托管及 SPA 回退。生产不能依赖 Vite proxy。示例 Nginx（部署时按网络与 TLS 实际情况调整，以下不执行部署）：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:48080/;
    proxy_set_header Host $host;
    proxy_set_header X-Request-Id $http_x_request_id;
}
location / {
    try_files $uri $uri/ /index.html;
}
```

/api/ 代理去掉 /api 前缀。生产必须使用 HTTPS；仅开放 Gateway，不公开业务服务和管理端口。安全响应头/CSP 要结合静态资源验证后配置。禁止记录认证请求正文或敏感 Header。

## 文档与验证

- [页面、接口、权限](docs/page-api-permissions.md)
- [后端缺口与契约限制](docs/backend-gaps.md)
- [验收记录](docs/acceptance.md)
- [管理员订单查询与详情交付记录](docs/delivery/order-admin.md)

隔离测试的假数据只存在 tests/，不会进入生产页面。Playwright 默认使用已安装的 Edge；如需其他浏览器，请调整测试配置并安装官方浏览器依赖。默认关闭 trace、视频、自动失败截图，以免真实凭据流入测试报告。
