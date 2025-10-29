# Confluence MCP 配置指南

## 📋 概述

这个 MCP 服务器提供 Confluence 和 Jira 的集成功能，可以在 Cursor 中直接使用 AI 助手操作 Confluence 和 Jira。

## 🚀 配置步骤

### 1. 获取 Confluence API 凭证

#### 步骤 1: 获取 API Token
1. 访问 [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. 点击 "Create API token"
3. 为 token 命名（例如：Cursor MCP）
4. 复制生成的 API token（**注意：只会显示一次**）

#### 步骤 2: 获取您的信息
- **Email**: 您用于登录 Atlassian 的邮箱地址
- **Confluence URL**: 您的 Confluence 域名，格式：`https://YOUR-DOMAIN.atlassian.net`
- **Jira URL**: 您的 Jira 域名，通常与 Confluence 相同

### 2. 更新配置文件

配置文件已创建在：
```
~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

请编辑该文件，替换以下占位符：

```json
{
  "mcpServers": {
    "Confluence communication server": {
      "command": "npx",
      "args": ["-y", "@zereight/mcp-confluence"],
      "env": {
        "CONFLUENCE_URL": "https://YOUR-DOMAIN.atlassian.net",      // 替换为您的域名
        "JIRA_URL": "https://YOUR-DOMAIN.atlassian.net",            // 替换为您的域名
        "CONFLUENCE_API_MAIL": "your-email@example.com",            // 替换为您的邮箱
        "CONFLUENCE_API_KEY": "your-api-key-here",                  // 替换为您的 API Key
        "CONFLUENCE_IS_CLOUD": "true"                               // Cloud 版本保持 true，Server/Data Center 版本改为 false
      }
    }
  }
}
```

### 3. 重启 Cursor

配置完成后，重启 Cursor 以加载新的 MCP 配置。

## 🛠 可用功能

### Confluence 工具

#### 1. execute_cql_query
执行 CQL（Confluence Query Language）查询
```
示例：搜索包含特定关键词的页面
```

#### 2. get_page_content
获取指定页面的内容
```
需要提供：页面 ID
```

#### 3. create_page
创建新的 Confluence 页面
```
需要提供：
- spaceKey: 空间键
- title: 页面标题
- content: 页面内容（storage 格式）
- parentId: 父页面 ID（可选）
```

#### 4. update_page
更新现有页面
```
需要提供：
- pageId: 页面 ID
- content: 新内容
- title: 新标题（可选）
```

### Jira 工具

#### 1. execute_jql_search
执行 JQL 查询搜索 issues
```
需要提供：
- jql: JQL 查询语句
- limit: 结果数量（默认 10）
```

#### 2. create_jira_issue
创建新的 Jira issue
```
需要提供：
- project: 项目键
- summary: 问题摘要
- issuetype: 问题类型
- description: 描述（可选）
- assignee: 分配人（可选）
- priority: 优先级（可选）
```

#### 3. update_jira_issue
更新现有 issue
```
需要提供：
- issueKey: Issue 键（如 PROJ-123）
- 要更新的字段
```

#### 4. transition_jira_issue
更改 issue 状态
```
需要提供：
- issueKey: Issue 键
- transitionId: 转换 ID
```

#### 5. get_board_sprints
获取看板的所有冲刺
```
需要提供：
- boardId: 看板 ID
- state: 状态筛选（active/future/closed，可选）
```

#### 6. get_sprint_issues
获取冲刺中的所有 issues
```
需要提供：
- sprintId: 冲刺 ID
- fields: 要返回的字段列表（可选）
```

#### 7. get_current_sprint
获取当前活动冲刺及其 issues
```
需要提供：
- boardId: 看板 ID
- includeIssues: 是否包含 issues（默认 true）
```

#### 8. get_epic_issues
获取 Epic 下的所有 issues
```
需要提供：
- epicKey: Epic 的 issue 键
- fields: 要返回的字段列表（可选）
```

#### 9. get_user_issues
获取特定用户的 issues
```
需要提供：
- boardId: 看板 ID
- username: 用户名
- type: 关联类型（assignee/reporter，默认 assignee）
- status: 状态筛选（open/in_progress/done/all，默认 all）
```

## 💡 使用示例

配置完成后，您可以在 Cursor 的 AI 对话中直接使用这些功能，例如：

```
"帮我在 Confluence 中搜索关于 API 文档的页面"

"创建一个新的 Jira issue，项目是 PROJ，标题是 '修复登录 bug'"

"获取当前 Sprint 中所有的 issues"

"更新 PROJ-123 这个 issue 的状态"
```

## 🔧 故障排除

### 问题 1: 无法连接到 Confluence
- 检查 CONFLUENCE_URL 是否正确
- 确认 API key 是否有效
- 验证网络连接

### 问题 2: 权限错误
- 确认 API token 具有足够的权限
- 检查 Confluence/Jira 项目的访问权限

### 问题 3: MCP 服务器未启动
- 重启 Cursor
- 检查配置文件格式是否正确（必须是有效的 JSON）
- 查看 Cursor 的开发者控制台日志

## 📚 参考资源

- [Confluence MCP GitHub 仓库](https://github.com/zereight/confluence-mcp)
- [Atlassian API 文档](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/)
- [CQL 查询语法](https://developer.atlassian.com/server/confluence/advanced-searching-using-cql/)
- [JQL 查询语法](https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-search-in-jira-cloud/)

## ⚠️ 安全提示

- **不要**将 API key 提交到 Git 仓库
- **不要**在代码中硬编码凭证
- 定期更新 API token
- 使用最小权限原则创建 API token

---

**配置文件路径**: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

