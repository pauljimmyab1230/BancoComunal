export interface FondoRotatorio {
  id: number
  nombre: string
  organizacion: string
  capitalInicial: number
  capitalDisponible: number
  moneda: string
  estado: string
  descripcion: string | null
  reglamento: string | null
  condiciones: string | null
  fechaCierre: string | null
  totalSocios: number
  capitalPrestado: number
  createdAt: string
  updatedAt: string
  socios?: FondoSocio[]
}

export interface FondoSocio {
  id: number
  fechaIngreso: string | null
  fechaSalida: string | null
  numeroSocio: number | null
  cargo: string | null
  nivel: string | null
  observacion: string | null
  fechaAprobacion: string | null
  fondoId: number
  socioId: number
  fondo?: FondoRotatorio
  socio: {
    id: number
    codigo: string
    dni: string
    nombres: string
    apellidoPaterno: string
    apellidoMaterno: string
    telefono?: string
    estado: string
  }
}

export interface FondoFormData {
  nombre: string
  organizacion: string
  capitalInicial: number
  moneda: 'PEN' | 'USD'
  estado: 'ACTIVO' | 'INACTIVO' | 'CERRADO'
  descripcion: string
  reglamento: string
  condiciones: string
}
