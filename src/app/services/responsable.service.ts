import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponsableResponse, ResponsableRequest, ResponsablePatch } from '../models/responsable.model';

@Injectable({ providedIn: 'root' })
export class ResponsableService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/responsable';

    getResponsablesByColaboradorId(colaboradorId: number): Observable<ResponsableResponse[]> {
        return this.http.get<ResponsableResponse[]>(`${this.baseUrl}/${colaboradorId}`);
    }

    getResponsableById(id: number): Observable<ResponsableResponse> {
        return this.http.get<ResponsableResponse>(`${this.baseUrl}/"responsable"/${id}`);
    }

    
    crearResponsable(body: ResponsableRequest): Observable<ResponsableResponse> {
        return this.http.post<ResponsableResponse>(this.baseUrl, body);
    }

    actualizarResponsable(body: ResponsablePatch): Observable<ResponsableResponse> {
        return this.http.patch<ResponsableResponse>(this.baseUrl, body);
    }

    
    eliminarResponsable(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}