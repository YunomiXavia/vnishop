import { ChartProps } from "@/types/component/chart/chart";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);
import React from "react";

const Chart: React.FC<ChartProps> = ({ type, data, options, title }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col justify-center items-center h-[350px]">
      <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      <div className="relative flex-grow">
        {type === "pie" ? (
          <Pie data={data} options={options} />
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>
    </div>
  );
};

export default Chart;
