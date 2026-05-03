import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UsersService, RolesService } from '../../../core/services/api.services';
import { ToastService } from '../../../core/services/toast.service';
import { User, Role } from '../../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="users-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-users"></i></div>
          <div>
            <h2>Gestión de Usuarios</h2>
            <p>Administra usuarios del sistema y sus roles.</p>
          </div>
        </div>
        <div class="module-header-right">
          <a routerLink="/config" class="btn-outline"><i class="fas fa-arrow-left"></i> Volver</a>
          <button class="btn-green" (click)="openModal()">
            <i class="fas fa-plus"></i> Nuevo Usuario
          </button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <h3>Listado de Usuarios</h3>
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar usuario..." [(ngModel)]="searchQuery" (input)="filter()" />
          </div>
        </div>

        @if (loading()) {
          <div class="loading-container"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <h3>No hay usuarios registrados</h3>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr><th>ID</th><th>Nombre</th><th>Documento</th><th>Email</th><th>Roles</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                @for (user of filtered(); track user.id) {
                  <tr>
                    <td>#{{ user.id }}</td>
                    <td><strong>{{ user.nombre }}</strong></td>
                    <td>{{ user.numero_documento }}</td>
                    <td>{{ user.email || '—' }}</td>
                    <td>
                      @for (role of (user.roles || []); track role.id) {
                        <span class="badge active" style="margin-right:0.4rem">{{ role.nombre }}</span>
                      }
                      @if (!(user.roles?.length)) { <span class="badge inactive">Sin rol</span> }
                    </td>
                    <td>
                      <span class="badge {{ user.estado !== false ? 'active' : 'inactive' }}">
                        {{ user.estado !== false ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="actions-cell">
                      <button class="btn-icon edit" title="Editar" (click)="editUser(user)"><i class="fas fa-edit"></i></button>
                      <button class="btn-icon view" title="Asignar rol" (click)="openRoleModal(user)"><i class="fas fa-user-tag"></i></button>
                      <button class="btn-icon delete" title="Eliminar" (click)="deleteUser(user.id)"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Modal Usuario -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-user"></i> {{ editing() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="userForm">
              <div class="form-group">
                <label><i class="fas fa-user"></i> Nombre Completo</label>
                <input type="text" formControlName="nombre" placeholder="Nombre completo" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-id-card"></i> Número de Documento</label>
                  <input type="text" formControlName="numero_documento" placeholder="Número de documento" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-envelope"></i> Email</label>
                  <input type="email" formControlName="email" placeholder="correo@ejemplo.com" />
                </div>
              </div>
              @if (!editing()) {
                <div class="form-group">
                  <label><i class="fas fa-lock"></i> Contraseña</label>
                  <input type="password" formControlName="contrasena" placeholder="Contraseña" />
                </div>
              }
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-green" (click)="save()" [disabled]="saving()">
              <i class="fas fa-save"></i> {{ editing() ? 'Actualizar' : 'Crear Usuario' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Asignar Rol -->
    @if (showRoleModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-user-tag"></i> Asignar Rol — {{ selectedUser()?.nombre }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label><i class="fas fa-user-tag"></i> Roles Actuales</label>
              <div class="role-chips">
                @for (role of (selectedUser()?.roles || []); track role.id) {
                  <span class="badge active">
                    {{ role.nombre }}
                    <button class="chip-remove" (click)="removeRole(role.id)"><i class="fas fa-times"></i></button>
                  </span>
                }
                @if (!(selectedUser()?.roles?.length)) {
                  <span class="badge inactive">Sin roles asignados</span>
                }
              </div>
            </div>
            <div class="form-group">
              <label><i class="fas fa-plus-circle"></i> Asignar Nuevo Rol</label>
              <select [(ngModel)]="selectedRoleId">
                <option value="">Seleccionar rol</option>
                @for (role of roles(); track role.id) {
                  <option [value]="role.id">{{ role.nombre }}</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cerrar</button>
            <button class="btn-green" (click)="assignRole()" [disabled]="!selectedRoleId">
              <i class="fas fa-plus"></i> Asignar Rol
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
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; padding: 0.3rem; }
    .role-chips { display: flex; flex-wrap: wrap; gap: 0.8rem; }
    .chip-remove { background: none; border: none; cursor: pointer; color: inherit; margin-left: 0.4rem; font-size: 1rem; }
  `],
})
export class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private toast = inject(ToastService);

  loading = signal(true);
  users = signal<User[]>([]);
  filtered = signal<User[]>([]);
  roles = signal<Role[]>([]);
  searchQuery = '';
  showModal = signal(false);
  showRoleModal = signal(false);
  editing = signal<User | null>(null);
  selectedUser = signal<User | null>(null);
  selectedRoleId = '';
  saving = signal(false);

  userForm = this.fb.group({
    nombre: ['', Validators.required],
    numero_documento: ['', Validators.required],
    email: ['', Validators.email],
    contrasena: [''],
  });

  ngOnInit(): void {
    this.loadUsers();
    this.rolesService.getAll().subscribe((r) => this.roles.set(r));
  }

  private loadUsers(): void {
    this.usersService.getAll().subscribe({
      next: (data) => { this.users.set(data); this.filtered.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered.set(this.users().filter((u) => `${u.nombre} ${u.numero_documento} ${u.email}`.toLowerCase().includes(q)));
  }

  openModal(): void { this.editing.set(null); this.userForm.reset(); this.showModal.set(true); }

  editUser(user: User): void {
    this.editing.set(user);
    this.userForm.patchValue({ nombre: user.nombre, numero_documento: user.numero_documento, email: user.email || '' });
    this.showModal.set(true);
  }

  openRoleModal(user: User): void { this.selectedUser.set(user); this.selectedRoleId = ''; this.showRoleModal.set(true); }

  closeModals(): void { this.showModal.set(false); this.showRoleModal.set(false); }

  save(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = this.userForm.value as Partial<User>;
    const editing = this.editing();
    const req = editing ? this.usersService.update(editing.id, data) : this.usersService.create(data);
    req.subscribe({
      next: () => { this.toast.success(editing ? 'Usuario actualizado' : 'Usuario creado'); this.closeModals(); this.loadUsers(); },
      error: () => { this.toast.error('Error al guardar el usuario'); this.saving.set(false); },
      complete: () => this.saving.set(false),
    });
  }

  deleteUser(id: number): void {
    if (!confirm('¿Eliminar este usuario?')) return;
    this.usersService.delete(id).subscribe({
      next: () => { this.toast.success('Usuario eliminado'); this.loadUsers(); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }

  assignRole(): void {
    const user = this.selectedUser();
    if (!user || !this.selectedRoleId) return;
    this.rolesService.assignRole({ id_usuario: user.id, id_rol: +this.selectedRoleId }).subscribe({
      next: () => { this.toast.success('Rol asignado exitosamente'); this.loadUsers(); this.closeModals(); },
      error: () => this.toast.error('Error al asignar rol'),
    });
  }

  removeRole(roleId: number): void {
    const user = this.selectedUser();
    if (!user) return;
    this.rolesService.removeRole({ id_usuario: user.id, id_rol: roleId }).subscribe({
      next: () => { this.toast.success('Rol removido'); this.loadUsers();
        const updated = { ...user, roles: (user.roles || []).filter((r) => r.id !== roleId) };
        this.selectedUser.set(updated as User);
      },
      error: () => this.toast.error('Error al remover rol'),
    });
  }
}
