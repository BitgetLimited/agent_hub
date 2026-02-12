# Bitget MCP Server - Architecture Design

> Version: 1.0.0-draft
> Date: 2026-02-10
> Status: Design Phase

## 1. Product Overview

Bitget 官方 MCP (Model Context Protocol) Server，让主流 AI 助手能够直接调用 Bitget 交易所 API。

**目标用户**: 使用 AI 编程助手 / AI Agent 的 Bitget 用户
**支持客户端**: Claude Desktop, Cursor, VS Code (GitHub Copilot), Codex, Windsurf, ChatGPT 等所有 MCP 兼容客户端
**分发方式**: npm 包，用户通过 `npx -y @bitget/mcp-server` 一键启动

### 1.1 核心价值

- 用户可以通过自然语言让 AI 查询行情、下单、管理仓位
- 零部署成本，一行配置即可接入
- 官方维护，安全可靠，与 Bitget API 版本同步

### 1.2 用户配置示例

**最简配置**（默认加载 spot + futures + account 模块）:

```json
{
  "mcpServers": {
    "bitget": {
      "command": "npx",
      "args": ["-y", "@bitget/mcp-server"],
      "env": {
        "BITGET_API_KEY": "bg_xxx",
        "BITGET_SECRET_KEY": "your-secret-key",
        "BITGET_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

**指定模块**:

```json
{
  "mcpServers": {
    "bitget": {
      "command": "npx",
      "args": ["-y", "@bitget/mcp-server", "--modules", "spot,futures,margin,account"],
      "env": {
        "BITGET_API_KEY": "bg_xxx",
        "BITGET_SECRET_KEY": "your-secret-key",
        "BITGET_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

**只读模式**（禁止所有写操作）:

```json
{
  "mcpServers": {
    "bitget": {
      "command": "npx",
      "args": ["-y", "@bitget/mcp-server", "--read-only"],
      "env": {
        "BITGET_API_KEY": "bg_xxx",
        "BITGET_SECRET_KEY": "your-secret-key",
        "BITGET_PASSPHRASE": "your-passphrase"
      }
    }
  }
}
```

**无 API Key**（仅公共行情数据）:

```json
{
  "mcpServers": {
    "bitget": {
      "command": "npx",
      "args": ["-y", "@bitget/mcp-server"]
    }
  }
}
```

---

## 2. Technical Stack

| 组件 | 选型 | 理由 |
|------|------|------|
| 语言 | TypeScript 5.x | MCP 生态标准语言，类型安全，npx 生态原生支持 |
| 运行时 | Node.js >= 18 | 原生 fetch 支持（零 HTTP 依赖），LTS 稳定 |
| MCP SDK | `@modelcontextprotocol/sdk` | 官方 SDK，协议兼容性有保障 |
| HTTP 客户端 | Node.js 原生 `fetch` | 零依赖，Node 18+ 内置 |
| 签名 | Node.js 原生 `crypto` | HMAC-SHA256，零依赖 |
| CLI 解析 | Node.js 原生 `parseArgs` | `node:util` 内置，零依赖 |
| 构建工具 | `tsup` | 打包为单文件，启动快，tree-shaking |
| 包管理 | npm | 发布到 npm registry |

**零外部依赖原则**: 除 `@modelcontextprotocol/sdk` 外，不引入任何第三方运行时依赖。签名、HTTP、CLI 解析全部使用 Node.js 内置模块。

---

## 3. Architecture

### 3.1 System Flow

```
┌─────────────────┐     MCP Protocol (stdio)     ┌──────────────────────────┐
│                 │ ◄──────────────────────────► │   Bitget MCP Server      │
│   AI Assistant  │                               │                          │
│  (Claude/Cursor │     Tool Call Request          │  ┌──────────────────┐   │
│   /Copilot)     │ ────────────────────────────► │  │  Module Router   │   │
│                 │                               │  │  (spot/futures/  │   │
│                 │     Tool Call Response         │  │   account/...)   │   │
│                 │ ◄──────────────────────────── │  └────────┬─────────┘   │
└─────────────────┘                               │           │             │
                                                  │  ┌────────▼─────────┐   │
                                                  │  │   Tool Handler   │   │
                                                  │  │  (validate +     │   │
                                                  │  │   transform)     │   │
                                                  │  └────────┬─────────┘   │
                                                  │           │             │
                                                  │  ┌────────▼─────────┐   │
                                                  │  │   REST Client    │   │
                                                  │  │  ┌─────────────┐ │   │
                                                  │  │  │  Signer     │ │   │
                                                  │  │  │  (HMAC-256) │ │   │
                                                  │  │  ├─────────────┤ │   │
                                                  │  │  │ Rate Limiter│ │   │
                                                  │  │  ├─────────────┤ │   │
                                                  │  │  │ Error       │ │   │
                                                  │  │  │ Handler     │ │   │
                                                  │  │  └─────────────┘ │   │
                                                  │  └────────┬─────────┘   │
                                                  └───────────┼─────────────┘
                                                              │ HTTPS
                                                  ┌───────────▼─────────────┐
                                                  │   api.bitget.com        │
                                                  │   Bitget REST API       │
                                                  └─────────────────────────┘
```

### 3.2 Component Responsibilities

| 组件 | 职责 |
|------|------|
| **Index (入口)** | 解析 CLI 参数，初始化配置，启动 MCP Server |
| **Config Manager** | 合并环境变量 + CLI 参数，验证必填项，管理模块加载列表 |
| **Server** | 创建 MCP Server 实例，按模块注册 tools，处理 stdio 通信 |
| **Module Router** | 根据 `--modules` 配置决定加载哪些 tool 模块 |
| **Tool Handler** | 每个 tool 的具体实现：参数校验 → 构造请求 → 调用 REST Client → 格式化响应 |
| **REST Client** | 统一 HTTP 请求层：URL 构造、请求签名、发送请求、解析响应 |
| **Signer** | HMAC-SHA256 签名实现，所有私有接口请求必经 |
| **Rate Limiter** | 令牌桶算法，防止 AI 循环调用突破 Bitget 频率限制 |
| **Error Handler** | 统一错误格式化，将 Bitget API 错误转为 AI 可理解的结构化消息 |

### 3.3 Request Lifecycle

```
1. AI 发起 Tool Call
   └─► MCP Server 接收 { tool: "spot_place_order", params: {...} }
       └─► Module Router 确认该 tool 已加载
           └─► Tool Handler:
               ├─ 验证参数完整性和类型
               ├─ 检查 --read-only 模式（写操作直接拒绝）
               ├─ 检查 API Key 是否已配置（私有接口必须）
               ├─ 参数转换（MCP 参数 → Bitget API 参数）
               └─► REST Client:
                   ├─ Rate Limiter 检查频率限制
                   ├─ 构造完整 URL + Query/Body
                   ├─ Signer 计算 HMAC-SHA256 签名
                   ├─ 发送 HTTPS 请求到 api.bitget.com
                   ├─ 解析响应 JSON
                   ├─ 检查 Bitget 业务状态码
                   └─► 返回结构化结果给 Tool Handler
               └─► Tool Handler 格式化响应
                   └─► MCP Server 返回给 AI
```

---

## 4. Module System

### 4.1 Design Philosophy

采用**单包 + 模块过滤**架构（参考 Stripe MCP `--tools` 和 Supabase `?features` 模式）。

**为什么不拆成多个 npm 包？**

- 用户只需配置一个 MCP Server，体验最好
- 共享 REST Client、签名、限流等基础设施，避免重复
- 版本统一管理，不会出现模块间版本不兼容

**为什么需要模块过滤？**

- Cursor 全局限制最多 40 个 MCP tools
- GitHub Copilot 限制 128 个 tools
- 减少 AI 上下文占用（每个 tool description 消耗 200-400 tokens）
- 用户只关心自己用到的功能

### 4.2 Module List

| 模块 ID | 名称 | Tool 数量 | 默认加载 | 需要 API Key |
|---------|------|-----------|---------|-------------|
| `spot` | 现货交易 | 12 | Yes | 部分（行情不需要，交易需要） |
| `futures` | 合约交易 | 14 | Yes | 部分 |
| `account` | 账户 & 钱包 | 8 | Yes | Yes |
| `margin` | 杠杆交易 | 7 | No | Yes |
| `copytrading` | 跟单交易 | 5 | No | Yes |
| `convert` | 闪兑 | 3 | No | Yes |
| `earn` | 理财 | 3 | No | Yes |
| `p2p` | P2P 交易 | 2 | No | Yes |
| `broker` | 经纪商 | 3 | No | Yes |

**默认加载**: spot + futures + account = **34 tools**（在 Cursor 40 上限内，留 6 个位置给用户其他 MCP Server）

### 4.3 Module Loading Logic

```
CLI: --modules spot,futures,margin,account
                    │
                    ▼
        ┌─────────────────────┐
        │ 解析 modules 参数    │
        │                     │
        │ "all" → 加载全部     │
        │ 未指定 → 默认三模块   │
        │ 指定列表 → 仅加载指定 │
        └──────────┬──────────┘
                   │
         ┌─────────▼─────────┐
         │ 遍历模块列表       │
         │ 调用每个模块的      │
         │ registerTools()    │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │ 过滤 --read-only   │
         │ 移除所有写操作 tool │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │ 注册到 MCP Server  │
         └───────────────────┘
```

---

## 5. Tool Design Principles

### 5.1 Workflow-Oriented Merging

**不是 1:1 映射 API endpoint，而是面向用户工作流合并。**

合并规则：

| 场景 | 策略 | 示例 |
|------|------|------|
| 同类数据 + 仅时间范围不同 | 合并 | `candles` + `history-candles` → `spot_get_candles` |
| 同实体 + 不同查询维度 | 合并 | `open-orders` + `history-orders` + `order-detail` → `spot_get_orders` |
| 单笔 vs 批量 | 合并 | `place-order` + `batch-orders` → `spot_place_order`（数组长度自动路由） |
| 返回结构完全不同 | 不合并 | `ticker` vs `orderbook` vs `candles` 各自独立 |
| 读 vs 写 | 不合并 | `get_orders` 和 `cancel_orders` 绝不合并 |
| 风险等级不同 | 不合并 | 查余额 vs 提币必须分开 |

### 5.2 Naming Convention

```
{module}_{action}_{object}
```

- `module`: spot, futures, margin, copy, convert, earn, p2p, broker
- `action`: get, place, cancel, set, update, manage
- `object`: ticker, depth, candles, orders, fills, positions, assets, ...

account 模块例外，不加 module 前缀（因为是跨模块通用的）：`get_account_assets`、`transfer`、`withdraw`

### 5.3 Tool Description Standards

每个 tool 的 description 必须包含：

1. **一句话功能说明**（AI 用来判断是否调用）
2. **认证要求**（Public / Private）
3. **频率限制**（如 "Rate limit: 10 req/s per UID"）
4. **风险标注**（如 "[CAUTION] This will execute a real trade"）

示例：

```
"Get real-time ticker data for a spot trading pair. Returns last price, 24h volume, bid/ask prices. Public endpoint, no authentication required. Rate limit: 20 req/s per IP."
```

```
"Place one or more spot orders. Supports limit and market order types. [CAUTION] This will execute real trades on your account. Private endpoint, requires API key. Rate limit: 10 req/s per UID."
```

### 5.4 Parameter Design Standards

- 每个 tool 参数不超过 8 个（AI 容易构造）
- 所有参数使用 JSON Schema 的 `description` 字段
- 使用 `enum` 约束可选值，帮助 AI 选择
- 金额、价格等使用 `string` 类型（避免浮点精度问题）
- 默认值在 description 中说明

示例参数定义：

```json
{
  "symbol": {
    "type": "string",
    "description": "Trading pair symbol, e.g. 'BTCUSDT', 'ETHUSDT'"
  },
  "side": {
    "type": "string",
    "enum": ["buy", "sell"],
    "description": "Order side"
  },
  "orderType": {
    "type": "string",
    "enum": ["limit", "market"],
    "description": "Order type. 'limit' requires price parameter."
  },
  "price": {
    "type": "string",
    "description": "Order price. Required for limit orders. Use string to avoid precision issues, e.g. '67530.5'"
  },
  "size": {
    "type": "string",
    "description": "Order quantity. Use string to avoid precision issues, e.g. '0.001'"
  }
}
```

---

## 6. Project Structure

```
@bitget/mcp-server/
├── package.json                    # npm 包配置、bin 入口
├── tsconfig.json                   # TypeScript 配置
├── tsup.config.ts                  # 构建配置（打包为单文件）
├── README.md                       # 用户文档（快速开始、配置说明）
├── LICENSE                         # MIT License
├── docs/
│   ├── architecture.md             # 本文档：系统架构设计
│   ├── tools-reference.md          # 完整 Tool 规格参考
│   ├── security.md                 # 安全模型文档
│   └── api-mapping.md              # Bitget API ↔ MCP Tool 映射表
├── src/
│   ├── index.ts                    # 程序入口：CLI 解析 → 启动 Server
│   ├── server.ts                   # MCP Server：创建实例、注册模块、stdio 通信
│   ├── config.ts                   # 配置管理：环境变量 + CLI 合并、校验
│   ├── client/
│   │   ├── rest-client.ts          # REST API 客户端：请求构造、签名、发送
│   │   └── types.ts                # 公共类型：请求/响应/错误
│   ├── tools/
│   │   ├── types.ts                # Tool 注册类型定义
│   │   ├── spot-market.ts          # 现货行情（5 tools）
│   │   ├── spot-trade.ts           # 现货交易（7 tools）
│   │   ├── futures-market.ts       # 合约行情（7 tools）
│   │   ├── futures-trade.ts        # 合约交易（7 tools）
│   │   ├── account.ts              # 账户 & 钱包（8 tools）
│   │   ├── margin.ts               # 杠杆交易（7 tools）
│   │   ├── copy-trading.ts         # 跟单交易（5 tools）
│   │   ├── convert.ts              # 闪兑（3 tools）
│   │   ├── earn.ts                 # 理财（3 tools）
│   │   ├── p2p.ts                  # P2P（2 tools）
│   │   └── broker.ts               # 经纪商（3 tools）
│   └── utils/
│       ├── signature.ts            # HMAC-SHA256 签名
│       ├── rate-limiter.ts         # 令牌桶限流器
│       └── errors.ts               # 统一错误类型和处理
└── tests/                          # 测试（后续补充）
    ├── client/
    ├── tools/
    └── utils/
```

### 6.1 File Responsibilities

| 文件 | 导出 | 职责 |
|------|------|------|
| `index.ts` | `main()` | 解析 `--modules`、`--read-only`、`--help`、`--version`，创建 Config，启动 Server |
| `server.ts` | `createServer(config)` | 创建 `McpServer` 实例，根据 config 加载模块，连接 stdio transport |
| `config.ts` | `BitgetConfig` 类型 + `loadConfig()` | 合并 env + CLI，校验，返回强类型配置对象 |
| `rest-client.ts` | `BitgetRestClient` 类 | 封装 GET/POST，自动签名，自动限流，统一错误处理 |
| `tools/*.ts` | `registerXxxTools(server, client)` | 每个模块导出一个注册函数，向 server 注册该模块所有 tools |
| `signature.ts` | `sign(message, secretKey)` | HMAC-SHA256 签名和验证 |
| `rate-limiter.ts` | `RateLimiter` 类 | 令牌桶实现，支持 per-endpoint 配置 |
| `errors.ts` | `BitgetApiError` 类 | 统一错误类型、Bitget 错误码映射 |

---

## 7. CLI Interface

```
Usage: @bitget/mcp-server [options]

Options:
  --modules <list>     Comma-separated list of modules to load
                       Available: spot, futures, account, margin, copytrading,
                       convert, earn, p2p, broker
                       Special: "all" loads everything
                       Default: spot,futures,account

  --read-only          Only expose read/query tools, disable all write operations
                       (no order placement, no transfers, no withdrawals)

  --help               Show this help message
  --version            Show version number

Environment Variables:
  BITGET_API_KEY       Your Bitget API key (required for private endpoints)
  BITGET_SECRET_KEY    Your Bitget secret key (required for private endpoints)
  BITGET_PASSPHRASE    Your Bitget API passphrase (required for private endpoints)

Examples:
  # Default modules (spot + futures + account)
  npx -y @bitget/mcp-server

  # Specific modules
  npx -y @bitget/mcp-server --modules spot,margin

  # All modules
  npx -y @bitget/mcp-server --modules all

  # Read-only mode (market data + account queries only)
  npx -y @bitget/mcp-server --read-only
```

---

## 8. Error Handling

### 8.1 Error Categories

| 类型 | 场景 | 处理方式 |
|------|------|---------|
| **ConfigError** | API Key 未配置但调用私有接口 | 返回清晰提示，告知用户配置 env |
| **AuthenticationError** | 签名错误、Key 过期 | 返回 Bitget 原始错误 + 排查建议 |
| **RateLimitError** | 客户端侧限流触发 | 返回等待时间，建议 AI 稍后重试 |
| **ValidationError** | 参数类型/范围错误 | 返回具体字段和期望值 |
| **BitgetApiError** | Bitget 服务端业务错误 | 返回 code + message + 建议 |
| **NetworkError** | 网络超时、连接失败 | 返回重试建议 |

### 8.2 Error Response Format

所有错误统一格式，便于 AI 理解和处理：

```json
{
  "error": true,
  "type": "BitgetApiError",
  "code": "43012",
  "message": "Insufficient balance. Available USDT: 10.5, required: 100.0",
  "suggestion": "Check your account balance with get_account_assets before placing orders.",
  "endpoint": "POST /api/v2/spot/trade/place-order",
  "timestamp": "2026-02-10T08:30:00.000Z"
}
```

---

## 9. Development Phases

### Phase 1: Core + Spot + Account (MVP)

**目标**: 可用的现货交易 + 账户管理

- 项目脚手架 (package.json, tsconfig, tsup, CLI)
- 核心基础设施 (REST Client, 签名, 限流, 错误处理, 配置)
- Spot Market tools (5)
- Spot Trade tools (7)
- Account tools (8)
- README + 使用文档
- **合计: 20 tools, 可发布 alpha**

### Phase 2: Futures

**目标**: 完整的合约交易能力

- Futures Market tools (7)
- Futures Trade tools (7)
- **累计: 34 tools (默认加载集), 可发布 beta**

### Phase 3: Extended Modules

**目标**: 杠杆、跟单、闪兑等扩展模块

- Margin tools (7)
- Copy Trading tools (5)
- Convert tools (3)
- Earn tools (3)
- P2P tools (2)
- Broker tools (3)
- **累计: 57 tools (全量), 可发布 v1.0**

---

## 10. Versioning Strategy

- 遵循 Semantic Versioning (semver)
- MCP Server 版本与 Bitget API V2 对应
- Tool 的增删改在 CHANGELOG 中明确标注
- 废弃 tool 先标注 `[DEPRECATED]`，保留一个大版本后移除
