

# My Image Library 设计与实现方案
1. 目标与范围
统一展示与管理所有工具生成的图片（Sticker、Product Shots、AI Backgrounds、Remove Watermark、Profile Picture Maker）。
离线优先（本地 IndexedDB 储存），登录后可选云端同步。
提供高效浏览、筛选、搜索、下载、删除、详情查看与多选操作的体验。
支持移动端良好体验与可访问性。


2. 路由与导航
主路由：/my-library
入口按钮：在各工具历史区右上角，紧邻 Clear All，统一文案 View all images，跳转到 /my-library，携带初始筛选参数（如 ?tool=sticker）。

导航行为:
从任意工具页点击进入库页，保留来源工具筛选。
库页返回按钮回到上次来源。

3. 信息架构与数据模型
3.1 对象模型（MVP）
ImageRecord
id: string（uuid v4）
tool: 'sticker' | 'product_shots' | 'ai_backgrounds' | 'remove_watermark' | 'pfp' | 'unknown'
createdAt: number（Unix ms）
mime: 'image/png' | 'image/jpeg' | 'image/webp'
width: number
height: number
blobRef: Blob（或存储句柄）
thumbRef: Blob（≤ 30–60KB，小尺寸缩略图）
favorite: boolean（默认 false）
title?: string
tags?: string[]
hash?: string（内容哈希，用于去重/合并）
sourceMeta?: { origin?: 'upload'|'generated', toolParams?: Record<string, any>, sourceId?: string }
说明

thumbRef 选择单独 Blob，避免把大 base64 写入元数据。
hash 非强制；若生成端已有 sha-256 则带上，便于去重。
3.2 IndexedDB 结构（idb/原生）
DB 名：roboneo_image_library
版本：1
Object Stores
images（keyPath: id）
indexes: tool, createdAt, mime, favorite, hash
settings（keyPath: key）用于存储 migration_done_v1、UI 偏好等
备注：Chrome/Edge/Safari 对 IndexedDB Blob 支持略有差异，采用 Blob 存储并通过 createObjectURL 渲染，注意 revoke。
3.3 键空间与旧数据来源
既有 localStorage 键名（示例，按实际项目校对）：
roboneo_sticker_history_v1
roboneo_product_shots_history_v1
roboneo_ai_backgrounds_history_v1
roboneo_remove_watermark_history_v1
roboneo_pfp_history_v1
历史项字段常见形态：dataURL/base64、时间戳、工具元数据等。

4. 数据迁移方案
触发时机

首次进入 /my-library 时触发一次性迁移（若 settings.migration_done_v1 !== true）。
迁移流程

扫描 localStorage 中匹配 roboneo_*_history_v1 的键。
解析 JSON 列表，逐条规范化为 ImageRecord。
若是 dataURL：转 Blob；生成约 256px 宽度的缩略图 Blob（画布压缩）。
写入 images store；对已有 hash 或同源 URL 可跳过。
settings.migration_done_v1 = true。
保留 localStorage 源数据，不自动清理；在库页提供“一键清理旧数据”操作与说明。
回退策略

若迁移失败，记录 settings.migration_error_v1，显示提示且允许重试。
任何写入失败不影响原功能；库页显示空态或部分数据。
5. 用户权限与同步
匿名用户：仅本地 IndexedDB，可完整使用库页核心能力。
登录用户（第二期）：开启云同步与分享。
同步策略：客户端持本地版本号（updatedAt/version），服务端存储与冲突解决使用 LWW（last-write-wins）+ 可选冲突日志。
服务器接口（草案）：
GET /api/images?cursor=... 分页拉取
POST /api/images 批量上报新增/更新
DELETE /api/images/:id
批量导出 ZIP（可选后端压缩，前端备用）
6. 过滤、排序与搜索
默认排序

createdAt 降序。
过滤项（MVP）

工具类型：All / Sticker / Product Shots / AI Backgrounds / Remove Watermark / Profile Picture Maker
时间：Today / This Week / This Month / Custom Range
关键词：搜索 title、tags、工具标签名（本地小规模搜索）
可选项（后续）

文件类型：PNG / JPG / WebP
收藏：仅看已收藏
尺寸范围：小（<512px）/ 中 / 大（>2048px）
索引与查询

工具与时间范围使用 IndexedDB 索引组合筛选（工具索引 + 游标扫描 createdAt）。
关键词在内存中对当前结果集进行二次过滤（小规模数据足够快）。
7. 页面与交互设计
布局结构

顶部：标题、统计（总数/筛选结果数）
过滤栏：工具选择、日期选择、搜索框、视图切换（网格/列表）
内容区：网格（默认 3–5 列响应式）或列表视图切换
多选操作条：当选中项 >0 时浮现（底部固定，移动端尤佳）
详情面板：右侧抽屉或全屏弹窗（移动端）
网格卡片（每项）

缩略图（object-fit: cover，固定容器比率）
角标：工具标签/图标
次信息：时间（相对/绝对切换）
快捷操作：下载、更多（删除/收藏/详情/复制）
选中态：勾选框或长按进入多选
分页与加载

首屏加载 40–60 项，滚动触底“加载更多”
当总量 > 1000 时启用虚拟列表（列表视图优先虚拟化）
详情面板

大图预览（等比缩放），显示元数据（尺寸、类型、来源工具、时间、标签）
操作：下载、删除、收藏、复制到剪贴板（dataURL/Blob，在支持范围内）
空/错误状态

空态：插画 + 文案 + 返回工具页CTA
迁移失败：提示 + 重试按钮
权限受限（未来云端）：要求登录说明
可访问性

键盘：方向键导航、Enter 打开详情、Del 删除（确认弹窗）
ARIA 标签：卡片、按钮、复选框、对话框均符合
移动端适配

2 列网格，底部多选操作条
长按进入多选，滑动加载更多
弹窗改为全屏页
8. 性能与技术要点
缩略图：统一生成 256–512px 变体，jpeg/webp 品质 0.75–0.85，节省列表带宽与渲染成本。
createObjectURL 生命周期：组件卸载或图片隐藏后及时 URL.revokeObjectURL。
搜索和滚动事件：debounce 150–250ms。
大量导出：批量下载采用 JSZip（前端）+ 分片处理防 UI 卡顿；数量超阈值（>200 张）提示使用分批或后端导出。
Web Worker（可选）：生成缩略图、计算 hash、压缩打包在 worker 中处理，避免主线程阻塞。
浏览器差异：Safari IndexedDB Blob 兼容性与配额提示（磁盘不足时降级策略：仅元数据 + 远程取图，待第二期）。
9. 操作与下载/分享
单张下载：<a download> + Blob URL。
多选删除：确认弹窗，支持撤销 5s（延时实际删除，期间缓存 list）。

0. 分析与埋点
事件建议（匿名 + 登录）

library_view_open（source_tool）
library_filter_change（tool/date/search/has_favorite）
library_select_change（count）
library_download（single|bulk，count）
library_delete（single|bulk，count）
library_details_open
library_migration_start/success/failure（counts, duration）
11. 验收标准（AC）
功能

进入 /my-library 能看到历史图片汇总，默认按时间倒序。
过滤（工具/时间）与搜索可组合生效，性能流畅（>30fps 滚动）。
单张下载/删除可用，多选删除支持且有撤销。
详情面板显示元数据，移动端操作顺畅。
首次进入完成本地迁移，失败有提示且可重试；旧数据不丢失。
性能

首屏渲染 < 1.5s（50 张缩略图）。
滚动时无明显卡顿；内存峰值可控（ObjectURL 正确回收）。
写入/读取 IndexedDB 单次批处理 > 100 条稳定。
稳定性

Chrome、Edge、Firefox、Safari 最新两个大版本通过基本回归。
离线可完全使用（PWA/Service Worker 可选后续）。
12. 组件拆分与职责（参考）
页面
LibraryPage：路由页容器，协调筛选、数据加载与布局。
过滤区
FilterBar：工具选择、日期选择、搜索框、视图切换。
列表区
ImageGrid / ImageList：网格/列表视图
ImageCard / ImageRow：单项渲染与操作入口
InfiniteLoader：分页与滚动加载
详情与操作
DetailsDrawer：详情视图
SelectionToolbar：多选操作条（删除/下载/收藏）
ConfirmDialog / Toast：二次确认与反馈
数据与服务
db.ts：IndexedDB 初始化与 CRUD
migrations.ts：localStorage → IndexedDB 迁移器
thumb.ts：缩略图生成、ObjectURL 管理
export.ts：单/批量下载（JSZip 封装）
filters.ts：筛选/搜索逻辑与组合器
analytics.ts：埋点
13. 迁移映射细化（示例约定）
localStorage → ImageRecord 字段映射（按工具具体 JSON 校对）

源数据：{ dataUrl, createdAt, mime, w, h, toolParams, originUrl }
目标：
blobRef：从 dataUrl 转 Blob
thumbRef：通过 canvas 生成小图
tool：由键名推断或项内字段
createdAt：原时间戳，缺失时用当前时间
mime/width/height：取源或从 Blob 解码
sourceMeta：{ origin: originUrl ? 'upload':'generated', toolParams }
hash：可选从 dataUrl 快速 hash（性能与准确性权衡）
异常项处理

非法 JSON、空数组、异常 dataURL：跳过并计数，迁移报告展示。



















