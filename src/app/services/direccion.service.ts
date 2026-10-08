import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DireccionResponse, DireccionPatch } from '../models/direccion.model';

@Injectable({ providedIn: 'root' })
export class DireccionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/direccion';

  getDireccion(colaboradorId: number): Observable<DireccionResponse> {
    return this.http.get<DireccionResponse>(`${this.baseUrl}/${colaboradorId}`);
  }


  actualizarDireccion(direccion: DireccionPatch): Observable<DireccionResponse> {
    return this.http.patch<DireccionResponse>(this.baseUrl, direccion);
  }
}