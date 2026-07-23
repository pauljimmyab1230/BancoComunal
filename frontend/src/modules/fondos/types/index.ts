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
  responsableId: number
  responsableNombre: string
  totalSocios: number
  createdAt: string
  updatedAt: string
  socios?: FondoSocio[]
  responsable?: {
    id: number
    nombres: string
    apellidoPaterno: string
    apellidoMaterno: string
    correo?: string
  }
}

export interface FondoSocio {
  id: number
  fechaIngreso: string
  estado: string
  fondoId: number
  socioId: number
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
  responsableId: number
}
