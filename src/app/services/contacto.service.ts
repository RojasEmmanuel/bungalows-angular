import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContactoRequest, ContactoResponse, ContactoPatch } from '../models/contacto.model';

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/contacto';

  getContactosByColaboradorId(colaboradorId: number): Observable<ContactoResponse[]> {
    return this.http.get<ContactoResponse[]>(`${this.baseUrl}/${colaboradorId}`);
  }
  
  crearContacto(body: ContactoRequest): Observable<ContactoResponse> {
    return this.http.post<ContactoResponse>(this.baseUrl, body);
  }

  actualizarContacto(body: ContactoPatch): Observable<ContactoResponse> {
    return this.http.patch<ContactoResponse>(this.baseUrl, body);
  }

  eliminarContacto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}