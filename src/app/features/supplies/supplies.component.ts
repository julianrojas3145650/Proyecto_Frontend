import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import {
  SuppliesService, SupplyCategoriesService, MeasurementUnitsService,
  SupplyHistoryService, SupplyActionsService
} from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Supply, SupplyCategory, MeasurementUnit } from '../../core/models';

@Component({
  selector: 'app-supplies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="supplies-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-box"></i></div>
          <div>
            <h2>Gestión de Insumos</h2>
            <p>Registra los alimentos y materiales que usa la granja.</p>
          </div>
        </div>
        <div class="module-header-right">
          <button class="btn-green" (click)="openModal()">
            <i class="fas fa-plus"></i> Registrar Insumo
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon green"><i class="fas fa-seedling"></i></div>
          <div class="stat-info">
            <div class="stat-label">Total Insumos</div>
            <div class="stat-value">{{ supplies().length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><i class="fas fa-tags"></i></div>
          <div class="stat-info">
            <div class="stat-label">Categorías</div>
            <div class="stat-value">{{ categories().length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-ruler"></i></div>
          <div class="stat-info">
            <div class="stat-label">Unidades de Medida</div>
            <div class="stat-value">{{ units().length }}</div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <div class="table-header">
          <h3>Listado de Insumos</h3>
          <div class="table-actions">
            <div class="search-bar">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Buscar insumo..." [(ngModel)]="searchQuery" (input)="filterSupplies()" />
            </div>
          </div>
        </div>

        @if (loading()) {
          <div class="loading-container"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="fas fa-box"></i>
            <h3>No hay insumos registrados</h3>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Unidad</th><th>Cantidad</th><th>Precio</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                @for (supply of filtered(); track supply.id) {
                  <tr>
                    <td>#{{ supply.id }}</td>
                    <td><strong>{{ supply.nombre }}</strong></td>
                    <td>{{ supply.categoria?.nombre || '—' }}</td>
                    <td>{{ supply.unidad_medida?.abreviatura || supply.unidad_medida?.nombre || '—' }}</td>
                    <td>{{ supply.cantidad ?? '—' }}</td>
                    <td>{{ supply.precio ? ('$' + (supply.precio | number:'1.0-2')) : '—' }}</td>
                    <td class="actions-cell">
                      <button class="btn-icon edit" (click)="editSupply(supply)"><i class="fas fa-edit"></i></button>
                      <button class="btn-icon delete" (click)="deleteSupply(supply.id)"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-box"></i> {{ editing() ? 'Editar Insumo' : 'Registrar Insumo' }}</h3>
            <button class="btn-close" (click)="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="supplyForm">
              <div class="form-group">
                <label><i class="fas fa-box"></i> Nombre del Insumo</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Alimento concentrado" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-tag"></i> Categoría</label>
                  <select formControlName="id_categoria">
                    <option value="">Sin categoría</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label><i class="fas fa-ruler"></i> Unidad de Medida</label>
                  <select formControlName="id_unidad_medida">
                    <option value="">Sin unidad</option>
                    @for (unit of units(); track unit.id) {
                      <option [value]="unit.id">{{ unit.nombre }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-sort-numeric-up"></i> Cantidad</label>
                  <input type="number" formControlName="cantidad" placeholder="Cantidad" min="0" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-dollar-sign"></i> Precio</label>
                  <input type="number" formControlName="precio" placeholder="Precio unitario" min="0" step="0.01" />
                </div>
              </div>
              <div class="form-group">
                <label><i class="fas fa-info-circle"></i> Descripción</label>
                <textarea formControlName="descripcion" placeholder="Descripción opcional..." rows="2"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModal()">Cancelar</button>
            <button class="btn-green" (click)="save()" [disabled]="saving()">
              <i class="fas fa-save"></i> {{ editing() ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse;
      th { padding: 1.2rem 1.5rem; background: var(--gray-light); font-size: 1.2rem; font-weight: 600; text-transform: uppercase; color: var(--gray-dark); text-align: left; }
      td { padding: 1.2rem 1.5rem; border-top: 1px solid var(--gray-medium); font-size: 1.4rem; }
      tr:hover td { background: rgba(57,169,0,0.03); }
    }
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; }
  `],
})
export class SuppliesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private suppliesService = inject(SuppliesService);
  private categoriesService = inject(SupplyCategoriesService);
  private unitsService = inject(MeasurementUnitsService);
  private toast = inject(ToastService);

  loading = signal(true);
  supplies = signal<Supply[]>([]);
  filtered = signal<Supply[]>([]);
  categories = signal<SupplyCategory[]>([]);
  units = signal<MeasurementUnit[]>([]);
  searchQuery = '';
  showModal = signal(false);
  editing = signal<Supply | null>(null);
  saving = signal(false);

  supplyForm = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    cantidad: [null as number | null],
    precio: [null as number | null],
    id_categoria: [''],
    id_unidad_medida: [''],
  });

  ngOnInit(): void {
    this.loadData();
    this.categoriesService.getAll().subscribe((c) => this.categories.set(c));
    this.unitsService.getAll().subscribe((u) => this.units.set(u));
  }

  private loadData(): void {
    this.suppliesService.getAll().subscribe({
      next: (data) => { this.supplies.set(data); this.filtered.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filterSupplies(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered.set(this.supplies().filter((s) => `${s.nombre} ${s.categoria?.nombre}`.toLowerCase().includes(q)));
  }

  openModal(): void { this.editing.set(null); this.supplyForm.reset(); this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); }

  editSupply(supply: Supply): void {
    this.editing.set(supply);
    this.supplyForm.patchValue({
      nombre: supply.nombre,
      descripcion: supply.descripcion || '',
      cantidad: supply.cantidad ?? null as number | null,
      precio: supply.precio ?? null as number | null,
    });
    this.showModal.set(true);
  }

  save(): void {
    if (this.supplyForm.invalid) { this.supplyForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = this.supplyForm.value as Partial<Supply>;
    const editing = this.editing();
    const req = editing ? this.suppliesService.update(editing.id, data) : this.suppliesService.create(data);
    req.subscribe({
      next: () => { this.toast.success(editing ? 'Insumo actualizado' : 'Insumo registrado'); this.closeModal(); this.loadData(); },
      error: () => { this.toast.error('Error al guardar el insumo'); this.saving.set(false); },
      complete: () => this.saving.set(false),
    });
  }

  deleteSupply(id: number): void {
    if (!confirm('¿Eliminar este insumo?')) return;
    this.suppliesService.delete(id).subscribe({
      next: () => { this.toast.success('Insumo eliminado'); this.loadData(); },
      error: () => this.toast.error('Error al eliminar el insumo'),
    });
  }
}
