import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfidencialResponse, ConfidencialPatch } from '../models/confidencial.model';

@Injectable({ providedIn: 'root' })
export class ConfidencialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/confidencial';

  actualizarConfidencial(confidencial: ConfidencialPatch): Observable<ConfidencialResponse> {
    return this.http.patch<ConfidencialResponse>(this.baseUrl, confidencial);
  }

  getByColaboradorId(colaboradorId: number): Observable<ConfidencialResponse> {
    return this.http.get<ConfidencialResponse>(`${this.baseUrl}/${colaboradorId}`);
  }
}