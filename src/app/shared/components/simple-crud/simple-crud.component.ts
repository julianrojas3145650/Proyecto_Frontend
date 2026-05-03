import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BaseApiService } from '../../../core/services/base-api.service';
import { ToastService } from '../../../core/services/toast.service';

export interface CrudField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea';
  placeholder?: string;
  required?: boolean;
}

@Component({
  selector: 'app-simple-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="crud-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas {{ icon }}"></i></div>
          <div><h2>{{ title }}</h2><p>{{ subtitle }}</p></div>
        </div>
        <div class="module-header-right">
          <a routerLink="/config" class="btn-outline"><i class="fas fa-arrow-left"></i> Volver</a>
          <button class="btn-green" (click)="openModal()"><i class="fas fa-plus"></i> Nuevo</button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <h3>{{ title }}</h3>
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar..." [(ngModel)]="searchQuery" (input)="filterItems()" />
          </div>
        </div>
        @if (loading()) { <div class="loading-container"><div class="spinner"></div></div> }
        @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="fas {{ icon }}"></i>
            <h3>No hay registros</h3>
            <p>Crea el primero haciendo clic en "Nuevo"</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  @for (field of fields; track field.key) { <th>{{ field.label }}</th> }
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filtered(); track item['id']) {
                  <tr>
                    <td>#{{ asRecord(item)['id'] }}</td>
                    @for (field of fields; track field.key) {
                      <td>{{ asRecord(item)[field.key] || '—' }}</td>
                    }
                    <td class="actions-cell">
                      <button class="btn-icon edit" (click)="editItem(item)"><i class="fas fa-edit"></i></button>
                      <button class="btn-icon delete" (click)="deleteItem(item.id)"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas {{ icon }}"></i> {{ editing() ? 'Editar' : 'Nuevo' }} {{ entityName }}</h3>
            <button class="btn-close" (click)="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form">
              @for (field of fields; track field.key) {
                <div class="form-group">
                  <label><i class="fas {{ icon }}"></i> {{ field.label }}</label>
                  @if (field.type === 'textarea') {
                    <textarea [formControlName]="field.key" [placeholder]="field.placeholder || ''" rows="3"></textarea>
                  } @else {
                    <input [type]="field.type" [formControlName]="field.key" [placeholder]="field.placeholder || ''" />
                  }
                </div>
              }
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModal()">Cancelar</button>
            <button class="btn-green" (click)="save()" [disabled]="saving()">
              <i class="fas fa-save"></i> {{ editing() ? 'Actualizar' : 'Crear' }}
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
export class SimpleCrudComponent<T extends { id: number }> implements OnInit {
  @Input({ required: true }) service!: BaseApiService<T>;
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() entityName = 'Registro';
  @Input() icon = 'fa-list';
  @Input({ required: true }) fields!: CrudField[];

  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  loading = signal(true);
  items = signal<T[]>([]);
  filtered = signal<T[]>([]);
  searchQuery = '';
  showModal = signal(false);
  editing = signal<T | null>(null);
  saving = signal(false);
  form!: FormGroup;

  asRecord(item: T): Record<string, unknown> { return item as unknown as Record<string, unknown>; }

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  private buildForm(): void {
    const controls: Record<string, unknown> = {};
    for (const field of this.fields) {
      controls[field.key] = [null, field.required !== false ? Validators.required : []];
    }
    this.form = this.fb.group(controls);
  }

  private load(): void {
    this.service.getAll().subscribe({
      next: (data) => { this.items.set(data); this.filtered.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filterItems(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered.set(this.items().filter((item) =>
      this.fields.some((f) => String((item as Record<string, unknown>)[f.key] ?? '').toLowerCase().includes(q))
    ));
  }

  openModal(): void { this.editing.set(null); this.form.reset(); this.showModal.set(true); }

  editItem(item: T): void {
    this.editing.set(item);
    const patch: Record<string, unknown> = {};
    for (const field of this.fields) patch[field.key] = (item as Record<string, unknown>)[field.key];
    this.form.patchValue(patch);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = this.form.value as Partial<T>;
    const editing = this.editing();
    const req = editing ? this.service.update(editing.id, data) : this.service.create(data);
    req.subscribe({
      next: () => { this.toast.success(`${this.entityName} guardado`); this.closeModal(); this.load(); },
      error: () => { this.toast.error(`Error al guardar`); this.saving.set(false); },
      complete: () => this.saving.set(false),
    });
  }

  deleteItem(id: number): void {
    if (!confirm(`¿Eliminar este ${this.entityName}?`)) return;
    this.service.delete(id).subscribe({
      next: () => { this.toast.success(`${this.entityName} eliminado`); this.load(); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }
}
