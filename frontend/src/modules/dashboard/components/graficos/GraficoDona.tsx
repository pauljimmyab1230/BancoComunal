import { Doughnut } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import './registro'
import { useColoresGrafico } from './useColoresGrafico'

interface GraficoDonaProps {
  titulo: string
  etiquetas: string[]
  valores: number[]
  formato?: (valor: number) => string
}

export default function GraficoDona({ titulo, etiquetas, valores, formato }: GraficoDonaProps) {
  const { texto, superficie, paleta } = useColoresGrafico()
  const total = valores.reduce((suma, valor) => suma + valor, 0)

  const data: ChartData<'doughnut'> = {
    labels: etiquetas,
    datasets: [
      {
        data: valores,
        backgroundColor: paleta,
        borderColor: superficie,
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: texto,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (contexto) => {
            const valor = Number(contexto.parsed)
            const porcentaje = total > 0 ? ((valor / total) * 100).toFixed(1) : '0'
            const textoValor = formato ? formato(valor) : String(valor)
            return ` ${contexto.label}: ${textoValor} (${porcentaje}%)`
          },
        },
      },
    },
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{titulo}</h3>
      <div style={{ height: 260 }}>
        <Doughnut data={data} options={options} />
      </div>
    </div>
  )
}
