"""
Bitget Indicator Skill - 23 Technical Indicator Implementations

Organized into 6 categories: Trend, Volatility, Oscillator, Volume, Momentum, Support/Resistance.
Indicator naming is consistent with the Bitget APP.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List

from kline_indicator_utils import (
    BaseIndicator, register_indicator, TechnicalUtils,
    IndicatorResult, IndicatorConfig, IndicatorCategory
)


# ============================================================
# Trend (7): MA, EMA, SAR, AVL, MACD, DMI, SuperTrend
# ============================================================

@register_indicator
class MA(BaseIndicator):
    """MA - Moving Average"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 60}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="MA",
            category=IndicatorCategory.TREND,
            description=f"Moving Average ({period})",
            parameters=self.params,
            output_names=[f"MA_{period}"],
            formula=f"MA = SMA(CLOSE, {period})",
            interpretation=f"Price above MA_{period} = bullish, below = bearish",
            display_panel="main"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        close = data['close']
        ma = TechnicalUtils.sma(close, period)
        signals = self.get_signals([close, ma], data.index)
        return IndicatorResult(
            values={f"MA_{period}": ma},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        close, ma = raw_values
        diff = close - ma
        cross_up = ((close >= ma) & (close.shift(1) < ma.shift(1))).astype(int)
        cross_down = ((close <= ma) & (close.shift(1) > ma.shift(1))).astype(int)
        trend = np.where(diff > 0, 1, np.where(diff < 0, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class EMA(BaseIndicator):
    """EMA - Exponential Moving Average"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 60}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="EMA",
            category=IndicatorCategory.TREND,
            description=f"Exponential Moving Average ({period})",
            parameters=self.params,
            output_names=[f"EMA_{period}"],
            formula=f"EMA = EMA(CLOSE, {period})",
            interpretation=f"Price above EMA_{period} = bullish, below = bearish",
            display_panel="main"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        close = data['close']
        ema = TechnicalUtils.ema(close, period)
        signals = self.get_signals([close, ema], data.index)
        return IndicatorResult(
            values={f"EMA_{period}": ema},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        close, ema = raw_values
        diff = close - ema
        cross_up = ((close >= ema) & (close.shift(1) < ema.shift(1))).astype(int)
        cross_down = ((close <= ema) & (close.shift(1) > ema.shift(1))).astype(int)
        trend = np.where(diff > 0, 1, np.where(diff < 0, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class SAR(BaseIndicator):
    """SAR - Parabolic Stop and Reverse"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"af_start": 0.02, "af_increment": 0.02, "af_max": 0.2}

    def _create_config(self) -> IndicatorConfig:
        af_start = self.params["af_start"]
        af_max = self.params["af_max"]
        return IndicatorConfig(
            name="SAR",
            category=IndicatorCategory.TREND,
            description=f"Parabolic SAR ({af_start},{af_max})",
            parameters=self.params,
            output_names=["SAR"],
            formula="SAR = prev_SAR + AF * (EP - prev_SAR)",
            interpretation="SAR below price = bullish, above = bearish; SAR flips on trend reversal",
            display_panel="main"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        af_start = self.params["af_start"]
        af_increment = self.params["af_increment"]
        af_max = self.params["af_max"]
        high = data['high'].values
        low = data['low'].values
        n = len(high)

        sar = np.full(n, np.nan)
        trend = np.full(n, 0)
        af = np.full(n, af_start)
        ep = np.full(n, np.nan)

        if high[1] > high[0]:
            trend[0] = 1
            sar[0] = low[0]
            ep[0] = high[0]
        else:
            trend[0] = -1
            sar[0] = high[0]
            ep[0] = low[0]

        for i in range(1, n):
            sar[i] = sar[i - 1] + af[i - 1] * (ep[i - 1] - sar[i - 1])

            if trend[i - 1] == 1:
                if low[i] <= sar[i]:
                    trend[i] = -1
                    sar[i] = ep[i - 1]
                    ep[i] = low[i]
                    af[i] = af_start
                else:
                    trend[i] = 1
                    sar[i] = min(sar[i], low[i - 1])
                    if i > 1:
                        sar[i] = min(sar[i], low[i - 2])
                    if high[i] > ep[i - 1]:
                        ep[i] = high[i]
                        af[i] = min(af[i - 1] + af_increment, af_max)
                    else:
                        ep[i] = ep[i - 1]
                        af[i] = af[i - 1]
            else:
                if high[i] >= sar[i]:
                    trend[i] = 1
                    sar[i] = ep[i - 1]
                    ep[i] = high[i]
                    af[i] = af_start
                else:
                    trend[i] = -1
                    sar[i] = max(sar[i], high[i - 1])
                    if i > 1:
                        sar[i] = max(sar[i], high[i - 2])
                    if low[i] < ep[i - 1]:
                        ep[i] = low[i]
                        af[i] = min(af[i - 1] + af_increment, af_max)
                    else:
                        ep[i] = ep[i - 1]
                        af[i] = af[i - 1]

        sar_series = pd.Series(sar, index=data.index)
        signals = self.get_signals([sar_series, data['close'], trend], data.index)
        return IndicatorResult(
            values={"SAR": sar_series},
            signals=signals,
            metadata={"af_start": af_start, "af_increment": af_increment, "af_max": af_max}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        sar, close, trend_array = raw_values
        trend_series = pd.Series(trend_array, index=data_index)
        trend_change = trend_series.diff()
        cross_up = (trend_change == 2).astype(int)
        cross_down = (trend_change == -2).astype(int)
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend_series, index=data_index),
        }


@register_indicator
class AVL(BaseIndicator):
    """AVL - Average Price Line"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 1}

    def _create_config(self) -> IndicatorConfig:
        return IndicatorConfig(
            name="AVL",
            category=IndicatorCategory.TREND,
            description="Average Price Line",
            parameters=self.params,
            output_names=["AVL"],
            formula="AVL = cumulative(amount) / cumulative(volume)",
            interpretation="Volume-weighted average price line; price above AVL means most holders are in profit",
            display_panel="main"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        volume = data['volume']
        if 'amount' in data.columns:
            amount = data['amount']
        else:
            amount = data['close'] * volume

        cum_amount = amount.cumsum()
        cum_volume = volume.cumsum()
        avl = cum_amount / (cum_volume + 1e-10)

        signals = self.get_signals([data['close'], avl], data.index)
        return IndicatorResult(
            values={"AVL": avl},
            signals=signals,
            metadata={}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        close, avl = raw_values
        diff = close - avl
        cross_up = ((close >= avl) & (close.shift(1) < avl.shift(1))).astype(int)
        cross_down = ((close <= avl) & (close.shift(1) > avl.shift(1))).astype(int)
        trend = np.where(diff > 0, 1, np.where(diff < 0, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class MACD(BaseIndicator):
    """MACD - Moving Average Convergence Divergence"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"fast": 12, "slow": 26, "signal": 9}

    def _create_config(self) -> IndicatorConfig:
        fast = self.params["fast"]
        slow = self.params["slow"]
        signal = self.params["signal"]
        return IndicatorConfig(
            name="MACD",
            category=IndicatorCategory.TREND,
            description=f"MACD ({fast},{slow},{signal})",
            parameters=self.params,
            output_names=["DIF", "DEA", "HIST"],
            formula=f"DIF=EMA(CLOSE,{fast})-EMA(CLOSE,{slow}); DEA=EMA(DIF,{signal}); HIST=2*(DIF-DEA)",
            interpretation="DIF crossing above DEA = golden cross (buy), crossing below = death cross (sell)",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        fast = self.params["fast"]
        slow = self.params["slow"]
        signal = self.params["signal"]
        close = data['close']
        ema_fast = TechnicalUtils.ema(close, fast)
        ema_slow = TechnicalUtils.ema(close, slow)
        dif = ema_fast - ema_slow
        dea = TechnicalUtils.ema(dif, signal)
        hist = 2 * (dif - dea)
        signals = self.get_signals([dif, dea, hist], data.index)
        return IndicatorResult(
            values={"DIF": dif, "DEA": dea, "HIST": hist},
            signals=signals,
            metadata={"fast": fast, "slow": slow, "signal": signal}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        dif, dea, hist = raw_values
        cross_up = ((dif >= dea) & (dif.shift(1) < dea.shift(1))).astype(int)
        cross_down = ((dif <= dea) & (dif.shift(1) > dea.shift(1))).astype(int)
        trend = np.where(
            (dif > dea) & (dif > 0), 1,
            np.where((dif < dea) & (dif < 0), -1, 0)
        )
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class DMI(BaseIndicator):
    """DMI - Directional Movement Index"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"n1": 14, "n2": 14}

    def _create_config(self) -> IndicatorConfig:
        n1 = self.params["n1"]
        n2 = self.params["n2"]
        return IndicatorConfig(
            name="DMI",
            category=IndicatorCategory.TREND,
            description=f"Directional Movement Index ({n1},{n2})",
            parameters=self.params,
            output_names=[f"ADX_{n1}_{n2}", f"DI_PLUS_{n1}", f"DI_MINUS_{n1}"],
            formula=f"DI+=PDM/TR; DI-=NDM/TR; ADX=EMA(|DI+-DI-|/(DI++DI-)*100, {n2})",
            interpretation="DI+ crossing above DI- = buy, DI+ crossing below DI- = sell; ADX>25 indicates strong trend",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        n1 = self.params["n1"]
        n2 = self.params["n2"]
        high = data['high']
        low = data['low']
        close = data['close']

        high_diff = high.diff()
        low_diff = -low.diff()
        max_high = np.where(high_diff > 0, high_diff, 0)
        max_low = np.where(low_diff > 0, low_diff, 0)
        xpdm = np.where(max_high > max_low, high_diff, 0)
        xndm = np.where(max_low > max_high, low_diff, 0)
        xpdm_series = pd.Series(xpdm, index=high.index)
        xndm_series = pd.Series(xndm, index=high.index)
        pdm = xpdm_series.rolling(window=n1).sum()
        ndm = xndm_series.rolling(window=n1).sum()

        tr1 = high - low
        tr2 = np.abs(high - close.shift(1))
        tr3 = np.abs(low - close.shift(1))
        tr = np.maximum(tr1, np.maximum(tr2, tr3))
        tr_series = pd.Series(tr, index=high.index)
        tr_sum = tr_series.rolling(window=n1).sum()

        di_plus = 100 * pdm / (tr_sum + 1e-10)
        di_minus = 100 * ndm / (tr_sum + 1e-10)
        dx = 100 * np.abs(di_plus - di_minus) / (di_plus + di_minus + 1e-10)
        dx_series = pd.Series(dx, index=high.index)
        adx = TechnicalUtils.ema(dx_series, n2)

        signals = self.get_signals([adx, di_plus, di_minus], data.index)
        return IndicatorResult(
            values={f"ADX_{n1}_{n2}": adx, f"DI_PLUS_{n1}": di_plus, f"DI_MINUS_{n1}": di_minus},
            signals=signals,
            metadata={"n1": n1, "n2": n2}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        adx, di_plus, di_minus = raw_values
        cross_up = ((di_plus >= di_minus) & (di_plus.shift(1) < di_minus.shift(1))).astype(int)
        cross_down = ((di_plus <= di_minus) & (di_plus.shift(1) > di_minus.shift(1))).astype(int)
        strong_trend = adx > 25
        trend = np.where(
            (di_plus > di_minus) & strong_trend, 1,
            np.where((di_plus < di_minus) & strong_trend, -1, 0)
        )
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class SuperTrend(BaseIndicator):
    """SuperTrend - Super Trend"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 10, "multiplier": 3.0}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        multiplier = self.params["multiplier"]
        return IndicatorConfig(
            name="SuperTrend",
            category=IndicatorCategory.TREND,
            description=f"Super Trend ({period},{multiplier})",
            parameters=self.params,
            output_names=["SuperTrend", "Direction"],
            formula=f"basic_upper=hl2+{multiplier}*ATR({period}); basic_lower=hl2-{multiplier}*ATR({period})",
            interpretation="Direction=1 = bullish, -1 = bearish; SuperTrend line acts as dynamic stop-loss",
            display_panel="main"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        multiplier = self.params["multiplier"]
        high = data['high']
        low = data['low']
        close = data['close']

        hl2 = (high + low) / 2

        prev_close = close.shift(1)
        tr = pd.concat([
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs()
        ], axis=1).max(axis=1)
        atr = TechnicalUtils.ema(tr, period)

        basic_upper = hl2 + multiplier * atr
        basic_lower = hl2 - multiplier * atr

        n = len(data)
        upper_band = np.full(n, np.nan)
        lower_band = np.full(n, np.nan)
        supertrend = np.full(n, np.nan)
        direction = np.full(n, 1)

        upper_band[0] = basic_upper.iloc[0]
        lower_band[0] = basic_lower.iloc[0]
        supertrend[0] = basic_upper.iloc[0]

        for i in range(1, n):
            bu = basic_upper.iloc[i]
            bl = basic_lower.iloc[i]
            c = close.iloc[i]
            pc = close.iloc[i - 1]

            upper_band[i] = bu if bu < upper_band[i - 1] or pc > upper_band[i - 1] else upper_band[i - 1]
            lower_band[i] = bl if bl > lower_band[i - 1] or pc < lower_band[i - 1] else lower_band[i - 1]

            if direction[i - 1] == 1:
                if c < lower_band[i]:
                    direction[i] = -1
                    supertrend[i] = upper_band[i]
                else:
                    direction[i] = 1
                    supertrend[i] = lower_band[i]
            else:
                if c > upper_band[i]:
                    direction[i] = 1
                    supertrend[i] = lower_band[i]
                else:
                    direction[i] = -1
                    supertrend[i] = upper_band[i]

        st_series = pd.Series(supertrend, index=data.index)
        dir_series = pd.Series(direction, index=data.index)
        signals = self.get_signals([dir_series], data.index)
        return IndicatorResult(
            values={"SuperTrend": st_series, "Direction": dir_series},
            signals=signals,
            metadata={"period": period, "multiplier": multiplier}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        direction = raw_values[0]
        dir_change = direction.diff()
        cross_up = (dir_change == 2).astype(int)
        cross_down = (dir_change == -2).astype(int)
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(direction, index=data_index),
        }


# ============================================================
# Volatility (2): BOLL, ATR
# ============================================================

@register_indicator
class BOLL(BaseIndicator):
    """BOLL - Bollinger Bands"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 20, "std_dev": 2}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        std_dev = self.params["std_dev"]
        return IndicatorConfig(
            name="BOLL",
            category=IndicatorCategory.VOLATILITY,
            description=f"Bollinger Bands ({period},{std_dev})",
            parameters=self.params,
            output_names=["UPPER", "MIDDLE", "LOWER"],
            formula=f"MIDDLE=SMA(CLOSE,{period}); UPPER=MIDDLE+{std_dev}*STD; LOWER=MIDDLE-{std_dev}*STD",
            interpretation="Price breaking upper band = overbought, breaking lower band = oversold; band squeeze signals breakout",
            display_panel="main"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        std_dev = self.params["std_dev"]
        close = data['close']
        middle = TechnicalUtils.sma(close, period)
        std = close.rolling(window=period).std()
        upper = middle + std_dev * std
        lower = middle - std_dev * std
        signals = self.get_signals([upper, middle, lower, close], data.index)
        return IndicatorResult(
            values={"UPPER": upper, "MIDDLE": middle, "LOWER": lower},
            signals=signals,
            metadata={"period": period, "std_dev": std_dev}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        upper, middle, lower, close = raw_values
        price_cross_middle_up = ((close >= middle) & (close.shift(1) < middle.shift(1)))
        price_near_lower = close.shift(1) <= lower.shift(1) * 1.05
        cross_up = (price_cross_middle_up & price_near_lower).astype(int)
        price_cross_middle_down = ((close <= middle) & (close.shift(1) > middle.shift(1)))
        price_near_upper = close.shift(1) >= upper.shift(1) * 0.95
        cross_down = (price_cross_middle_down & price_near_upper).astype(int)
        trend = np.where(close > middle, 1, np.where(close < middle, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class ATR(BaseIndicator):
    """ATR - Average True Range"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 14}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="ATR",
            category=IndicatorCategory.VOLATILITY,
            description=f"Average True Range ({period})",
            parameters=self.params,
            output_names=["ATR"],
            formula=f"TR=MAX(H-L, |H-PC|, |L-PC|); ATR=EMA(TR, {period})",
            interpretation="Higher ATR = more volatile; commonly used for stop-loss placement",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        high = data['high']
        low = data['low']
        close = data['close']
        prev_close = close.shift(1)
        tr = pd.concat([
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs()
        ], axis=1).max(axis=1)
        atr = TechnicalUtils.ema(tr, period)
        signals = self.get_signals([atr], data.index)
        return IndicatorResult(
            values={"ATR": atr},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        zero_signal = pd.Series(0, index=data_index)
        return {
            "cross_up": zero_signal,
            "cross_down": zero_signal,
            "trend": zero_signal,
        }


# ============================================================
# Oscillator (6): KDJ, RSI, ROC, CCI, WR, StochRSI
# ============================================================

@register_indicator
class KDJ(BaseIndicator):
    """KDJ - Stochastic Oscillator"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 9, "overbought": 80, "oversold": 20}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="KDJ",
            category=IndicatorCategory.OSCILLATOR,
            description=f"Stochastic Oscillator ({period})",
            parameters=self.params,
            output_names=["K", "D", "J"],
            formula=f"RSV=(CLOSE-LOW_{period})/(HIGH_{period}-LOW_{period})*100; K=SMA(RSV,3,1); D=SMA(K,3,1); J=3K-2D",
            interpretation="D<20 and K crossing above D = buy signal, D>80 and K crossing below D = sell signal",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        high = data['high']
        low = data['low']
        close = data['close']

        low_n = TechnicalUtils.lowest(low, period)
        high_n = TechnicalUtils.highest(high, period)
        rsv = (close - low_n) / (high_n - low_n + 1e-10) * 100

        k = pd.Series(index=data.index, dtype=float)
        d = pd.Series(index=data.index, dtype=float)
        k.iloc[0] = rsv.iloc[0] if pd.notna(rsv.iloc[0]) else 50
        d.iloc[0] = k.iloc[0]

        for i in range(1, len(data)):
            if pd.notna(rsv.iloc[i]) and pd.notna(k.iloc[i - 1]):
                k.iloc[i] = (2 * k.iloc[i - 1] + rsv.iloc[i]) / 3
            else:
                k.iloc[i] = k.iloc[i - 1] if pd.notna(k.iloc[i - 1]) else 50
            if pd.notna(k.iloc[i]) and pd.notna(d.iloc[i - 1]):
                d.iloc[i] = (2 * d.iloc[i - 1] + k.iloc[i]) / 3
            else:
                d.iloc[i] = d.iloc[i - 1] if pd.notna(d.iloc[i - 1]) else 50

        j = 3 * k - 2 * d
        signals = self.get_signals([k, d, j], data.index)
        return IndicatorResult(
            values={"K": k, "D": d, "J": j},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        overbought = self.params["overbought"]
        oversold = self.params["oversold"]
        k, d, j = raw_values
        cross_up = ((k >= d) & (k.shift(1) < d.shift(1))).astype(int)
        cross_down = ((k <= d) & (k.shift(1) > d.shift(1))).astype(int)
        trend = np.where(
            (k > d) & (k >= overbought), 1,
            np.where((k < d) & (k <= oversold), -1, 0)
        )
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class RSI(BaseIndicator):
    """RSI - Relative Strength Index"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 14, "overbought": 70, "oversold": 30}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        overbought = self.params["overbought"]
        oversold = self.params["oversold"]
        return IndicatorConfig(
            name="RSI",
            category=IndicatorCategory.OSCILLATOR,
            description=f"Relative Strength Index ({period})",
            parameters=self.params,
            output_names=[f"RSI_{period}"],
            formula=f"RSI = 100 * SMA(UP, {period}) / (SMA(UP, {period}) + SMA(DN, {period}))",
            interpretation=f"RSI crossing above {oversold} = buy signal, crossing below {overbought} = sell signal",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        close = data['close']
        price_change = close.diff()
        closeup = np.where(price_change > 0, price_change, 0)
        closedown = np.where(price_change < 0, np.abs(price_change), 0)
        closeup_series = pd.Series(closeup, index=close.index)
        closedown_series = pd.Series(closedown, index=close.index)

        alpha = 1.0 / period
        closeup_ma = pd.Series(index=closeup_series.index, dtype=float)
        closeup_ma.iloc[0] = closeup_series.iloc[0]
        for i in range(1, len(closeup_series)):
            if pd.notna(closeup_series.iloc[i]):
                closeup_ma.iloc[i] = (1 - alpha) * closeup_ma.iloc[i - 1] + alpha * closeup_series.iloc[i]
            else:
                closeup_ma.iloc[i] = closeup_ma.iloc[i - 1]

        closedown_ma = pd.Series(index=closedown_series.index, dtype=float)
        closedown_ma.iloc[0] = closedown_series.iloc[0]
        for i in range(1, len(closedown_series)):
            if pd.notna(closedown_series.iloc[i]):
                closedown_ma.iloc[i] = (1 - alpha) * closedown_ma.iloc[i - 1] + alpha * closedown_series.iloc[i]
            else:
                closedown_ma.iloc[i] = closedown_ma.iloc[i - 1]

        rsi = 100 * closeup_ma / (closeup_ma + closedown_ma + 1e-10)
        signals = self.get_signals([rsi], data.index)
        return IndicatorResult(
            values={f"RSI_{period}": rsi},
            signals=signals,
            metadata={"period": period, "overbought": self.params["overbought"], "oversold": self.params["oversold"]}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        rsi = raw_values[0]
        overbought = self.params["overbought"]
        oversold = self.params["oversold"]
        cross_up = ((rsi >= oversold) & (rsi.shift(1) < oversold)).astype(int)
        cross_down = ((rsi <= overbought) & (rsi.shift(1) > overbought)).astype(int)
        trend = np.where(rsi <= oversold, -1, np.where(rsi >= overbought, 1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class ROC(BaseIndicator):
    """ROC - Rate of Change"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 20, "buy_threshold": 0.05, "sell_threshold": -0.05}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="ROC",
            category=IndicatorCategory.OSCILLATOR,
            description=f"Rate of Change ({period})",
            parameters=self.params,
            output_names=[f"ROC_{period}"],
            formula=f"ROC = (CLOSE - REF(CLOSE, {period})) / REF(CLOSE, {period})",
            interpretation="Measures price rate of change, reflects market momentum",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        close = data['close']
        ref_close = close.shift(period)
        roc = (close - ref_close) / (ref_close + 1e-10)
        signals = self.get_signals([roc], data.index)
        return IndicatorResult(
            values={f"ROC_{period}": roc},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        roc = raw_values[0]
        buy_threshold = self.params["buy_threshold"]
        sell_threshold = self.params["sell_threshold"]
        cross_up = ((roc >= buy_threshold) & (roc.shift(1) < buy_threshold)).astype(int)
        cross_down = ((roc <= sell_threshold) & (roc.shift(1) > sell_threshold)).astype(int)
        trend = np.where(roc >= buy_threshold, 1, np.where(roc <= sell_threshold, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class CCI(BaseIndicator):
    """CCI - Commodity Channel Index"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 14, "overbought": 100, "oversold": -100}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="CCI",
            category=IndicatorCategory.OSCILLATOR,
            description=f"Commodity Channel Index ({period})",
            parameters=self.params,
            output_names=[f"CCI_{period}"],
            formula=f"TP=(H+L+C)/3; CCI=(TP-MA(TP,{period}))/(0.015*MD)",
            interpretation="CCI crossing above -100 = buy signal, crossing below 100 = sell signal",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        high = data['high']
        low = data['low']
        close = data['close']
        tp = (high + low + close) / 3
        ma = TechnicalUtils.sma(tp, period)
        deviation = np.abs(tp - ma)
        md = TechnicalUtils.sma(deviation, period)
        cci = (tp - ma) / (0.015 * md + 1e-10)
        signals = self.get_signals([cci], data.index)
        return IndicatorResult(
            values={f"CCI_{period}": cci},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        cci = raw_values[0]
        overbought = self.params["overbought"]
        oversold = self.params["oversold"]
        cross_up = ((cci >= oversold) & (cci.shift(1) < oversold)).astype(int)
        cross_down = ((cci <= overbought) & (cci.shift(1) > overbought)).astype(int)
        trend = np.where(cci >= 100, 1, np.where(cci <= -100, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class WR(BaseIndicator):
    """WR - Williams %R"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 14, "overbought": 20, "oversold": 80}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="WR",
            category=IndicatorCategory.OSCILLATOR,
            description=f"Williams %R ({period})",
            parameters=self.params,
            output_names=[f"WR_{period}"],
            formula=f"WR = 100 * (HIGH_{period} - CLOSE) / (HIGH_{period} - LOW_{period})",
            interpretation="WR<20 = overbought, WR>80 = oversold",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        high = data['high']
        low = data['low']
        close = data['close']
        highest_high = high.rolling(window=period).max()
        lowest_low = low.rolling(window=period).min()
        wr = 100 * (highest_high - close) / (highest_high - lowest_low + 1e-10)
        signals = self.get_signals([wr], data.index)
        return IndicatorResult(
            values={f"WR_{period}": wr},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        wr = raw_values[0]
        overbought = self.params["overbought"]
        oversold = self.params["oversold"]
        cross_up = ((wr >= oversold) & (wr.shift(1) < oversold)).astype(int)
        cross_down = ((wr <= overbought) & (wr.shift(1) > overbought)).astype(int)
        trend = np.where(wr >= overbought, 1, np.where(wr <= oversold, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class StochRSI(BaseIndicator):
    """StochRSI - Stochastic RSI"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"n": 120, "m": 20, "overbought": 60, "oversold": 40}

    def _create_config(self) -> IndicatorConfig:
        n = self.params["n"]
        m = self.params["m"]
        return IndicatorConfig(
            name="StochRSI",
            category=IndicatorCategory.OSCILLATOR,
            description=f"Stochastic RSI ({n},{m})",
            parameters=self.params,
            output_names=[f"StochRSI_{n}_{m}"],
            formula=f"RSI=SMA(UP,{n})/SMA(ABS,{n})*100; StochRSI=(RSI-MIN(RSI,{n}))/(MAX(RSI,{n})-MIN(RSI,{n}))*100",
            interpretation=f"StochRSI crossing above {self.params['oversold']} = buy, crossing below {self.params['overbought']} = sell",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        n = self.params["n"]
        m = self.params["m"]
        close = data['close']
        price_change = close.diff()
        close_diff_pos = np.where(price_change > 0, price_change, 0)
        close_diff_pos_series = pd.Series(close_diff_pos, index=close.index)
        abs_price_change = np.abs(price_change)
        abs_price_change_series = pd.Series(abs_price_change, index=close.index)
        pos_ema = TechnicalUtils.ema(close_diff_pos_series, n)
        abs_ema = TechnicalUtils.ema(abs_price_change_series, n)
        rsi = pos_ema / (abs_ema + 1e-10) * 100
        rsi_min = rsi.rolling(window=n).min()
        rsi_max = rsi.rolling(window=n).max()
        stochrsi = (rsi - rsi_min) / (rsi_max - rsi_min + 1e-10) * 100
        stochrsi_ma = TechnicalUtils.ema(stochrsi, m)
        signals = self.get_signals([stochrsi_ma], data.index)
        return IndicatorResult(
            values={f"StochRSI_{n}_{m}": stochrsi_ma},
            signals=signals,
            metadata={"n": n, "m": m}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        stochrsi = raw_values[0]
        overbought = self.params["overbought"]
        oversold = self.params["oversold"]
        cross_up = ((stochrsi >= oversold) & (stochrsi.shift(1) < oversold)).astype(int)
        cross_down = ((stochrsi <= overbought) & (stochrsi.shift(1) > overbought)).astype(int)
        trend = np.where(stochrsi >= overbought, 1, np.where(stochrsi <= oversold, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


# ============================================================
# Volume (4): VOL, OBV, MFI, VWAP
# ============================================================

@register_indicator
class VOL(BaseIndicator):
    """VOL - Volume"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 20}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="VOL",
            category=IndicatorCategory.VOLUME,
            description=f"Volume ({period})",
            parameters=self.params,
            output_names=[f"VOLMA_{period}"],
            formula=f"VOLMA = SMA(VOLUME, {period})",
            interpretation="Volume above average = high volume, below average = low volume",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        vol = data['volume']
        ma = TechnicalUtils.sma(vol, period)
        signals = self.get_signals([vol, ma], data.index)
        return IndicatorResult(
            values={f"VOLMA_{period}": ma},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        vol, ma = raw_values
        diff = vol - ma
        cross_up = ((vol >= ma) & (vol.shift(1) < ma.shift(1))).astype(int)
        cross_down = ((vol <= ma) & (vol.shift(1) > ma.shift(1))).astype(int)
        trend = np.where(diff > 0, 1, np.where(diff < 0, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class OBV(BaseIndicator):
    """OBV - On Balance Volume"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"fast_period": 10, "slow_period": 30}

    def _create_config(self) -> IndicatorConfig:
        fast = self.params["fast_period"]
        slow = self.params["slow_period"]
        return IndicatorConfig(
            name="OBV",
            category=IndicatorCategory.VOLUME,
            description=f"On Balance Volume ({fast},{slow})",
            parameters=self.params,
            output_names=["OBV_HISTOGRAM"],
            formula=f"OBV=cumsum(signed_vol); HISTOGRAM=EMA(OBV,{fast})-EMA(OBV,{slow})",
            interpretation="OBV_HISTOGRAM crossing above 0 = capital inflow, crossing below 0 = capital outflow",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        fast_period = self.params["fast_period"]
        slow_period = self.params["slow_period"]
        close = data['close']
        volume = data['volume']
        close_ref = TechnicalUtils.ref(close, 1)
        vol = np.where(close > close_ref, volume, np.where(close < close_ref, -volume, 0))
        obv = pd.Series(vol, index=data.index).cumsum()
        obv_ema_fast = TechnicalUtils.ema(obv, fast_period)
        obv_ema_slow = TechnicalUtils.ema(obv, slow_period)
        obv_histogram = obv_ema_fast - obv_ema_slow
        signals = self.get_signals([obv_histogram], data.index)
        return IndicatorResult(
            values={"OBV_HISTOGRAM": obv_histogram},
            signals=signals,
            metadata={"fast_period": fast_period, "slow_period": slow_period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        obv_histogram = raw_values[0]
        cross_up = ((obv_histogram > 0) & (obv_histogram.shift(1) <= 0)).astype(int)
        cross_down = ((obv_histogram < 0) & (obv_histogram.shift(1) >= 0)).astype(int)
        trend = np.where(obv_histogram > 0, 1, np.where(obv_histogram < 0, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class MFI(BaseIndicator):
    """MFI - Money Flow Index"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 14, "up_threshold": 58, "down_threshold": 42}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="MFI",
            category=IndicatorCategory.VOLUME,
            description=f"Money Flow Index ({period})",
            parameters=self.params,
            output_names=[f"MFI_{period}"],
            formula=f"MFI = 100 - 100 / (1 + MF_POS_{period} / MF_NEG_{period})",
            interpretation="Similar to RSI but incorporates volume; measures overbought/oversold with money flow",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        high = data['high']
        low = data['low']
        close = data['close']
        volume = data['volume']
        typical_price = (high + low + close) / 3
        mf = typical_price * volume
        typical_price_ref = TechnicalUtils.ref(typical_price, 1)
        mf_pos = np.where(typical_price >= typical_price_ref, mf, 0)
        mf_neg = np.where(typical_price <= typical_price_ref, mf, 0)
        mf_pos_sum = TechnicalUtils.rolling_sum(pd.Series(mf_pos, index=data.index), period)
        mf_neg_sum = TechnicalUtils.rolling_sum(pd.Series(mf_neg, index=data.index), period)
        mfi = 100 - 100 / (1 + mf_pos_sum / (mf_neg_sum + 1e-10))
        signals = self.get_signals([mfi], data.index)
        return IndicatorResult(
            values={f"MFI_{period}": mfi},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        mfi = raw_values[0]
        up_th = self.params['up_threshold']
        dn_th = self.params['down_threshold']
        cross_up = ((mfi >= up_th) & (mfi.shift(1) < up_th)).astype(int)
        cross_down = ((mfi <= dn_th) & (mfi.shift(1) > dn_th)).astype(int)
        trend = np.where(mfi >= up_th, 1, np.where(mfi <= dn_th, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class VWAP(BaseIndicator):
    """VWAP - Volume Weighted Average Price"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 20}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="VWAP",
            category=IndicatorCategory.VOLUME,
            description=f"Volume Weighted Average Price ({period})",
            parameters=self.params,
            output_names=[f"VWAP_{period}"],
            formula=f"VWAP = SUM(TP*VOL, {period}) / SUM(VOL, {period})",
            interpretation="Price above VWAP = bullish bias, below = bearish bias; institutional price benchmark",
            display_panel="main"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        high = data['high']
        low = data['low']
        close = data['close']
        volume = data['volume']
        typical = (high + low + close) / 3
        mf = volume * typical
        volume_sum = TechnicalUtils.rolling_sum(volume, period)
        mf_sum = TechnicalUtils.rolling_sum(mf, period)
        vwap = mf_sum / (volume_sum + 1e-10)
        signals = self.get_signals([close, vwap], data.index)
        return IndicatorResult(
            values={f"VWAP_{period}": vwap},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        close, vwap = raw_values
        cross_up = ((close > vwap) & (close.shift(1) <= vwap.shift(1))).astype(int)
        cross_down = ((close < vwap) & (close.shift(1) >= vwap.shift(1))).astype(int)
        trend = np.where(close > vwap, 1, np.where(close < vwap, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


# ============================================================
# Momentum (3): DMA, MTM, EMV
# ============================================================

@register_indicator
class DMA(BaseIndicator):
    """DMA - Difference of Moving Averages"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"short": 10, "long": 50, "signal": 10}

    def _create_config(self) -> IndicatorConfig:
        short = self.params["short"]
        long_ = self.params["long"]
        signal = self.params["signal"]
        return IndicatorConfig(
            name="DMA",
            category=IndicatorCategory.MOMENTUM,
            description=f"Difference of Moving Averages ({short},{long_},{signal})",
            parameters=self.params,
            output_names=["DMA", "AMA"],
            formula=f"DMA=MA(CLOSE,{short})-MA(CLOSE,{long_}); AMA=MA(DMA,{signal})",
            interpretation="DMA crossing above AMA = golden cross (buy), crossing below = death cross (sell)",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        short = self.params["short"]
        long_ = self.params["long"]
        signal = self.params["signal"]
        close = data['close']
        ma_short = TechnicalUtils.sma(close, short)
        ma_long = TechnicalUtils.sma(close, long_)
        dma = ma_short - ma_long
        ama = TechnicalUtils.sma(dma, signal)
        signals = self.get_signals([dma, ama], data.index)
        return IndicatorResult(
            values={"DMA": dma, "AMA": ama},
            signals=signals,
            metadata={"short": short, "long": long_, "signal": signal}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        dma, ama = raw_values
        cross_up = ((dma >= ama) & (dma.shift(1) < ama.shift(1))).astype(int)
        cross_down = ((dma <= ama) & (dma.shift(1) > ama.shift(1))).astype(int)
        trend = np.where(
            (dma > ama) & (dma > 0), 1,
            np.where((dma < ama) & (dma < 0), -1, 0)
        )
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class MTM(BaseIndicator):
    """MTM - Momentum"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 60}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="MTM",
            category=IndicatorCategory.MOMENTUM,
            description=f"Momentum ({period})",
            parameters=self.params,
            output_names=[f"MTM_{period}"],
            formula=f"MTM = CLOSE - REF(CLOSE, {period})",
            interpretation="MTM crossing above 0 = buy signal, crossing below 0 = sell signal",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        close = data['close']
        mtm = close - TechnicalUtils.ref(close, period)
        signals = self.get_signals([mtm], data.index)
        return IndicatorResult(
            values={f"MTM_{period}": mtm},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        mtm = raw_values[0]
        cross_up = ((mtm > 0) & (mtm.shift(1) <= 0)).astype(int)
        cross_down = ((mtm < 0) & (mtm.shift(1) >= 0)).astype(int)
        trend = np.where(mtm > 0, 1, np.where(mtm < 0, -1, 0))
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


@register_indicator
class EMV(BaseIndicator):
    """EMV - Ease of Movement"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"period": 14}

    def _create_config(self) -> IndicatorConfig:
        period = self.params["period"]
        return IndicatorConfig(
            name="EMV",
            category=IndicatorCategory.MOMENTUM,
            description=f"Ease of Movement ({period})",
            parameters=self.params,
            output_names=["EMV", "EMV_MA"],
            formula=f"distance=midpoint_change; box_ratio=volume/(high-low); EMV=distance/box_ratio; EMV_MA=MA(EMV,{period})",
            interpretation="EMV>0 and rising = easy upward movement; EMV<0 = downward momentum; EMV_MA for confirmation",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        period = self.params["period"]
        high = data['high']
        low = data['low']
        volume = data['volume']

        midpoint = (high + low) / 2
        prev_midpoint = midpoint.shift(1)
        distance = midpoint - prev_midpoint

        hl_diff = high - low
        hl_diff = hl_diff.replace(0, 1e-10)
        box_ratio = volume / hl_diff

        emv = distance / (box_ratio + 1e-10)
        emv_ma = TechnicalUtils.sma(emv, period)

        signals = self.get_signals([emv, emv_ma], data.index)
        return IndicatorResult(
            values={"EMV": emv, "EMV_MA": emv_ma},
            signals=signals,
            metadata={"period": period}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        emv, emv_ma = raw_values
        cross_up = ((emv >= emv_ma) & (emv.shift(1) < emv_ma.shift(1))).astype(int)
        cross_down = ((emv <= emv_ma) & (emv.shift(1) > emv_ma.shift(1))).astype(int)
        trend = np.where(
            (emv > 0) & (emv > emv_ma), 1,
            np.where((emv < 0) & (emv < emv_ma), -1, 0)
        )
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }


# ============================================================
# Support/Resistance (1): FIB
# ============================================================

@register_indicator
class FIB(BaseIndicator):
    """FIB - Fibonacci Retracement"""

    def _get_default_params(self) -> Dict[str, Any]:
        return {"n": 20, "m": 5, "buy_threshold": 20, "sell_threshold": 80}

    def _create_config(self) -> IndicatorConfig:
        n = self.params["n"]
        m = self.params["m"]
        return IndicatorConfig(
            name="FIB",
            category=IndicatorCategory.SUPPORT_RESISTANCE,
            description=f"Fibonacci Retracement ({n},{m})",
            parameters=self.params,
            output_names=[f"FIB_STRENGTH_{n}_{m}", f"FIB_TREND_MA_{m}"],
            formula=f"FIB_POSITION=(CLOSE-LOW_{n})/(HIGH_{n}-LOW_{n})*100; FIB_STRENGTH=EMA(FIB_POS,{m})",
            interpretation="Provides key Fibonacci support/resistance levels (0.236/0.382/0.5/0.618/0.786)",
            display_panel="separate"
        )

    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        n = self.params["n"]
        m = self.params["m"]
        high = data['high']
        low = data['low']
        close = data['close']

        high_n = high.rolling(window=n).max()
        low_n = low.rolling(window=n).min()
        price_range = high_n - low_n

        fib_0 = high_n
        fib_236 = high_n - price_range * 0.236
        fib_382 = high_n - price_range * 0.382
        fib_500 = high_n - price_range * 0.500
        fib_618 = high_n - price_range * 0.618
        fib_786 = high_n - price_range * 0.786
        fib_100 = low_n

        fib_position = np.where(price_range > 0, (close - low_n) / price_range * 100, 50)
        fib_position_series = pd.Series(fib_position, index=close.index)
        fib_strength = TechnicalUtils.ema(fib_position_series, m)

        fib_trend = np.where(
            close > fib_618, 3,
            np.where(close > fib_500, 2,
                     np.where(close > fib_382, 1,
                              np.where(close > fib_236, 0, -1)))
        )
        fib_trend_series = pd.Series(fib_trend, index=close.index)
        fib_trend_ma = TechnicalUtils.sma(fib_trend_series, m)

        signals = self.get_signals(
            [close, fib_236, fib_382, fib_500, fib_618, fib_786, fib_strength, fib_trend_ma],
            data.index)
        return IndicatorResult(
            values={
                'fib_high': fib_0,
                'fib_236': fib_236,
                'fib_382': fib_382,
                'fib_500': fib_500,
                'fib_618': fib_618,
                'fib_786': fib_786,
                'fib_low': fib_100,
                f'fib_strength_{n}_{m}': fib_strength,
            },
            signals=signals,
            metadata={"n": n, "m": m}
        )

    def get_signals(self, raw_values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        buy_threshold = self.params["buy_threshold"]
        sell_threshold = self.params["sell_threshold"]
        close, fib_236, fib_382, fib_500, fib_618, fib_786, fib_strength, fib_trend_ma = raw_values

        strength_cross_up = ((fib_strength >= buy_threshold) & (fib_strength.shift(1) < buy_threshold))
        price_above_382 = close > fib_382
        cross_up = (strength_cross_up & price_above_382).astype(int)

        strength_cross_down = ((fib_strength <= sell_threshold) & (fib_strength.shift(1) > sell_threshold))
        price_below_618 = close < fib_618
        cross_down = (strength_cross_down & price_below_618).astype(int)

        trend = np.where(
            (fib_trend_ma > 1.5) & (close > fib_382), 1,
            np.where((fib_trend_ma < -0.5) & (close < fib_618), -1, 0)
        )
        return {
            "cross_up": pd.Series(cross_up, index=data_index),
            "cross_down": pd.Series(cross_down, index=data_index),
            "trend": pd.Series(trend, index=data_index),
        }
