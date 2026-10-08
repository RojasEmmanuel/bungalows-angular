import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
    PrestamoResponse, PrestamoRequest, PrestamoPatch, PrestamoSimpleResponse 
} from '../models/prestamo.model';

@Injectable({ providedIn: 'root' })
export class PrestamoService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/prestamos';

    getPrestamos(): Observable<PrestamoResponse[]> {
        return this.http.get<PrestamoResponse[]>(this.baseUrl);
    }

    getPrestamoById(id: number): Observable<PrestamoSimpleResponse> {
        return this.http.get<PrestamoSimpleResponse>(`${this.baseUrl}/${id}`);
    }

    crearPrestamo(body: PrestamoRequest): Observable<PrestamoResponse> {
        return this.http.post<PrestamoResponse>(this.baseUrl, body);
    }

    actualizarPrestamo(body: PrestamoPatch): Observable<PrestamoResponse> {
        return this.http.patch<PrestamoResponse>(this.baseUrl, body);
    }
    
    eliminarPrestamo(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}