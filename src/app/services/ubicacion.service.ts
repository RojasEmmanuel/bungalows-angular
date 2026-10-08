import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UbicacionRequest, UbicacionResponse, UbicacionDetail} from '../models/ubicacion.model';

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/ubicaciones';

  getUbicacionesDetail(): Observable<UbicacionDetail[]> {
    return this.http.get<UbicacionDetail[]>(`${this.baseUrl}/detail`);
  }

  crearUbicacion(body: UbicacionRequest): Observable<UbicacionResponse> {
    return this.http.post<UbicacionResponse>(this.baseUrl, body);
  }

  /** Listado simple para selects */
  getUbicaciones(): Observable<UbicacionResponse[]> {
    return this.http.get<UbicacionResponse[]>(this.baseUrl);
  }
}

