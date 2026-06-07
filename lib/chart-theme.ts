import type { CSSProperties } from "react";

export const CHART_COLORS = {
  income: "#70e1b0",
  expense: "#fb7185",
  grid: "#1c2838",
  muted: "#8b9bb0",
  tooltipBackground: "#0d1420",
  tooltipBorder: "#1c2838",
  tooltipText: "#ffffff",
} as const;

export const chartTooltipContentStyle: CSSProperties = {
  background: CHART_COLORS.tooltipBackground,
  border: `1px solid ${CHART_COLORS.tooltipBorder}`,
  borderRadius: 12,
  color: CHART_COLORS.tooltipText,
};

export const chartTooltipTextStyle: CSSProperties = {
  color: CHART_COLORS.tooltipText,
};
