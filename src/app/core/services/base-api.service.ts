import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export abstract class BaseApiService<T> {
  protected http = inject(HttpClient);
  protected baseUrl = environment.apiUrl;
  protected abstract endpoint: string;

  protected get url(): string {
    return `${this.baseUrl}/${this.endpoint}`;
  }

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  getById(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  create(data: Partial<T>): Observable<T> {
    return this.http.post<T>(this.url, data);
  }

  update(id: number, data: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
