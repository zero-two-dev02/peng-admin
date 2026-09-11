# 页面—接口—权限

全部请求通过 /api → Gateway 48080；下表省略 /api。公开成功包装为 CommonResult(code=0,data)，非零业务错误即便 HTTP 200 也显示错误。页面代码中的领域 API 与 TypeScript 类型为对应实际字段定义。

| 页面路由                 | HTTP 接口                                                                                           | UI 权限                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| /login                   | POST /system/auth/login；GET /system/auth/me                                                        | 登录本身公开；me 需会话                                                                       |
| /                        | GET /system/info；按权限列出业务入口                                                                | 登录，无业务权限也可到达                                                                      |
| /account                 | GET /system/auth/me；PUT /system/auth/update-password；POST /system/auth/logout                     | 当前会话                                                                                      |
| /system/users            | GET /system/user/page、get                                                                          | system:user:read                                                                              |
| 用户创建/编辑/删除       | POST /system/user/create；PUT /system/user/update；DELETE /system/user/delete                       | system:user:write                                                                             |
| 用户角色                 | GET /system/user/role-list；GET /system/role/list；PUT /system/user/assign-roles                    | system:user:role:read + system:role:read 加载；system:user:role:assign 提交                   |
| 用户密码重置             | PUT /system/user/reset-password                                                                     | system:user:password:reset                                                                    |
| /system/sessions         | GET /system/user/session-list；PUT /system/user/force-logout                                        | system:user:session:read；system:user:session:force-logout                                    |
| /system/roles            | GET /system/role/page、user-page                                                                    | system:role:read                                                                              |
| 角色创建/编辑            | POST /system/role/create；PUT /system/role/update                                                   | system:role:write                                                                             |
| 角色删除                 | DELETE /system/role/delete                                                                          | system:role:delete                                                                            |
| 角色权限                 | GET /system/role/permission-codes；GET /system/permission/list；PUT /system/role/assign-permissions | system:role:permission:read + system:permission:read 加载；system:role:permission:assign 提交 |
| /system/permissions      | GET /system/permission/list                                                                         | system:permission:read                                                                        |
| 权限创建/改名/删除       | POST /system/permission/create；PUT /system/permission/update；DELETE /system/permission/delete     | system:permission:write；删除为 system:permission:delete                                      |
| /system/audits           | GET /system/operation-audit/page                                                                    | system:operation-audit:read                                                                   |
| /notice                  | GET /notice/admin/page、get                                                                         | notice:read                                                                                   |
| 公告创建/编辑            | POST /notice/admin/create；PUT /notice/admin/update                                                 | notice:create；notice:update                                                                  |
| 公告生命周期             | PUT /notice/admin/publish、schedule、offline；DELETE /notice/admin/delete                           | publish/schedule 为 notice:publish；其他为 notice:offline、notice:delete                      |
| /notice/audits           | GET /notice/admin/operation-audit/page                                                              | notice:audit:read                                                                             |
| /product/categories      | GET /product/admin/category/list；POST /product/admin/category；PUT /product/admin/category/update  | product:category:read/create/update                                                           |
| /product/spu             | GET /product/admin/spu/page、get；POST /product/admin/spu；PUT /product/admin/spu/update            | product:spu:read/create/update                                                                |
| SPU 生命周期             | PUT /product/admin/spu/status、archive、recover                                                     | product:spu:status:update、product:spu:archive、product:spu:recover                           |
| SKU 编辑/上下架          | PUT /product/admin/sku/update、status                                                               | product:sku:update；product:sku:status:update                                                 |
| /member/points           | GET /member/admin/points/record-page；POST /member/admin/points/adjust                              | member:points:read；member:points:adjust                                                      |
| /inventory/stocks        | GET /inventory/admin/stock/page；POST /inventory/admin/stock/initialize、adjust                     | inventory:stock:read；inventory:stock:adjust                                                  |
| /inventory/records       | GET /inventory/admin/stock/record-page                                                              | inventory:stock:read                                                                          |
| /inventory/reservations  | GET /inventory/admin/reservations/page、event-list                                                  | inventory:reservation:read                                                                    |
| /payment/orders          | GET /payment/admin/orders                                                                           | payment:order:read                                                                            |
| /payment/audits          | GET /payment/admin/operation-audit                                                                  | payment:audit:read                                                                            |
| /payment/callback-events | GET /payment/admin/callback-events                                                                  | payment:audit:read                                                                            |
| /payment/reconciliation  | GET /payment/admin/callback-events/reconciliation                                                   | payment:audit:read                                                                            |
| /order/orders            | GET /order/admin/orders；GET /order/admin/orders/{id}                                                | order:read                                                                                     |
| /403、未匹配地址         | 无业务接口；403 可重新读取 me                                                                       | 不显示管理导航                                                                                |

领域分页默认 20，既有 System 页为 10；筛选提交回第一页。新增领域查询使用筛选快照、取消信号与请求序号；既有 System 列表使用请求中禁用翻页/查询的方式串行处理。System/Notice 审计 success 参数为 0/1，Payment 审计为 boolean。所有金额提交整数分，显示元最多两位小数。

订单管理仅精确筛选订单号，并按 `created_at DESC, id DESC` 稳定分页；详情按钮会重新读取详情接口。订单页面只展示 Order 服务自身安全事实，未知状态显示原始值，时间按后端返回值原样显示，不添加或减少八小时。

禁止的浏览器接口：/payment/sandbox/callback、/order/internal/**、/inventory/internal/**。测试 Mock 仅用于隔离异常分支，不代表真实验收。
