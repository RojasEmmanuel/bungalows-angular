export interface UsuarioResponse {
  id: number;
  username: string;
  nombre: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}