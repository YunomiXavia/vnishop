import { _DeepPartialObject } from "chart.js/dist/types/utils";
import {
  BarControllerChartOptions,
  CoreChartOptions,
  DatasetChartOptions,
  ElementChartOptions,
  PluginChartOptions,
  ScaleChartOptions,
} from "chart.js";

export const barChartOptions: _DeepPartialObject<
  CoreChartOptions<"bar"> &
    ElementChartOptions<"bar"> &
    PluginChartOptions<"bar"> &
    DatasetChartOptions<"bar"> &
    ScaleChartOptions<"bar"> &
    BarControllerChartOptions
> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          return context.label || "";
        },
      },
    },
    legend: {
      display: true,
      position: "top",
    },
  },
  layout: {
    padding: {
      top: 20,
      left: 10,
      right: 10,
      bottom: 10,
    },
  },
  scales: {
    x: {
      ticks: {
        autoSkip: false,
        maxRotation: 45,
        minRotation: 0,
        callback: function (value: any) {
          const chart = (this as any).chart;
          const label = chart.data.labels ? chart.data.labels[value] : value;
          return label && label.length > 15
            ? label.slice(0, 15) + "..."
            : label;
        },
      },
    },
    y: {
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        minRotation: 0,
      },
    },
  },
  elements: {
    bar: {
      barThickness: 25,
    },
  },
};

export interface ChartProps {
  type: "bar" | "pie";
  data: any;
  options: any;
  title: string;
}
