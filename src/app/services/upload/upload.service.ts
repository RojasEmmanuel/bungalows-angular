import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UploadResponse } from '../../models/upload.model';

/**
 * Servicio base para subir archivos.
 * No lo uses directamente desde componentes: usa los servicios por dominio.
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/uploads';

  subir(file: File, endpoint: string): Observable<UploadResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadResponse>(`${this.baseUrl}/${endpoint}`, form);
  }
}