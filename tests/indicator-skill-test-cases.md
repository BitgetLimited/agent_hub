# Bitget 技术指标 Skill — 测试用例

12 个测试用例，覆盖全部 9 个场景 + 边界情况。

**测试方法**：在 Claude Code 中输入每条"用户输入"，验证 AI 是否正确触发 skill、选择指标、执行计算、格式化输出。

---

## T01 — 综合技术分析（Case 2）

**用户输入**：
```
BTC 1小时技术分析
```

**验证要点**：
- 触发 Case 2，使用 MACD + RSI + KDJ + BOLL + SuperTrend + VOL
- API 调用参数：`symbol=BTCUSDT`，`granularity=1h`
- JSON 输出包含 `series` 数组（不是单点 `latest` 值），每个指标都有
- 每个 series 数组大约 20 个元素（默认 tail）
- SuperTrend 的 series 包含 `Direction` 数组，值为 1/-1
- 不包含 FIB（Case 2 不使用）
- 结论优先输出：先一句话总结，再展示维度表格描述近期趋势
- 精度与 BTC 价格匹配（约 2 位小数）

---

## T02 — 趋势方向（Case 3）

**用户输入**：
```
ETH 目前是看多还是看空？4小时图
```

**验证要点**：
- 触发 Case 3，使用 SuperTrend + MACD + DMI + SAR + EMA
- API 调用参数：`symbol=ETHUSDT`，`granularity=4h`
- 输出包含方向性总结，注明多少个指标一致
- 每个指标有 `series` + `context`（包含 trend_streak）
- ADX 序列值在合理范围内（通常 10-60）
- AI 解读序列趋势演变，而非仅看最后一个点

---

## T03 — 超买/超卖（Case 4）

**用户输入**：
```
DOGE 现在超买了吗？
```

**验证要点**：
- 触发 Case 4，使用 RSI + StochRSI + MFI + SuperTrend
- `symbol=DOGEUSDT`，默认 `granularity=1h`
- 精度与 DOGE 价格匹配（约 4 位小数）
- RSI 序列展示向 70（超买）或 30（超卖）靠近/远离的轨迹
- AI 用序列描述"RSI 从 X 下降到 Y"，而非仅报一个数字
- SuperTrend 在结论中提供趋势背景

---

## T04 — 成交量分析（Case 5）

**用户输入**：
```
SOL 的成交量情况怎么样？
```

**验证要点**：
- 触发 Case 5，使用 VOL + OBV + VWAP
- `symbol=SOLUSDT`
- VOL 序列展示成交量均线趋势
- VWAP 值与价格在同一数量级
- OBV 柱状图序列展示一段时间内的资金流向

---

## T05 — 动量强度（Case 6）

**用户输入**：
```
BTC 日线的动量是在增强还是减弱？
```

**验证要点**：
- 触发 Case 6，使用 MACD + ROC + EMV
- `granularity=1d`，tail 应为 ~10-15（日线周期较长）
- MACD HIST 序列清晰展示收窄或扩大趋势
- ROC 输出值为百分比
- AI 解读序列趋势，而非仅看最后一个值

---

## T06 — 支撑/阻力（Case 7）

**用户输入**：
```
ETH 的支撑位和阻力位在哪里？
```

**验证要点**：
- 触发 Case 7，使用 FIB + BOLL + SuperTrend + VWAP + MA
- FIB 输出使用 `levels` 格式（不是 `series`），包含 0.236/0.382/0.5/0.618/0.786 水位
- BOLL 输出使用 `series` 格式，包含 UPPER/MIDDLE/LOWER 数组
- 多个来源交叉验证支撑/阻力区间

---

## T07 — 波动率（Case 8）

**用户输入**：
```
BTC 现在波动率高吗？
```

**验证要点**：
- 触发 Case 8，仅使用 ATR + BOLL
- ATR 序列展示近期波动率趋势（扩大/收缩）
- BOLL 序列支持带宽分析
- 指标数量最少（仅 2 个）

---

## T08 — 自定义查询 + 自定义参数（Case 1）

**用户输入**：
```
分析 BTC 15分钟的 RSI(21) + MACD + ATR
```

**验证要点**：
- 触发 Case 1，不套用任何场景模板
- 不读取 scenarios.md 或 indicators.md（懒加载优化）
- RSI period=21（非默认 14）
- MACD 和 ATR 使用默认参数
- `granularity=15min`，tail=20-30
- 恰好输出 3 个指标的 series，不多不少

---

## T09 — 自定义查询：仅 Case 1 可达的指标（Case 1）

**用户输入**：
```
帮我看看 BTC 的 CCI 和 WR
```

**验证要点**：
- CCI 和 WR 不在任何默认场景中，只能通过 Case 1 触达
- CCI 序列值无界（不是 0-100）
- WR 序列值在 0-100 之间（与 RSI 反向）
- 不强制添加其他场景的指标

---

## T10 — 指标信息查询（Case 9）

**用户输入**：
```
SuperTrend 指标是怎么工作的？参数有哪些？
```

**验证要点**：
- 触发 Case 9 —— 无需计算
- 仅读取 indicators.md（不读 scenarios.md）
- 返回参数、输出、解读说明
- 不调用 API，不执行 Python 代码

---

## T11 — 合约 K 线

**用户输入**：
```
BTCUSDT 合约 4小时 RSI 是多少？
```

**验证要点**：
- 使用合约 API 端点（`/api/v2/mix/market/candles`），而非现货
- 包含 `productType=USDT-FUTURES`
- RSI 输出为 `series` 数组，展示近期轨迹

---

## T12 — 本地数据 + CSV 导出

**准备工作**：先在项目根目录创建测试 CSV：

```bash
python3 -c "
import pandas as pd, numpy as np
np.random.seed(42)
n = 100
close = 100 + np.cumsum(np.random.randn(n) * 0.5)
high = close + np.abs(np.random.randn(n) * 0.3)
low = close - np.abs(np.random.randn(n) * 0.3)
op = close + np.random.randn(n) * 0.1
vol = np.random.randint(1000, 5000, n).astype(float)
df = pd.DataFrame({'open': op, 'high': high, 'low': low, 'close': close, 'volume': vol})
df.to_csv('test_kline.csv', index=False)
print(f'Created test_kline.csv with {n} rows')
"
```

**用户输入**：
```
用本地文件 test_kline.csv 计算 MACD 和 RSI，并导出完整数据到 CSV
```

**验证要点**：
- 触发 Template B（本地数据），不调用 Bitget API
- 使用 `pd.read_csv` 加载数据
- JSON 输出包含 MACD 和 RSI 的 `series` 数组 + `context`
- 输出包含 `source` 字段和 `candles_count`
- 生成 CSV 文件，包含 OHLCV + DIF + DEA + HIST + RSI 列

---

## 通用检查清单

每个测试用例都需确认：

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | Skill 触发 | AI 读取 SKILL.md 并执行 Python 代码 |
| 2 | 懒加载 | 仅在需要时读取参考文件（P1: 不读、P2: 仅 scenarios.md、P3: 仅 indicators.md） |
| 3 | 指标选择 | 配置的指标与预期 Case 匹配 |
| 4 | 序列输出 | JSON 包含 `series` 数组（非单点 `latest`），FIB 除外（使用 `levels`） |
| 5 | 上下文存在 | 每个指标有 `context`，包含 `trend_streak` 和交叉信息 |
| 6 | 代码执行 | Python 脚本无报错，输出有效 JSON |
| 7 | 序列解读 | AI 阅读 series 数组并描述趋势变化，而非仅罗列数字 |
| 8 | 精度规则 | 表格中的浮点值精度与 close 价格精度匹配 |
| 9 | 结论优先 | 第一行是总结，不是原始数据 |
| 10 | 免责声明 | 以"不构成交易建议"或类似表述结尾 |
| 11 | 数据标注 | 标注时间周期、K 线数量和数据来源 |
