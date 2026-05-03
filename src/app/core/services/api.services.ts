import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { environment } from '../../../environments/environment';
import {
  User, Role, Permission, Breed, Barn, Flock,
  EggType, EggInventory, Supply, SupplyCategory,
  MeasurementUnit, SupplyHistory, SupplyAction,
  Feeding, Report
} from '../models';

// ===== USERS =====
@Injectable({ providedIn: 'root' })
export class UsersService extends BaseApiService<User> {
  protected endpoint = 'users';
}

// ===== ROLES =====
@Injectable({ providedIn: 'root' })
export class RolesService extends BaseApiService<Role> {
  protected endpoint = 'roles';

  assignRole(data: { id_usuario: number; id_rol: number }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/roles/assign`, data);
  }

  removeRole(data: { id_usuario: number; id_rol: number }): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/roles/assign/remove`, { body: data });
  }

  getRolesByUser(id_usuario: number): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/roles/user/${id_usuario}`);
  }
}

// ===== PERMISSIONS =====
@Injectable({ providedIn: 'root' })
export class PermissionsService extends BaseApiService<Permission> {
  protected endpoint = 'permissions';

  assignPermission(data: { id_rol: number; id_permiso: number }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/permissions/assign`, data);
  }

  removePermission(data: { id_rol: number; id_permiso: number }): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/permissions/assign/remove`, { body: data });
  }

  getPermissionsByRole(id_rol: number): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.baseUrl}/permissions/rol/${id_rol}`);
  }
}

// ===== BREEDS =====
@Injectable({ providedIn: 'root' })
export class BreedsService extends BaseApiService<Breed> {
  protected endpoint = 'breeds';
}

// ===== BARNS =====
@Injectable({ providedIn: 'root' })
export class BarnsService extends BaseApiService<Barn> {
  protected endpoint = 'barns';
}

// ===== FLOCKS =====
@Injectable({ providedIn: 'root' })
export class FlocksService extends BaseApiService<Flock> {
  protected endpoint = 'flocks';

  assignFlock(data: unknown): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/flocks/asignar`, data);
  }

  registerDeadBirds(data: { id_lote: number; cantidad: number; fecha?: string; motivo?: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/flocks/aves-muertas`, data);
  }

  finalizeFlock(data: { id_lote: number; fecha_fin?: string; observacion?: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/flocks/finalizar`, data);
  }
}

// ===== EGG TYPES =====
@Injectable({ providedIn: 'root' })
export class EggTypesService extends BaseApiService<EggType> {
  protected endpoint = 'egg-types';
}

// ===== EGG INVENTORY =====
@Injectable({ providedIn: 'root' })
export class EggInventoryService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<EggInventory[]> {
    return this.http.get<EggInventory[]>(`${this.baseUrl}/egg-inventory`);
  }

  getById(id: number): Observable<EggInventory> {
    return this.http.get<EggInventory>(`${this.baseUrl}/egg-inventory/${id}`);
  }

  registerProduction(data: unknown): Observable<EggInventory> {
    return this.http.post<EggInventory>(`${this.baseUrl}/egg-inventory/produccion`, data);
  }

  registerDamaged(data: unknown): Observable<EggInventory> {
    return this.http.post<EggInventory>(`${this.baseUrl}/egg-inventory/danados`, data);
  }
}

// ===== SUPPLY CATEGORIES =====
@Injectable({ providedIn: 'root' })
export class SupplyCategoriesService extends BaseApiService<SupplyCategory> {
  protected endpoint = 'supply-categories';
}

// ===== MEASUREMENT UNITS =====
@Injectable({ providedIn: 'root' })
export class MeasurementUnitsService extends BaseApiService<MeasurementUnit> {
  protected endpoint = 'measurement-units';
}

// ===== SUPPLIES =====
@Injectable({ providedIn: 'root' })
export class SuppliesService extends BaseApiService<Supply> {
  protected endpoint = 'supplies';
}

// ===== SUPPLY HISTORY =====
@Injectable({ providedIn: 'root' })
export class SupplyHistoryService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<SupplyHistory[]> {
    return this.http.get<SupplyHistory[]>(`${this.baseUrl}/supply-history`);
  }

  getById(id: number): Observable<SupplyHistory> {
    return this.http.get<SupplyHistory>(`${this.baseUrl}/supply-history/${id}`);
  }

  getBySupply(idInsumo: number): Observable<SupplyHistory[]> {
    return this.http.get<SupplyHistory[]>(`${this.baseUrl}/supply-history/by-supply/${idInsumo}`);
  }

  create(data: unknown): Observable<SupplyHistory> {
    return this.http.post<SupplyHistory>(`${this.baseUrl}/supply-history`, data);
  }
}

// ===== SUPPLY ACTIONS =====
@Injectable({ providedIn: 'root' })
export class SupplyActionsService extends BaseApiService<SupplyAction> {
  protected endpoint = 'supply-actions';
}

// ===== FEEDING =====
@Injectable({ providedIn: 'root' })
export class FeedingService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Feeding[]> {
    return this.http.get<Feeding[]>(`${this.baseUrl}/alimentacion`);
  }

  getById(id: number): Observable<Feeding> {
    return this.http.get<Feeding>(`${this.baseUrl}/alimentacion/${id}`);
  }

  create(data: unknown): Observable<Feeding> {
    return this.http.post<Feeding>(`${this.baseUrl}/alimentacion`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/alimentacion/${id}`);
  }
}

// ===== REPORTS =====
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.baseUrl}/reports`);
  }

  getById(id: number): Observable<Report> {
    return this.http.get<Report>(`${this.baseUrl}/reports/${id}`);
  }

  create(data: unknown): Observable<Report> {
    return this.http.post<Report>(`${this.baseUrl}/reports`, data);
  }
}
