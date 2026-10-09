import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  VacacionesRequest,
  VacacionesResponse,
  VacacionesPatch,
  VacacionesSimpleResponse,
} from '../models/vacaciones.model';

@Injectable({ providedIn: 'root' })
export class VacacionesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/vacaciones';

  getVacaciones(): Observable<VacacionesResponse[]> {
    return this.http.get<VacacionesResponse[]>(this.baseUrl);
  }

  getVacacionesById(id: number): Observable<VacacionesSimpleResponse> {
    return this.http.get<VacacionesSimpleResponse>(`${this.baseUrl}/${id}`);
  }

  crearVacaciones(body: VacacionesRequest): Observable<void> {
    return this.http.post<void>(this.baseUrl, body);
  }

  actualizarVacaciones(body: VacacionesPatch): Observable<void> {
    return this.http.patch<void>(this.baseUrl, body);
  }

  eliminarVacaciones(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}