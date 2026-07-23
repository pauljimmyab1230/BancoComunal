export interface Socio {
  id: number
  codigo: string
  dni: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  nombreCompleto: string
  genero: string
  fechaNacimiento: string | null
  estadoCivil: string | null
  telefono: string | null
  direccion: string | null
  email: string | null
  fechaIngreso: string
  estado: string
  fotoUrl: string | null
  createdAt: string
  updatedAt: string
  beneficiarios?: Beneficiario[]
  documentos?: DocumentoSocio[]
}

export interface Beneficiario {
  id: number
  dni: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  fechaNacimiento: string | null
  parentesco: string
  telefono: string | null
  socioId: number
}

export interface DocumentoSocio {
  id: number
  tipoDocumento: string
  nombreArchivo: string
  rutaArchivo: string
  mimeType: string
  tamaño: number
  socioId: number
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface SocioFormData {
  dni: string
  nombres: string
  apellidoPaterno: string
  apellidoMaterno: string
  genero: 'M' | 'F'
  fechaNacimiento: string
  estadoCivil: 'S' | 'C' | 'V' | 'D'
  telefono: string
  direccion: string
  email: string
  fechaIngreso: string
  estado: 'A' | 'I'
  foto?: File | null
}
