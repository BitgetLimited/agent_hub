from abc import ABC, abstractmethod
from typing import Dict, List, Any, Type
import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from enum import Enum

from pandas import Series


def timestamp_to_date(timestamp):
    """Convert Unix millisecond timestamp to YYYY-MM-DD HH:MM date string."""
    from datetime import datetime
    timestamp = int(timestamp)
    timestamp_seconds = timestamp / 1000
    date_str = datetime.fromtimestamp(timestamp_seconds).strftime('%Y-%m-%d %H:%M')
    return date_str


def get_current_hour_timestamp():
    """Get current timestamp rounded to the hour (milliseconds)."""
    from datetime import datetime
    now = datetime.now()
    hour_datetime = datetime(now.year, now.month, now.day, now.hour)
    hourly_timestamp_ms = int(hour_datetime.timestamp() * 1000)
    return hourly_timestamp_ms


_INDICATOR_REGISTRY = {}


def register_indicator(cls):
    """Indicator registration decorator."""
    temp_instance = cls()
    indicator_name = temp_instance.config.name
    _INDICATOR_REGISTRY[indicator_name] = cls
    return cls


def get_registered_indicators():
    """Get all registered indicators."""
    return _INDICATOR_REGISTRY.copy()


def clear_registry():
    """Clear the registry (mainly for testing)."""
    global _INDICATOR_REGISTRY
    _INDICATOR_REGISTRY.clear()


class IndicatorCategory(Enum):
    """Indicator categories."""
    TREND = "trend"
    MOMENTUM = "momentum"
    VOLATILITY = "volatility"
    VOLUME = "volume"
    OSCILLATOR = "oscillator"
    SUPPORT_RESISTANCE = "support_resistance"


@dataclass
class IndicatorResult:
    """Indicator calculation result.

    values: Dict[str, pd.Series] - raw calculated indicator values
    signals: Dict[str, pd.Series] - trading signals (cross_up, cross_down, trend)
    metadata: Dict[str, Any] - metadata
    """
    values: Dict[str, pd.Series] = field(default_factory=dict)
    signals: Dict[str, pd.Series] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __getitem__(self, key: str):
        """Support dict-like access."""
        if isinstance(self.values, dict):
            if key in self.values:
                return self.values[key]
            else:
                raise KeyError(f"Key '{key}' not found in values")
        elif key == 'values' or key == 'main':
            return self.values
        else:
            raise KeyError(f"Key '{key}' not found. Available keys for single value: ['values', 'main']")

    def get_all_values(self) -> dict[str, Series] | dict[str, dict[str, Series]]:
        """Get all values (unified format)."""
        if isinstance(self.values, dict):
            return self.values
        else:
            return {"main": self.values}


@dataclass
class IndicatorConfig:
    """Indicator configuration."""
    name: str
    category: IndicatorCategory
    description: str
    parameters: Dict[str, Any]
    output_names: List[str]
    formula: str
    interpretation: str
    display_panel: str = "main"

    def validate(self) -> bool:
        """Validate configuration."""
        required_fields = [self.name, self.category, self.output_names]
        return all(field_ is not None for field_ in required_fields)


class TechnicalUtils:
    """Technical analysis utility class."""

    @staticmethod
    def sma(data: pd.Series, period: int) -> pd.Series:
        """Simple Moving Average."""
        return data.rolling(window=period, min_periods=1).mean()

    @staticmethod
    def ema(data: pd.Series, period: int) -> pd.Series:
        """Exponential Moving Average."""
        return data.ewm(span=period, adjust=False).mean()

    @staticmethod
    def wma(data: pd.Series, period: int) -> pd.Series:
        """Weighted Moving Average."""
        def weighted_mean(x):
            weights = np.arange(1, len(x) + 1)
            return np.average(x, weights=weights)
        return data.rolling(window=period, min_periods=1).apply(weighted_mean, raw=True)

    @staticmethod
    def ref(data: pd.Series, period: int) -> pd.Series:
        """Reference data N periods ago."""
        return data.shift(period)

    @staticmethod
    def highest(data: pd.Series, period: int) -> pd.Series:
        """Rolling maximum."""
        return data.rolling(window=period, min_periods=1).max()

    @staticmethod
    def lowest(data: pd.Series, period: int) -> pd.Series:
        """Rolling minimum."""
        return data.rolling(window=period, min_periods=1).min()

    @staticmethod
    def stddev(data: pd.Series, period: int) -> pd.Series:
        """Rolling standard deviation."""
        return data.rolling(window=period, min_periods=1).std()

    @staticmethod
    def rma(data: pd.Series, period: int) -> pd.Series:
        """RMA (Wilder's Moving Average)."""
        alpha = 1.0 / period
        return data.ewm(alpha=alpha, adjust=False).mean()

    @staticmethod
    def rolling_sum(data: pd.Series, period: int) -> pd.Series:
        """Rolling sum."""
        return data.rolling(window=period, min_periods=1).sum()

    @staticmethod
    def cross_over(series1: pd.Series, series2: pd.Series) -> pd.Series:
        """Crossover signal (series1 crosses above series2)."""
        return ((series1 > series2) & (series1.shift(1) <= series2.shift(1))).astype(int)

    @staticmethod
    def cross_under(series1: pd.Series, series2: pd.Series) -> pd.Series:
        """Crossunder signal (series1 crosses below series2)."""
        return ((series1 < series2) & (series1.shift(1) >= series2.shift(1))).astype(int)


class BaseIndicator(ABC):
    """Base indicator class."""

    def __init__(self, **params):
        self.params = self._get_default_params()
        self.params.update(params)
        self.config = self._create_config()
        if not self.config.validate():
            raise ValueError(f"Invalid configuration for indicator {self.config.name}")

    @abstractmethod
    def _get_default_params(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def _create_config(self) -> IndicatorConfig:
        pass

    @abstractmethod
    def calculate(self, data: pd.DataFrame) -> IndicatorResult:
        pass

    def get_signals(self, values: List[pd.Series], data_index: pd.Index) -> Dict[str, pd.Series]:
        return {}

    def get_config(self) -> IndicatorConfig:
        return self.config

    def update_params(self, **params):
        self.params.update(params)
        self.config = self._create_config()
        if not self.config.validate():
            raise ValueError(f"Invalid configuration after updating parameters")

    def get_param(self, key: str, default=None):
        return self.params.get(key, default)

    def __str__(self):
        params_str = ", ".join([f"{k}={v}" for k, v in self.params.items()])
        return f"{self.config.name}({params_str})"

    def __repr__(self):
        return self.__str__()


class DataValidator:
    """Data validation utility."""

    @staticmethod
    def validate_ohlcv(data: pd.DataFrame) -> bool:
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        for col in required_columns:
            if col not in data.columns:
                raise ValueError(f"Missing required column: {col}")
        for col in required_columns:
            if not pd.api.types.is_numeric_dtype(data[col]):
                raise ValueError(f"Column {col} must be numeric")
        if not (data['high'] >= data['low']).all():
            raise ValueError("High prices must be >= Low prices")
        if not ((data['high'] >= data['open']) & (data['high'] >= data['close'])).all():
            raise ValueError("High prices must be >= Open and Close prices")
        if not ((data['low'] <= data['open']) & (data['low'] <= data['close'])).all():
            raise ValueError("Low prices must be <= Open and Close prices")
        if 'timestamp' in data.columns:
            DataValidator.validate_timestamp(data['timestamp'])
        return True

    @staticmethod
    def validate_timestamp(timestamp_series: pd.Series) -> bool:
        if pd.api.types.is_datetime64_any_dtype(timestamp_series):
            return True
        try:
            numeric = pd.to_numeric(timestamp_series, errors='coerce')
            if numeric.notna().all():
                return True
        except Exception:
            pass
        try:
            pd.to_datetime(timestamp_series)
        except Exception:
            raise ValueError("Timestamp column must be datetime or convertible to datetime")
        return True

    @staticmethod
    def check_sufficient_data(data: pd.DataFrame, min_periods: int) -> bool:
        if len(data) < min_periods:
            raise ValueError(f"Insufficient data: need at least {min_periods} rows, got {len(data)}")
        return True


class IndicatorManager:
    """Indicator manager: manages and computes technical indicators.

    Usage:
        manager = IndicatorManager(show_indicators=False)
        config = {
            "MACD": {"fast": 12, "slow": 26, "signal": 9},
            "BOLL": {"period": 20, "std_dev": 2},
            "RSI": {"period": 14},
            "SuperTrend": {"period": 10, "multiplier": 3.0},
        }
        output = manager.calculate_and_export(config, df, tail=50)
        print(json.dumps(output, indent=2))
    """

    def __init__(self, show_indicators: object = True) -> None:
        self._indicator_classes: Dict[str, Type[BaseIndicator]] = {}
        self._register_indicators(show_indicators)

    def _register_indicators(self, show_indicators=True):
        """Auto-register all indicator classes."""
        try:
            import kline_indicators
        except ImportError:
            pass

        self._indicator_classes = get_registered_indicators()

        if show_indicators:
            for name in sorted(self._indicator_classes.keys()):
                pass

    def create_indicator(self, name: str, **kwargs) -> BaseIndicator:
        if name not in self._indicator_classes:
            available = sorted(self._indicator_classes.keys())
            raise ValueError(f"Unknown indicator: '{name}'. Available indicators: {available}")
        indicator_class = self._indicator_classes[name]
        return indicator_class(**kwargs)

    def calculate(self, name: str, data: pd.DataFrame, **kwargs) -> IndicatorResult:
        DataValidator.validate_ohlcv(data)
        indicator = self.create_indicator(name, **kwargs)
        return indicator.calculate(data)

    def calculate_multiple(
        self,
        indicators_config: Dict[str, Dict[str, Any]],
        data: pd.DataFrame
    ) -> Dict[str, IndicatorResult]:
        DataValidator.validate_ohlcv(data)
        results = {}
        for indicator_name, config in indicators_config.items():
            try:
                if isinstance(config, list):
                    for kwargs in config:
                        result = self.calculate(indicator_name, data, **kwargs)
                        results[f"{indicator_name}_{kwargs['period']}"] = result
                else:
                    result = self.calculate(indicator_name, data, **config)
                    results[indicator_name] = result
            except Exception as e:
                results[indicator_name] = IndicatorResult(
                    values={}, signals={},
                    metadata={"error": str(e)}
                )
        return results

    def calculate_and_export(
        self, config: dict, df: pd.DataFrame, tail: int = 50, csv_path: str = None
    ) -> dict:
        """Compute indicators and return series (last `tail` bars) + context.

        For FIB: returns `levels` (latest snapshot) instead of `series`.
        If csv_path is provided, exports full indicator time series to CSV.
        """
        results = self.calculate_multiple(config, df)
        output = {"indicators": {}}

        for name, result in results.items():
            is_fib = name.upper().startswith("FIB")
            ctx = self._extract_context(result)

            if is_fib:
                levels = {}
                for k, v in result.values.items():
                    val = v.iloc[-1]
                    levels[k] = float(val) if pd.notna(val) else None
                output["indicators"][name] = {"levels": levels, "context": ctx}
            else:
                series = {}
                for k, v in result.values.items():
                    tail_slice = v.iloc[-tail:]
                    series[k] = [
                        round(float(x), 10) if pd.notna(x) else None
                        for x in tail_slice.values
                    ]
                output["indicators"][name] = {"series": series, "context": ctx}

        output["candles_count"] = len(df)
        output["tail"] = tail

        if csv_path:
            self._export_csv(results, df, csv_path)

        return output

    @staticmethod
    def _export_csv(
        results: Dict[str, 'IndicatorResult'], df: pd.DataFrame, csv_path: str
    ) -> None:
        """Export full indicator value series to CSV alongside OHLCV data."""
        export_df = df[['open', 'high', 'low', 'close', 'volume']].copy()
        if 'datetime' in df.columns:
            export_df.insert(0, 'datetime', df['datetime'])
        elif 'timestamp' in df.columns:
            export_df.insert(0, 'timestamp', df['timestamp'])
        for name, result in results.items():
            for col_name, series in result.values.items():
                export_df[col_name] = series.values
        export_df.to_csv(csv_path, index=False)


    def _extract_context(self, result: IndicatorResult) -> dict:
        """Extract context from full series (trend streak count, last crossover position, etc.)."""
        ctx = {}
        for sig_name, sig_series in result.signals.items():
            if sig_name == "trend":
                current = sig_series.iloc[-1]
                streak = 0
                for v in reversed(sig_series.values):
                    if v == current:
                        streak += 1
                    else:
                        break
                ctx["trend_streak"] = int(streak)
            elif sig_name in ("cross_up", "cross_down"):
                last = sig_series[sig_series == 1]
                if len(last) > 0:
                    ctx[f"last_{sig_name}_bars_ago"] = int(len(sig_series) - last.index[-1] - 1)
        return ctx

    @staticmethod
    def get_ind_values(
        indicators_result: Dict[str, IndicatorResult],
        data_index: pd.Index
    ) -> pd.DataFrame:
        all_values = {}
        for indicator_name, result in indicators_result.items():
            try:
                for signal_name, signal_data in result.values.items():
                    all_values[signal_name] = signal_data
            except Exception:
                pass
        if all_values:
            return pd.DataFrame(all_values, index=data_index)
        else:
            return pd.DataFrame(index=data_index)

    @staticmethod
    def get_latest_ind_values(
        indicators_result: Dict[str, IndicatorResult]
    ) -> dict:
        all_values = {}
        for indicator_name, result in indicators_result.items():
            try:
                for signal_name, signal_data in result.values.items():
                    all_values[signal_name] = round(float(signal_data.iloc[-1]), 2)
            except Exception:
                pass
        return all_values

    def list_indicators(self) -> List[str]:
        return sorted(self._indicator_classes.keys())

    def get_indicators_by_category(self, category: IndicatorCategory) -> List[str]:
        result = []
        for name, indicator_class in self._indicator_classes.items():
            temp_instance = indicator_class()
            if temp_instance.config.category == category:
                result.append(name)
        return sorted(result)

    def get_indicator_info(self, name: str) -> Dict[str, Any]:
        if name not in self._indicator_classes:
            raise ValueError(f"Unknown indicator: {name}")
        indicator = self._indicator_classes[name]()
        config = indicator.get_config()
        return {
            "name": config.name,
            "category": config.category.value,
            "description": config.description,
            "parameters": config.parameters,
            "output_names": config.output_names,
            "formula": config.formula,
            "interpretation": config.interpretation,
            "display_panel": config.display_panel
        }

    def validate_config(self, indicators_config: Dict[str, Dict[str, Any]]) -> Dict[str, str]:
        validation_results = {}
        for indicator_name, kwargs in indicators_config.items():
            try:
                self.create_indicator(indicator_name, **kwargs)
                validation_results[indicator_name] = ""
            except Exception as e:
                validation_results[indicator_name] = str(e)
        return validation_results

    def get_registry_status(self) -> Dict[str, Any]:
        return {
            "total_indicators": len(self._indicator_classes),
            "indicators": list(self._indicator_classes.keys()),
            "categories": {
                category.value: len(self.get_indicators_by_category(category))
                for category in IndicatorCategory
            }
        }
