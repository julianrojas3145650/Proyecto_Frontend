import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportsService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { Report } from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="reports-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-chart-bar"></i></div>
          <div>
            <h2>Reportes</h2>
            <p>Genera y visualiza reportes del sistema avícola.</p>
          </div>
        </div>
        <div class="module-header-right">
          <button class="btn-green" (click)="showModal.set(true)">
            <i class="fas fa-plus"></i> Generar Reporte
          </button>
        </div>
      </div>

      <!-- Report Type Cards -->
      <div class="reports-grid">
        <div class="report-card" (click)="openReportType('produccion_huevos')">
          <div class="report-icon" style="background:linear-gradient(135deg,#FF9800,#e65100)">
            <i class="fas fa-egg"></i>
          </div>
          <h3>Producción de Huevos</h3>
          <p>Reporte detallado de producción por fecha, tipo y lote.</p>
          <span class="report-badge">Disponible</span>
        </div>
        <div class="report-card" (click)="openReportType('gallinas')">
          <div class="report-icon" style="background:linear-gradient(135deg,#39A900,#2d8600)">
            <i class="fas fa-dove"></i>
          </div>
          <h3>Estado de Gallinas</h3>
          <p>Inventario de lotes activos y mortalidad por galpón.</p>
          <span class="report-badge">Disponible</span>
        </div>
        <div class="report-card" (click)="openReportType('insumos')">
          <div class="report-icon" style="background:linear-gradient(135deg,#2196F3,#0d47a1)">
            <i class="fas fa-box"></i>
          </div>
          <h3>Insumos y Alimentación</h3>
          <p>Consumo de insumos y registros de alimentación.</p>
          <span class="report-badge">Disponible</span>
        </div>
        <div class="report-card" (click)="openReportType('general')">
          <div class="report-icon" style="background:linear-gradient(135deg,#9C27B0,#4a148c)">
            <i class="fas fa-chart-pie"></i>
          </div>
          <h3>Reporte General</h3>
          <p>Resumen completo de todas las operaciones de la granja.</p>
          <span class="report-badge">Disponible</span>
        </div>
      </div>

      <!-- Reports History -->
      <div class="table-container" style="margin-top:2.5rem">
        <div class="table-header">
          <h3>Historial de Reportes</h3>
        </div>
        @if (loading()) {
          <div class="loading-container"><div class="spinner"></div></div>
        } @else if (reports().length === 0) {
          <div class="empty-state">
            <i class="fas fa-file-alt"></i>
            <h3>No hay reportes generados</h3>
            <p>Genera tu primer reporte seleccionando una opción arriba</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr><th>ID</th><th>Tipo</th><th>Fecha</th><th>Descripción</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                @for (report of reports(); track report.id) {
                  <tr>
                    <td>#{{ report.id }}</td>
                    <td><span class="badge active">{{ report.tipo || 'General' }}</span></td>
                    <td>{{ report.fecha ? (report.fecha | date:'dd/MM/yyyy HH:mm') : '—' }}</td>
                    <td>{{ report.descripcion || '—' }}</td>
                    <td>
                      <button class="btn-icon view" title="Ver reporte"><i class="fas fa-eye"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- Modal Generar Reporte -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="showModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-chart-bar"></i> Generar Reporte</h3>
            <button class="btn-close" (click)="showModal.set(false)"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="reportForm">
              <div class="form-group">
                <label><i class="fas fa-list"></i> Tipo de Reporte</label>
                <select formControlName="tipo">
                  <option value="">Seleccionar tipo</option>
                  <option value="produccion_huevos">Producción de Huevos</option>
                  <option value="gallinas">Estado de Gallinas</option>
                  <option value="insumos">Insumos y Alimentación</option>
                  <option value="general">Reporte General</option>
                </select>
              </div>
              <div class="form-group">
                <label><i class="fas fa-comment"></i> Descripción</label>
                <textarea formControlName="descripcion" placeholder="Descripción del reporte..." rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="showModal.set(false)">Cancelar</button>
            <button class="btn-green" (click)="generateReport()" [disabled]="saving()">
              <i class="fas fa-file-export"></i> Generar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 2rem;
      margin-bottom: 2.5rem;
    }
    .report-card {
      background: white;
      border-radius: var(--border-radius-lg);
      padding: 2.5rem 2rem;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1rem;
      &:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    }
    .report-icon {
      width: 6rem; height: 6rem; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 2.6rem;
    }
    .report-card h3 { font-size: 1.6rem; font-weight: 700; color: var(--text-dark); }
    .report-card p { font-size: 1.3rem; color: var(--gray-dark); }
    .report-badge { background: var(--light-green); color: var(--dark-green); padding: 0.4rem 1.2rem; border-radius: 20px; font-size: 1.2rem; font-weight: 600; }
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse;
      th { padding: 1.2rem 1.5rem; background: var(--gray-light); font-size: 1.2rem; font-weight: 600; text-transform: uppercase; color: var(--gray-dark); text-align: left; }
      td { padding: 1.2rem 1.5rem; border-top: 1px solid var(--gray-medium); font-size: 1.4rem; }
    }
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; }
  `],
})
export class ReportsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportsService = inject(ReportsService);
  private toast = inject(ToastService);

  loading = signal(true);
  reports = signal<Report[]>([]);
  showModal = signal(false);
  saving = signal(false);

  reportForm = this.fb.group({
    tipo: ['', Validators.required],
    descripcion: [''],
  });

  ngOnInit(): void { this.loadReports(); }

  private loadReports(): void {
    this.reportsService.getAll().subscribe({
      next: (data) => { this.reports.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openReportType(type: string): void {
    this.reportForm.patchValue({ tipo: type });
    this.showModal.set(true);
  }

  generateReport(): void {
    if (this.reportForm.invalid) { this.reportForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.reportsService.create(this.reportForm.value).subscribe({
      next: () => {
        this.toast.success('Reporte generado exitosamente');
        this.showModal.set(false);
        this.loadReports();
      },
      error: () => { this.toast.error('Error al generar el reporte'); this.saving.set(false); },
      complete: () => this.saving.set(false),
    });
  }
}
