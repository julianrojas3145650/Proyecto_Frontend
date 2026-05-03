// ===== AUTH MODELS =====
export interface LoginRequest {
  numero_documento: string;
  contrasena: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthProfile {
  id: number;
  nombre: string;
  numero_documento: string;
  roles: Role[];
  permisos: Permission[];
}

// ===== USER MODEL =====
export interface User {
  id: number;
  nombre: string;
  numero_documento: string;
  email?: string;
  estado?: boolean;
  roles?: Role[];
}

// ===== ROLE MODEL =====
export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
}

// ===== PERMISSION MODEL =====
export interface Permission {
  id: number;
  nombre: string;
  descripcion?: string;
  recurso?: string;
  accion?: string;
}

// ===== BREED MODEL =====
export interface Breed {
  id: number;
  nombre: string;
  descripcion?: string;
}

// ===== BARN MODEL =====
export interface Barn {
  id: number;
  nombre: string;
  capacidad?: number;
  descripcion?: string;
  estado?: string;
}

// ===== FLOCK MODEL =====
export interface Flock {
  id: number;
  codigo?: string;
  cantidad_aves: number;
  cantidad_aves_muertas?: number;
  fecha_ingreso?: string;
  estado?: 'activo' | 'finalizado';
  gestion_galpon?: Barn;
  raza?: Breed;
}

// ===== EGG TYPE MODEL =====
export interface EggType {
  id: number;
  nombre: string;
  descripcion?: string;
}

// ===== EGG INVENTORY MODEL =====
export interface EggInventory {
  id: number;
  fecha?: string;
  cantidad: number;
  tipo_huevo?: EggType;
  lote?: Flock;
}

// ===== SUPPLY CATEGORY MODEL =====
export interface SupplyCategory {
  id: number;
  nombre: string;
  descripcion?: string;
}

// ===== MEASUREMENT UNIT MODEL =====
export interface MeasurementUnit {
  id: number;
  nombre: string;
  abreviatura?: string;
}

// ===== SUPPLY MODEL =====
export interface Supply {
  id: number;
  nombre: string;
  descripcion?: string;
  cantidad?: number;
  precio?: number;
  categoria?: SupplyCategory;
  unidad_medida?: MeasurementUnit;
}

// ===== SUPPLY HISTORY MODEL =====
export interface SupplyHistory {
  id: number;
  fecha?: string;
  cantidad?: number;
  observacion?: string;
  insumo?: Supply;
  accion?: SupplyAction;
}

// ===== SUPPLY ACTION MODEL =====
export interface SupplyAction {
  id: number;
  nombre: string;
  descripcion?: string;
}

// ===== FEEDING MODEL =====
export interface Feeding {
  id: number;
  fecha?: string;
  cantidad?: number;
  observacion?: string;
  lote?: Flock;
  insumo?: Supply;
}

// ===== REPORT MODEL =====
export interface Report {
  id: number;
  tipo?: string;
  fecha?: string;
  descripcion?: string;
  datos?: unknown;
}

// ===== API RESPONSE =====
export interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
}

// ===== PAGINATION =====
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
