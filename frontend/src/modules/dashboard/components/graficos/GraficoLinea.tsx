import { Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import './registro'
import { useColoresGrafico } from './useColoresGrafico'

export interface SerieLinea {
  etiqueta: string
  color: string
  relleno?: boolean
}

interface GraficoLineaProps {
  titulo: string
  etiquetas: string[]
  series: Array<{ nombre: string; valores: number[]; color: string; relleno?: boolean }>
  formato?: (valor: number) => string
}

export default function GraficoLinea({ titulo, etiquetas, series, formato }: GraficoLineaProps) {
  const { texto, grid } = useColoresGrafico()

  const data: ChartData<'line'> = {
    labels: etiquetas,
    datasets: series.map((s) => ({
      label: s.nombre,
      data: s.valores,
      borderColor: s.color,
      backgroundColor: s.relleno ? `${s.color}26` : s.color,
      fill: s.relleno ?? false,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: s.color,
    })),
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: texto, usePointStyle: true, boxWidth: 8, padding: 14, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (contexto) => {
            const valor = Number(contexto.parsed.y)
            return ` ${contexto.dataset.label}: ${formato ? formato(valor) : valor}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: grid },
        ticks: { color: texto, font: { size: 11 } },
      },
      y: {
        grid: { color: grid },
        ticks: {
          color: texto,
          font: { size: 11 },
          callback: (valor) => (formato ? formato(Number(valor)) : String(valor)),
        },
      },
    },
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{titulo}</h3>
      <div style={{ height: 260 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
