import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Extracts the actual data from an API response.
 * Handles both wrapped responses ({ data: ... }) and raw responses.
 */
export function extractData<R>(response: unknown): R {
  if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
    return (response as Record<string, unknown>)['data'] as R;
  }
  return response as R;
}

export function extractArray<R>(response: unknown): R[] {
  const data = extractData<R[]>(response);
  return Array.isArray(data) ? data : [];
}

export abstract class BaseApiService<T> {
  protected http = inject(HttpClient);
  protected baseUrl = environment.apiUrl;
  protected abstract endpoint: string;

  protected get url(): string {
    return `${this.baseUrl}/${this.endpoint}`;
  }

  getAll(): Observable<T[]> {
    return this.http.get<unknown>(this.url).pipe(
      map(response => extractArray<T>(response))
    );
  }

  getById(id: string | number): Observable<T> {
    return this.http.get<unknown>(`${this.url}/${id}`).pipe(
      map(response => extractData<T>(response))
    );
  }

  create(data: Partial<T>): Observable<T> {
    return this.http.post<unknown>(this.url, data).pipe(
      map(response => extractData<T>(response))
    );
  }

  update(id: string | number, data: Partial<T>): Observable<T> {
    return this.http.patch<unknown>(`${this.url}/${id}`, data).pipe(
      map(response => extractData<T>(response))
    );
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
