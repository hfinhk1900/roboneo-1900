# Scream AI 测试状态报告

**生成时间**: $(date)

---

## ✅ 已完成项目

### 1. Prompt 修复和验证
- ✅ Scene 3 (Rainy Front Porch) - 更新为 PRD 详细版本
- ✅ Scene 5 (House Party) - 修复为 SOLO 肖像，移除 "background partygoers"
- ✅ 所有 6 个场景通过 PRD 验证
- ✅ IDENTITY_SUFFIX 正确配置
- ✅ NEGATIVE_PROMPT 包含所有安全约束

### 2. 测试脚本
- ✅ `verify-scream-ai-prompts.js` - Prompt 验证脚本（已验证通过）
- ✅ `test-scream-ai-simple.js` - 简单测试脚本（已就绪）
- ✅ `test-scream-ai-api.js` - 完整测试套件（已就绪）
- ✅ `SCREAM_AI_TEST_GUIDE.md` - 详细测试指南
- ✅ `SCREAM_AI_TEST_INSTRUCTIONS.md` - 快速测试说明

### 3. 服务器状态
- ✅ 开发服务器正在运行
- ✅ 端口: 3000
- ✅ PID: 83105
- ✅ 可访问: http://localhost:3000

---

## ⏳ 待执行项目

### API 功能测试

**前提条件**：需要 SESSION_TOKEN

**获取步骤**：
1. 浏览器访问 http://localhost:3000
2. 登录账号
3. F12 → Application → Cookies → better-auth.session_token
4. 复制 token 值
5. 运行：`export SESSION_TOKEN="复制的值"`

**测试命令**：
```bash
# 快速测试单个场景
node test-scream-ai-simple.js ./test-photo.jpg 0

# 测试修复的 Scene 3
node test-scream-ai-simple.js ./test-photo.jpg 3

# 测试修复的 Scene 5
node test-scream-ai-simple.js ./test-photo.jpg 5

# 完整测试（消耗约 14 credits）
node test-scream-ai-api.js
```

---

## 📋 测试重点

### 必须验证的场景

#### Scene 3 - Rainy Front Porch
**重点检查**：
- ✅ Prompt 包含详细的构图要求
- ✅ 门的角度（20-30度）
- ✅ 人物位置（右三分位）
- ✅ 手部动作描述
- ✅ 避免肢体变形的指令

#### Scene 5 - House Party
**重点检查**：
- ✅ 强调 SOLO portrait
- ✅ "EXACTLY ONE HUMAN"
- ✅ "No other people anywhere"
- ✅ Ghostface 只在镜子反射中出现
- ✅ 没有 "background partygoers"

---

## 🔍 验证清单

### Prompt 验证（已完成 ✅）
- [x] Scene 0: Dreamy Y2K Bedroom
- [x] Scene 1: Suburban Kitchen
- [x] Scene 2: School Hallway
- [x] Scene 3: Rainy Front Porch（已修复）
- [x] Scene 4: Movie Theater
- [x] Scene 5: House Party（已修复）
- [x] IDENTITY_SUFFIX
- [x] NEGATIVE_PROMPT

### API 功能验证（待执行）
- [ ] 基础生成功能
- [ ] 所有预设场景
- [ ] 不同长宽比
- [ ] 自定义 prompt
- [ ] 水印功能
- [ ] Credits 扣除
- [ ] 历史记录保存
- [ ] 错误处理

---

## 📊 下一步行动

1. **获取 SESSION_TOKEN**（5分钟）
   - 登录应用
   - 从浏览器 cookie 复制 token
   - 设置环境变量

2. **准备测试图片**（2分钟）
   - 找一张清晰的人像照片
   - 确保 ≤ 10MB
   - 放在项目根目录

3. **运行快速测试**（5分钟）
   ```bash
   # 测试 Scene 0
   node test-scream-ai-simple.js ./test.jpg 0
   
   # 测试修复的 Scene 3
   node test-scream-ai-simple.js ./test.jpg 3
   
   # 测试修复的 Scene 5
   node test-scream-ai-simple.js ./test.jpg 5
   ```

4. **验证结果**（5分钟）
   - 检查响应状态
   - 验证生成的图片
   - 确认 prompt 正确应用

5. **运行完整测试**（可选，15分钟）
   ```bash
   node test-scream-ai-api.js
   ```

---

## 📞 当前可用命令

```bash
# 验证 prompts（已通过）
node verify-scream-ai-prompts.js

# 检查服务器状态
ps aux | grep "next dev" | grep -v grep

# 测试单个场景（需要 SESSION_TOKEN）
node test-scream-ai-simple.js <图片> <预设ID> [长宽比]

# 完整测试套件（需要 SESSION_TOKEN）
node test-scream-ai-api.js

# 查看测试指南
cat SCREAM_AI_TEST_INSTRUCTIONS.md
```

---

## �� 成功标准

测试成功的标志：

1. ✅ 所有场景能成功生成图片
2. ✅ Scene 3 应用了详细的构图指令
3. ✅ Scene 5 只生成一个人物（SOLO）
4. ✅ 不同长宽比正常工作
5. ✅ 自定义 prompt 正确拼接
6. ✅ 水印根据订阅状态正确应用
7. ✅ Credits 正确扣除
8. ✅ 历史记录正常保存

---

**状态**：🟡 就绪，等待 SESSION_TOKEN 以开始 API 测试

**更新时间**：$(date '+%Y-%m-%d %H:%M:%S')
