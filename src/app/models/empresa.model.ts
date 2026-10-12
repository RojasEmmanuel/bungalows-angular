export interface empresaResponse {
  id: number;
  nombreLegal: string;
  responsable: string;
  registroFiscal: string;
  direccion: string | null;
  registroPatronal: string | null;
  logoPath: string | null;
}

export interface empresaRequest {
  nombreLegal: string;
  responsable: string;
  registroFiscal: string;
  direccion: string | null;
  registroPatronal: string | null;
  logoPath: string | null;
}

export interface empresaPatch {
  id: number;
  direccion?: string | null;
  registroPatronal?: string | null;
  logoPath?: string | null;
}