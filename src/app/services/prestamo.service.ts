import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
    PrestamoResponse, PrestamoRequest, DeudaResponse 
} from '../models/prestamo.model';

@Injectable({ providedIn: 'root' })
export class PrestamoService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/prestamos';

    getDeudas(): Observable<DeudaResponse[]> {
        return this.http.get<DeudaResponse[]>(this.baseUrl);
    }

    getPrestamosByColaboradorId(colaboradorId: number): Observable<PrestamoResponse[]>{
        return this.http.get<PrestamoResponse[]>(`${this.baseUrl}/${colaboradorId}`);
    }


    crearPrestamo(body: PrestamoRequest): Observable<PrestamoResponse> {
        return this.http.post<PrestamoResponse>(this.baseUrl, body);
    }


    //abono a una deuda de un cliente
    abonarByColaborador(colaboradorId:number, abono:number): Observable<void>{
        return this.http.patch<void>(`${this.baseUrl}/colaborador/${colaboradorId}/${abono}`,null);
    }

    // abono a un prestamo especifico 
    abonarPrestamo(id:number, abono:number):Observable<void>{
        return this.http.patch<void>(`${this.baseUrl}/${id}/${abono}`, null);
    }


    cancelarPrestamo(id:number):Observable<void>{
        return this.http.patch<void>(`${this.baseUrl}/cancelar/${id}`, null);
    }

    eliminarPrestamo(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}