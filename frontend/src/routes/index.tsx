import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import AdminLayout from '@/components/layout/AdminLayout'

const SociosListPage = lazy(() => import('@/modules/socios/pages/SociosListPage'))
const SocioFormPage = lazy(() => import('@/modules/socios/pages/SocioFormPage'))
const SocioDetailPage = lazy(() => import('@/modules/socios/pages/SocioDetailPage'))
const SocioFichaPage = lazy(() => import('@/modules/socios/pages/SocioFichaPage'))
const FondosListPage = lazy(() => import('@/modules/fondos/pages/FondosListPage'))
const FondoFormPage = lazy(() => import('@/modules/fondos/pages/FondoFormPage'))
const FondoDetailPage = lazy(() => import('@/modules/fondos/pages/FondoDetailPage'))
const AportesListPage = lazy(() => import('@/modules/aportes/pages/AportesListPage'))
const AporteFormPage = lazy(() => import('@/modules/aportes/pages/AporteFormPage'))
const AporteDetailPage = lazy(() => import('@/modules/aportes/pages/AporteDetailPage'))
const CreditosListPage = lazy(() => import('@/modules/creditos/pages/CreditosListPage'))
const CreditoFormPage = lazy(() => import('@/modules/creditos/pages/CreditoFormPage'))
const CreditoDetailPage = lazy(() => import('@/modules/creditos/pages/CreditoDetailPage'))
const CajaListPage = lazy(() => import('@/modules/caja/pages/CajaListPage'))
const CajaFormPage = lazy(() => import('@/modules/caja/pages/CajaFormPage'))
const CajaDetailPage = lazy(() => import('@/modules/caja/pages/CajaDetailPage'))
const ReportesPage = lazy(() => import('@/modules/reportes/pages/ReportesPage'))
const ConfiguracionPage = lazy(() => import('@/modules/configuracion/pages/ConfiguracionPage'))
const AuditoriaPage = lazy(() => import('@/modules/auditoria/pages/AuditoriaPage'))
const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'))

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent" />
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    </div>
  )
}

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
)

export const routes = [
  {
    path: '/',
    element: (
      <SuspenseWrapper>
        <AdminLayout />
      </SuspenseWrapper>
    ),
    children: [
      { index: true, element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'socios',
        element: (
          <SuspenseWrapper>
            <SociosListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'socios/nuevo',
        element: (
          <SuspenseWrapper>
            <SocioFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'socios/:id',
        element: (
          <SuspenseWrapper>
            <SocioDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'socios/:id/editar',
        element: (
          <SuspenseWrapper>
            <SocioFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'socios/:id/ficha',
        element: (
          <SuspenseWrapper>
            <SocioFichaPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'fondos',
        element: (
          <SuspenseWrapper>
            <FondosListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'fondos/nuevo',
        element: (
          <SuspenseWrapper>
            <FondoFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'fondos/:id',
        element: (
          <SuspenseWrapper>
            <FondoDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'fondos/:id/editar',
        element: (
          <SuspenseWrapper>
            <FondoFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'aportes',
        element: (
          <SuspenseWrapper>
            <AportesListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'aportes/nuevo',
        element: (
          <SuspenseWrapper>
            <AporteFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'aportes/:id',
        element: (
          <SuspenseWrapper>
            <AporteDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'aportes/:id/editar',
        element: (
          <SuspenseWrapper>
            <AporteFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'creditos',
        element: (
          <SuspenseWrapper>
            <CreditosListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'creditos/nuevo',
        element: (
          <SuspenseWrapper>
            <CreditoFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'creditos/:id',
        element: (
          <SuspenseWrapper>
            <CreditoDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'creditos/:id/editar',
        element: (
          <SuspenseWrapper>
            <CreditoFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'caja',
        element: (
          <SuspenseWrapper>
            <CajaListPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'caja/nueva',
        element: (
          <SuspenseWrapper>
            <CajaFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'caja/:id',
        element: (
          <SuspenseWrapper>
            <CajaDetailPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'caja/:id/editar',
        element: (
          <SuspenseWrapper>
            <CajaFormPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'reportes',
        element: (
          <SuspenseWrapper>
            <ReportesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'configuracion',
        element: (
          <SuspenseWrapper>
            <ConfiguracionPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'auditoria',
        element: (
          <SuspenseWrapper>
            <AuditoriaPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]
