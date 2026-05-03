import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { FlocksService, BarnsService, BreedsService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Flock, Barn, Breed } from '../../core/models';

@Component({
  selector: 'app-flocks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="flocks-page">
      <!-- Module Header -->
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-dove"></i></div>
          <div>
            <h2>Gestión de Gallinas por Galpón</h2>
            <p>Registra lotes, galpones y controla tus gallinas fácilmente.</p>
          </div>
        </div>
        <div class="module-header-right">
          <button class="btn-green" (click)="openModal('flock')">
            <i class="fas fa-plus"></i> Registrar Lote
          </button>
          <button class="btn-outline" (click)="openModal('barn')">
            <i class="fas fa-plus"></i> Registrar Galpón
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-dove"></i></div>
          <div class="stat-info">
            <div class="stat-label">Total Gallinas</div>
            <div class="stat-value">{{ totalGallinas() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info">
            <div class="stat-label">Lotes Activos</div>
            <div class="stat-value">{{ activeFlocks() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i class="fas fa-warehouse"></i></div>
          <div class="stat-info">
            <div class="stat-label">Galpones</div>
            <div class="stat-value">{{ barns().length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i class="fas fa-skull-crossbones"></i></div>
          <div class="stat-info">
            <div class="stat-label">Aves Muertas</div>
            <div class="stat-value">{{ totalDeadBirds() }}</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab() === 'flocks'" (click)="activeTab.set('flocks')">
          <i class="fas fa-layer-group"></i> Lotes
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'barns'" (click)="activeTab.set('barns')">
          <i class="fas fa-warehouse"></i> Galpones
        </button>
      </div>

      <!-- Flocks Table -->
      @if (activeTab() === 'flocks') {
        <div class="table-container">
          <div class="table-header">
            <h3>Listado de Lotes</h3>
            <div class="table-actions">
              <div class="search-bar">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar lote..." [(ngModel)]="searchQuery" (input)="filterFlocks()" />
              </div>
            </div>
          </div>
          @if (loading()) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else if (filteredFlocks().length === 0) {
            <div class="empty-state">
              <i class="fas fa-dove"></i>
              <h3>No hay lotes registrados</h3>
              <p>Registra tu primer lote haciendo clic en "Registrar Lote"</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cantidad Aves</th>
                    <th>Aves Muertas</th>
                    <th>Fecha Ingreso</th>
                    <th>Estado</th>
                    <th>Galpón</th>
                    <th>Raza</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (flock of filteredFlocks(); track flock.id) {
                    <tr>
                      <td><strong>#{{ flock.id }}</strong></td>
                      <td>{{ flock.cantidad_aves | number }}</td>
                      <td>{{ flock.cantidad_aves_muertas || 0 }}</td>
                      <td>{{ flock.fecha_ingreso ? (flock.fecha_ingreso | date:'dd/MM/yyyy') : '—' }}</td>
                      <td>
                        <span class="badge {{ flock.estado === 'activo' ? 'active' : 'finished' }}">
                          {{ flock.estado || 'activo' }}
                        </span>
                      </td>
                      <td>{{ flock.gestion_galpon?.nombre || '—' }}</td>
                      <td>{{ flock.raza?.nombre || '—' }}</td>
                      <td class="actions-cell">
                        @if (flock.estado === 'activo') {
                          <button class="btn-icon edit" title="Registrar Aves Muertas" (click)="openDeadBirdsModal(flock)">
                            <i class="fas fa-skull-crossbones"></i>
                          </button>
                          <button class="btn-icon view" title="Finalizar Lote" (click)="finalizeFlock(flock)">
                            <i class="fas fa-flag-checkered"></i>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- Barns Table -->
      @if (activeTab() === 'barns') {
        <div class="table-container">
          <div class="table-header">
            <h3>Listado de Galpones</h3>
          </div>
          @if (barns().length === 0) {
            <div class="empty-state">
              <i class="fas fa-warehouse"></i>
              <h3>No hay galpones registrados</h3>
              <p>Registra tu primer galpón</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr><th>ID</th><th>Nombre</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  @for (barn of barns(); track barn.id) {
                    <tr>
                      <td>#{{ barn.id }}</td>
                      <td><strong>{{ barn.nombre }}</strong></td>
                      <td>{{ barn.capacidad || '—' }}</td>
                      <td><span class="badge active">{{ barn.estado || 'activo' }}</span></td>
                      <td class="actions-cell">
                        <button class="btn-icon edit" (click)="editBarn(barn)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete" (click)="deleteBarn(barn.id)"><i class="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal Registrar Lote -->
    @if (showFlockModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-dove"></i> Registrar Nuevo Lote</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="flockForm">
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-dove"></i> Cantidad de Aves</label>
                  <input type="number" formControlName="cantidad_aves" placeholder="Ej: 500" min="1" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-calendar"></i> Fecha de Ingreso</label>
                  <input type="date" formControlName="fecha_ingreso" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-warehouse"></i> Galpón</label>
                  <select formControlName="id_galpon">
                    <option value="">Seleccionar galpón</option>
                    @for (b of barns(); track b.id) {
                      <option [value]="b.id">{{ b.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label><i class="fas fa-dna"></i> Raza</label>
                  <select formControlName="id_raza">
                    <option value="">Seleccionar raza</option>
                    @for (breed of breeds(); track breed.id) {
                      <option [value]="breed.id">{{ breed.nombre }}</option>
                    }
                  </select>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-green" (click)="saveFlock()" [disabled]="savingFlock()">
              @if (savingFlock()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-save"></i> }
              Guardar Lote
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Registrar Galpón -->
    @if (showBarnModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-warehouse"></i> {{ editingBarn() ? 'Editar Galpón' : 'Registrar Galpón' }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="barnForm">
              <div class="form-group">
                <label><i class="fas fa-warehouse"></i> Nombre del Galpón</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Galpón 1" />
              </div>
              <div class="form-group">
                <label><i class="fas fa-users"></i> Capacidad</label>
                <input type="number" formControlName="capacidad" placeholder="Ej: 500" min="1" />
              </div>
              <div class="form-group">
                <label><i class="fas fa-info-circle"></i> Descripción</label>
                <textarea formControlName="descripcion" placeholder="Descripción opcional..." rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-green" (click)="saveBarn()" [disabled]="savingBarn()">
              <i class="fas fa-save"></i>
              {{ editingBarn() ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Aves Muertas -->
    @if (showDeadBirdsModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-skull-crossbones"></i> Registrar Aves Muertas</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="deadBirdsForm">
              <div class="form-group">
                <label><i class="fas fa-layer-group"></i> Lote</label>
                <input type="text" [value]="'Lote #' + selectedFlock()?.id" disabled />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-skull-crossbones"></i> Cantidad</label>
                  <input type="number" formControlName="cantidad" placeholder="Cantidad de aves muertas" min="1" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-calendar"></i> Fecha</label>
                  <input type="date" formControlName="fecha" />
                </div>
              </div>
              <div class="form-group">
                <label><i class="fas fa-comment"></i> Motivo</label>
                <textarea formControlName="motivo" placeholder="Motivo del deceso..." rows="2"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-danger" (click)="saveDeadBirds()">
              <i class="fas fa-save"></i> Registrar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tabs-container { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
    .tab-btn {
      padding: 1rem 2rem; border: 2px solid var(--gray-medium); background: white;
      border-radius: 8px; font-size: 1.4rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 0.8rem; transition: all 0.2s;
      font-family: 'Work Sans', sans-serif;
      &.active { background: var(--primary-green); color: white; border-color: var(--primary-green); }
    }
    .table-responsive { overflow-x: auto; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th { padding: 1.2rem 1.5rem; background: var(--gray-light); font-size: 1.2rem; font-weight: 600; text-transform: uppercase; color: var(--gray-dark); text-align: left; }
      td { padding: 1.2rem 1.5rem; border-top: 1px solid var(--gray-medium); font-size: 1.4rem; }
      tr:hover td { background: rgba(57,169,0,0.03); }
    }
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; padding: 0.3rem; border-radius: 6px; &:hover { background: var(--gray-light); } }
    .spinner-sm { width: 1.6rem; height: 1.6rem; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class FlocksComponent implements OnInit {
  private fb = inject(FormBuilder);
  private flocksService = inject(FlocksService);
  private barnsService = inject(BarnsService);
  private breedsService = inject(BreedsService);
  private toast = inject(ToastService);

  loading = signal(true);
  flocks = signal<Flock[]>([]);
  filteredFlocks = signal<Flock[]>([]);
  barns = signal<Barn[]>([]);
  breeds = signal<Breed[]>([]);
  activeTab = signal<'flocks' | 'barns'>('flocks');
  searchQuery = '';

  showFlockModal = signal(false);
  showBarnModal = signal(false);
  showDeadBirdsModal = signal(false);
  savingFlock = signal(false);
  savingBarn = signal(false);
  editingBarn = signal<Barn | null>(null);
  selectedFlock = signal<Flock | null>(null);

  totalGallinas = signal(0);
  activeFlocks = signal(0);
  totalDeadBirds = signal(0);

  flockForm = this.fb.group({
    cantidad_aves: [null, [Validators.required, Validators.min(1)]],
    fecha_ingreso: [''],
    id_galpon: [''],
    id_raza: [''],
  });

  barnForm = this.fb.group({
    nombre: ['', Validators.required],
    capacidad: [null as number | null],
    descripcion: [''],
  });

  deadBirdsForm = this.fb.group({
    cantidad: [null, [Validators.required, Validators.min(1)]],
    fecha: [new Date().toISOString().split('T')[0]],
    motivo: [''],
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.flocksService.getAll().subscribe({
      next: (flocks) => {
        this.flocks.set(flocks);
        this.filteredFlocks.set(flocks);
        const activos = flocks.filter((f) => f.estado === 'activo');
        this.activeFlocks.set(activos.length);
        this.totalGallinas.set(activos.reduce((s, f) => s + (f.cantidad_aves || 0), 0));
        this.totalDeadBirds.set(flocks.reduce((s, f) => s + (f.cantidad_aves_muertas || 0), 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.barnsService.getAll().subscribe((b) => this.barns.set(b));
    this.breedsService.getAll().subscribe((b) => this.breeds.set(b));
  }

  filterFlocks(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredFlocks.set(this.flocks().filter((f) => `${f.id} ${f.gestion_galpon?.nombre} ${f.raza?.nombre}`.toLowerCase().includes(q)));
  }

  openModal(type: 'flock' | 'barn'): void {
    if (type === 'flock') { this.flockForm.reset(); this.showFlockModal.set(true); }
    if (type === 'barn') { this.barnForm.reset(); this.editingBarn.set(null); this.showBarnModal.set(true); }
  }

  closeModals(): void {
    this.showFlockModal.set(false);
    this.showBarnModal.set(false);
    this.showDeadBirdsModal.set(false);
  }

  saveFlock(): void {
    if (this.flockForm.invalid) { this.flockForm.markAllAsTouched(); return; }
    this.savingFlock.set(true);
    this.flocksService.create(this.flockForm.value as Partial<Flock>).subscribe({
      next: () => { this.toast.success('Lote registrado exitosamente'); this.closeModals(); this.loadData(); },
      error: () => { this.toast.error('Error al registrar el lote'); this.savingFlock.set(false); },
      complete: () => this.savingFlock.set(false),
    });
  }

  saveBarn(): void {
    if (this.barnForm.invalid) { this.barnForm.markAllAsTouched(); return; }
    const data = this.barnForm.value as Partial<Barn>;
    const editing = this.editingBarn();
    const req = editing ? this.barnsService.update(editing.id, data) : this.barnsService.create(data);
    req.subscribe({
      next: () => { this.toast.success(editing ? 'Galpón actualizado' : 'Galpón registrado'); this.closeModals(); this.loadData(); },
      error: () => this.toast.error('Error al guardar el galpón'),
    });
  }

  editBarn(barn: Barn): void {
    this.editingBarn.set(barn);
    this.barnForm.patchValue({ nombre: barn.nombre, capacidad: barn.capacidad ?? null, descripcion: barn.descripcion ?? '' });
    this.showBarnModal.set(true);
  }

  deleteBarn(id: number): void {
    if (!confirm('¿Eliminar este galpón?')) return;
    this.barnsService.delete(id).subscribe({
      next: () => { this.toast.success('Galpón eliminado'); this.loadData(); },
      error: () => this.toast.error('Error al eliminar el galpón'),
    });
  }

  openDeadBirdsModal(flock: Flock): void {
    this.selectedFlock.set(flock);
    this.deadBirdsForm.reset({ fecha: new Date().toISOString().split('T')[0] });
    this.showDeadBirdsModal.set(true);
  }

  saveDeadBirds(): void {
    const flock = this.selectedFlock();
    if (!flock || this.deadBirdsForm.invalid) return;
    const data = { id_lote: flock.id, ...this.deadBirdsForm.value };
    this.flocksService.registerDeadBirds(data as unknown as { id_lote: number; cantidad: number; fecha?: string; motivo?: string }).subscribe({
      next: () => { this.toast.success('Registro de aves muertas guardado'); this.closeModals(); this.loadData(); },
      error: () => this.toast.error('Error al registrar aves muertas'),
    });
  }

  finalizeFlock(flock: Flock): void {
    if (!confirm(`¿Finalizar el Lote #${flock.id}? Esta acción no se puede deshacer.`)) return;
    this.flocksService.finalizeFlock({ id_lote: flock.id }).subscribe({
      next: () => { this.toast.success('Lote finalizado exitosamente'); this.loadData(); },
      error: () => this.toast.error('Error al finalizar el lote'),
    });
  }
}
