'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

export default function EvolucionChart() {
  const data = {
    labels: ['2021', '2022', '2023', '2024', '2025', '2026'],
    datasets: [
      {
        fill: true,
        label: 'Progreso Histórico (Global)',
        data: [45, 52, 60, 68, 75, 82],
        borderColor: '#1F4E79', // Azul corporativo de la fundación
        backgroundColor: 'rgba(31, 78, 121, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#1F4E79',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#1F4E79',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return context.parsed.y + '%'
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        border: { dash: [4, 4] },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          callback: function (value: any) {
            return value + '%'
          },
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Evolución Histórica General (Tendencia)</h3>
      <div className="relative h-[300px] w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
