/** Detalle de una ubicación */
export interface UbicacionDetail {
  id: number;
  nombre: string;
  slug: string;
  direccion: string;
  imagenPath: string;
  totalColaboradores: number;
  colaboradoresActivos: number;
  empresaId: number | null;
}

/** Body que espera POST /api/ubicaciones */
export interface UbicacionRequest {
  nombre: string;
  direccion: string;
  imagenPath: string | null;
  empresaId:number
}

/** Respuesta del POST /api/ubicaciones */
export interface UbicacionResponse {
  id: number;
  nombre: string;
  slug: string;
  direccion: string;
  imagenPath: string;
  empresaId: number ;
}

/** Respuesta del POST /api/uploads/ubicaciones */
export interface UploadResponse {
  path: string;
}

export interface UbicacionPatch{
  id:number,
  nombre:string,
  direccion:string,
  imagenPath:string | null,
  empresaId:number
}