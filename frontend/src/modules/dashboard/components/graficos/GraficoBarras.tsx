import { Bar } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import './registro'
import { useColoresGrafico } from './useColoresGrafico'

interface GraficoBarrasProps {
  titulo: string
  etiquetas: string[]
  valores: number[]
  formato?: (valor: number) => string
  colores?: string[]
  horizontal?: boolean
}

export default function GraficoBarras({
  titulo,
  etiquetas,
  valores,
  formato,
  colores,
  horizontal = false,
}: GraficoBarrasProps) {
  const { texto, grid, paleta } = useColoresGrafico()

  const data: ChartData<'bar'> = {
    labels: etiquetas,
    datasets: [
      {
        data: valores,
        backgroundColor: colores ?? paleta,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 48,
      },
    ],
  }

  const formatoValor = (valor: number): string => (formato ? formato(valor) : String(valor))

  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (contexto) => {
            const valor = Number(contexto.parsed.y ?? contexto.parsed.x)
            return ` ${contexto.label}: ${formatoValor(valor)}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: grid },
        ticks: {
          color: texto,
          font: { size: 11 },
          callback: horizontal ? (valor) => formatoValor(Number(valor)) : undefined,
        },
      },
      y: {
        grid: { color: grid },
        ticks: {
          color: texto,
          font: { size: 11 },
          callback: horizontal ? undefined : (valor) => formatoValor(Number(valor)),
        },
      },
    },
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{titulo}</h3>
      <div style={{ height: horizontal ? Math.max(180, etiquetas.length * 44) : 260 }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
