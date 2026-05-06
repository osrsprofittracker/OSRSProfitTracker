import React from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const robustScaleFor = (data) => {
  const absolutes = data
    .map((row) => Math.abs(row.margin))
    .filter((value) => value > 0)
    .sort((a, b) => b - a);

  if (!absolutes.length) return 1;
  if (absolutes.length === 1) return absolutes[0];

  const [largest, secondLargest] = absolutes;
  return largest > secondLargest * 3 ? secondLargest / 0.82 : largest;
};

const chartValueFor = (value, scale) => {
  const sign = value < 0 ? -1 : 1;
  return sign * Math.min(Math.abs(value), scale);
};

const marginDomain = (data) => {
  const values = data.map((row) => Number(row.chartMargin) || 0);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const top = max > 0 ? Math.ceil(max * 1.12) : 1;
  if (min < 0) return [Math.floor(min * 1.12), top];
  return [0, top];
};

function CappedBarShape(props) {
  const {
    x,
    y,
    width,
    height,
    payload,
    fill,
  } = props;

  if (!payload?.isCapped) {
    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
  }

  const markerY = payload.margin < 0 ? y + height : y;
  const markerDirection = payload.margin < 0 ? 1 : -1;
  const markerInset = Math.min(10, width * 0.18);

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} />
      <path
        className="category-margin-cap-marker"
        d={`M ${x + markerInset} ${markerY + (markerDirection * 2)} L ${x + (width / 2)} ${markerY + (markerDirection * 10)} L ${x + width - markerInset} ${markerY + (markerDirection * 2)}`}
      />
    </g>
  );
}

function MarginTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="analytics-tooltip">
      <div className="analytics-tooltip-label">{row.category}</div>
      <div className="analytics-tooltip-row">
        <span>Avg margin</span>
        <span className="analytics-tooltip-value">{row.margin.toFixed(1)}%</span>
      </div>
      {row.isCapped && (
        <div className="analytics-tooltip-row">
          <span>Bar scale</span>
          <span className="analytics-tooltip-value">Exceeded visual cap</span>
        </div>
      )}
    </div>
  );
}

export default function CategoryMarginChart({ rows = [] }) {
  const baseData = [...rows]
    .map((row) => ({
      category: row.category,
      margin: Number(row.avgMarginPct) || 0,
    }))
    .sort((a, b) => b.margin - a.margin);
  const scale = robustScaleFor(baseData);
  const data = baseData.map((row) => {
    const chartMargin = chartValueFor(row.margin, scale);

    return {
      ...row,
      chartMargin,
      label: `${row.margin.toFixed(1)}%`,
      isCapped: Math.abs(row.margin) > Math.abs(chartMargin),
    };
  });

  return (
    <div className="analytics-widget">
      <div className="analytics-widget-header">
        <h3
          className="analytics-widget-title has-tooltip"
          data-tooltip="Selected-timeframe weighted category margin: category profit divided by estimated sold cost basis. Extreme outliers are capped visually; labels and tooltips show the real margin."
        >
          Weighted margin by category
        </h3>
      </div>
      {data.length === 0 ? (
        <div className="analytics-widget-empty">No categories to chart.</div>
      ) : (
        <div className="analytics-widget-body analytics-chart-medium">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="category"
                stroke="rgb(148, 163, 184)"
                fontSize={11}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={64}
              />
              <YAxis
                stroke="rgb(148, 163, 184)"
                fontSize={11}
                domain={marginDomain(data)}
                tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
              />
              <ReferenceLine y={0} stroke="rgb(148, 163, 184)" strokeWidth={1.5} />
              <Tooltip content={<MarginTooltip />} />
              <Bar
                dataKey="chartMargin"
                name="Weighted margin"
                isAnimationActive={false}
                shape={<CappedBarShape />}
              >
                <LabelList dataKey="label" position="top" className="category-margin-chart-label" />
                {data.map((row) => (
                  <Cell
                    key={row.category}
                    fill={row.margin < 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
