import { Doughnut } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'
import './registro'
import { useColoresGrafico } from './useColoresGrafico'

interface GraficoIndicadorProps {
  titulo: string
  valor: number
  maximo?: number
  color?: string
  formato?: (valor: number) => string
}

/** Indicador de progreso tipo "gauge" (anillo de dona con un único valor). */
export default function GraficoIndicador({
  titulo,
  valor,
  maximo = 100,
  color = '#f43f5e',
  formato,
}: GraficoIndicadorProps) {
  const { grid } = useColoresGrafico()
  const valorNormalizado = Math.max(0, Math.min(valor, maximo))
  const resto = Math.max(0, maximo - valorNormalizado)

  const data: ChartData<'doughnut'> = {
    datasets: [
      {
        data: [valorNormalizado, resto],
        backgroundColor: [color, grid],
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '78%',
    rotation: -90,
    circumference: 360,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-1 text-sm font-semibold text-foreground">{titulo}</h3>
      <div className="relative h-32 w-32">
        <Doughnut data={data} options={options} />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-foreground">
            {formato ? formato(valor) : valor}
          </span>
        </div>
      </div>
    </div>
  )
}
