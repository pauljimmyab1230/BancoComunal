import { useDashboard } from '../hooks/useDashboard'
import { LoadingSpinner, ErrorState, EmptyState, SectionHeader } from '@/components/ui'
import type { DashboardData } from '../types'
import SummaryCards from '../components/SummaryCards'
import ArqueosAlerta from '../components/ArqueosAlerta'
import GraficosResumen from '../components/GraficosResumen'
import GraficosEvolucion from '../components/GraficosEvolucion'
import CajasBar from '../components/CajasBar'
import MovimientosHoy from '../components/MovimientosHoy'
import CuotasProximas from '../components/CuotasProximas'
import PrestamosTop5 from '../components/PrestamosTop5'
import ActividadReciente from '../components/ActividadReciente'

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard()

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner text="Cargando dashboard..." />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState error={error} onRetry={() => refetch()} title="No se pudo cargar el dashboard" />
    )
  }

  if (!data) return <EmptyState title="Sin datos" />

  const d = data as DashboardData

  return (
    <div className="space-y-6">
      <SectionHeader title="Dashboard" description="Resumen general del sistema" />

      <SummaryCards resumen={d.resumen} cajasCount={d.cajas?.length || 0} />

      <ArqueosAlerta arqueos={d.arqueosPendientes} />

      <GraficosResumen data={d} />

      <GraficosEvolucion />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CajasBar cajas={d.cajas} />
        <MovimientosHoy movimientos={d.movimientosHoy} />
      </div>

      <CuotasProximas cuotas={d.cuotasProximas} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PrestamosTop5 prestamos={d.prestamosTop5} />
        <ActividadReciente actividad={d.actividadReciente} />
      </div>
    </div>
  )
}
