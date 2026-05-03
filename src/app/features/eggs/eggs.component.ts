import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { EggInventoryService, EggTypesService, FlocksService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { EggInventory, EggType, Flock } from '../../core/models';

@Component({
  selector: 'app-eggs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="eggs-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-egg"></i></div>
          <div>
            <h2>Gestión de Huevos</h2>
            <p>Administrar y clasificar huevos de manera eficiente.</p>
          </div>
        </div>
        <div class="module-header-right">
          <button class="btn-green" (click)="openModal('production')">
            <i class="fas fa-plus"></i> Registrar Producción
          </button>
          <button class="btn-outline" (click)="openModal('damaged')">
            <i class="fas fa-times"></i> Registrar Dañados
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-egg"></i></div>
          <div class="stat-info">
            <div class="stat-label">Total Hoy</div>
            <div class="stat-value">{{ totalToday() }}</div>
          </div>
        </div>
        @for (type of eggTypes().slice(0, 4); track type.id) {
          <div class="stat-card">
            <div class="stat-icon {{ typeColors[$index % typeColors.length] }}"><i class="fas fa-egg"></i></div>
            <div class="stat-info">
              <div class="stat-label">{{ type.nombre }}</div>
              <div class="stat-value">{{ getCountByType(type.id) }}</div>
            </div>
          </div>
        }
      </div>

      <!-- Inventory Table -->
      <div class="table-container">
        <div class="table-header">
          <h3>Inventario de Huevos</h3>
          <div class="table-actions">
            <div class="search-bar">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Buscar..." [(ngModel)]="searchQuery" (input)="filterInventory()" />
            </div>
          </div>
        </div>

        @if (loading()) {
          <div class="loading-container"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="fas fa-egg"></i>
            <h3>No hay registros de huevos</h3>
            <p>Registra la primera producción haciendo clic en "Registrar Producción"</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Tipo</th><th>Cantidad</th><th>Lote</th><th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filtered(); track item.id) {
                  <tr>
                    <td>#{{ item.id }}</td>
                    <td><span class="badge active">{{ item.tipo_huevo?.nombre || '—' }}</span></td>
                    <td><strong>{{ item.cantidad }}</strong></td>
                    <td>{{ item.lote ? 'Lote #' + item.lote.id : '—' }}</td>
                    <td>{{ item.fecha ? (item.fecha | date:'dd/MM/yyyy') : '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Modal Producción -->
    @if (showProductionModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-egg"></i> {{ modalType() === 'production' ? 'Registrar Producción' : 'Registrar Huevos Dañados' }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="eggForm">
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-egg"></i> Tipo de Huevo</label>
                  <select formControlName="id_tipo_huevo">
                    <option value="">Seleccionar tipo</option>
                    @for (type of eggTypes(); track type.id) {
                      <option [value]="type.id">{{ type.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label><i class="fas fa-sort-numeric-up"></i> Cantidad</label>
                  <input type="number" formControlName="cantidad" placeholder="Ej: 100" min="1" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-layer-group"></i> Lote</label>
                  <select formControlName="id_lote">
                    <option value="">Seleccionar lote</option>
                    @for (flock of flocks(); track flock.id) {
                      <option [value]="flock.id">Lote #{{ flock.id }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label><i class="fas fa-calendar"></i> Fecha</label>
                  <input type="date" formControlName="fecha" />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-green" (click)="save()" [disabled]="saving()">
              <i class="fas fa-save"></i>
              {{ modalType() === 'production' ? 'Guardar Producción' : 'Guardar Dañados' }}
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
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; padding: 0.3rem; }
  `],
})
export class EggsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eggService = inject(EggInventoryService);
  private eggTypesService = inject(EggTypesService);
  private flocksService = inject(FlocksService);
  private toast = inject(ToastService);

  loading = signal(true);
  inventory = signal<EggInventory[]>([]);
  filtered = signal<EggInventory[]>([]);
  eggTypes = signal<EggType[]>([]);
  flocks = signal<Flock[]>([]);
  searchQuery = '';
  showProductionModal = signal(false);
  modalType = signal<'production' | 'damaged'>('production');
  saving = signal(false);
  totalToday = signal(0);
  typeColors = ['blue', 'purple', 'orange', 'green', 'cyan', 'pink'];

  eggForm = this.fb.group({
    id_tipo_huevo: ['', Validators.required],
    cantidad: [null, [Validators.required, Validators.min(1)]],
    id_lote: [''],
    fecha: [new Date().toISOString().split('T')[0]],
  });

  ngOnInit(): void {
    this.loadData();
    this.eggTypesService.getAll().subscribe((t) => this.eggTypes.set(t));
    this.flocksService.getAll().subscribe((f) => this.flocks.set(f.filter((fl) => fl.estado === 'activo')));
  }

  private loadData(): void {
    this.eggService.getAll().subscribe({
      next: (data) => {
        this.inventory.set(data);
        this.filtered.set(data);
        this.totalToday.set(data.reduce((s, e) => s + (e.cantidad || 0), 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getCountByType(typeId: number): number {
    return this.inventory().filter((e) => e.tipo_huevo?.id === typeId).reduce((s, e) => s + (e.cantidad || 0), 0);
  }

  filterInventory(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered.set(this.inventory().filter((e) => `${e.tipo_huevo?.nombre} ${e.lote?.id}`.toLowerCase().includes(q)));
  }

  openModal(type: 'production' | 'damaged'): void {
    this.modalType.set(type);
    this.eggForm.reset({ fecha: new Date().toISOString().split('T')[0] });
    this.showProductionModal.set(true);
  }

  closeModals(): void { this.showProductionModal.set(false); }

  save(): void {
    if (this.eggForm.invalid) { this.eggForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = this.eggForm.value;
    const req = this.modalType() === 'production'
      ? this.eggService.registerProduction(data)
      : this.eggService.registerDamaged(data);

    req.subscribe({
      next: () => { this.toast.success('Registro guardado exitosamente'); this.closeModals(); this.loadData(); },
      error: () => { this.toast.error('Error al guardar el registro'); this.saving.set(false); },
      complete: () => this.saving.set(false),
    });
  }
}
