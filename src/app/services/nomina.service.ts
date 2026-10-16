// services/nomina.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  NominaRequest,
  NominaDetalleResponse,
  NominaListadoResponse,
  NominaResumenResponse,
  NominaFiltros,
  Page,
} from '../models/nomina.model';

@Injectable({ providedIn: 'root' })
export class NominaService {
  private http = inject(HttpClient);
  private baseUrl = '/api/nominas';

  // POST /api/nominas
  crearNomina(request: NominaRequest): Observable<number> {
    return this.http.post<number>(this.baseUrl, request);
  }

  // GET /api/nominas/{id}
  getDetalle(id: number): Observable<NominaDetalleResponse> {
    return this.http.get<NominaDetalleResponse>(`${this.baseUrl}/${id}`);
  }

  // GET /api/nominas/{id}/pdf
  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  // GET /api/nominas/resumen
  getResumen(filtros: NominaFiltros = {}): Observable<NominaResumenResponse> {
    const params = this.buildParams(filtros, ['ejercicio', 'fechaInicio', 'fechaFin']);
    return this.http.get<NominaResumenResponse>(`${this.baseUrl}/resumen`, { params });
  }

  // GET /api/nominas/lista     
  getListado(
    filtros: NominaFiltros = {},
    page = 0,
    size = 20,
    sort = 'fechaPago,desc'
  ): Observable<Page<NominaListadoResponse>> {
    let params = this.buildParams(
      filtros,
      ['ejercicio', 'fechaInicio', 'fechaFin', 'colaborador']
    );
    params = params.set('page', page).set('size', size).set('sort', sort);

    return this.http.get<Page<NominaListadoResponse>>(`${this.baseUrl}/lista`, { params });
  }

  // GET /api/nominas/colaborador/{colaboradorId}
  getPorColaborador(
    colaboradorId: number,
    page = 0,
    size = 24,
    sort = 'fechaPago,desc'
  ): Observable<Page<NominaListadoResponse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    return this.http.get<Page<NominaListadoResponse>>(
      `${this.baseUrl}/colaborador/${colaboradorId}`,
      { params }
    );
  }

  // GET /api/nominas/ejercicios
  getEjercicios(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/ejercicios`);
  }

  private buildParams(filtros: NominaFiltros, claves: (keyof NominaFiltros)[]): HttpParams {
    let params = new HttpParams();
    for (const k of claves) {
      const v = filtros[k];
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k as string, String(v));
      }
    }
    return params;
  }
}