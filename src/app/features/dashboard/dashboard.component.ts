import { Component, inject, OnInit, signal, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlocksService, EggInventoryService, BarnsService, SuppliesService } from '../../core/services/api.services';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <!-- Module Header -->
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-home"></i></div>
          <div>
            <h2>Inicio</h2>
            <p>Resumen general del sistema avícola</p>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon orange"><i class="fas fa-egg"></i></div>
          <div class="stat-info">
            <div class="stat-label">Huevos</div>
            <div class="stat-value">{{ stats().totalHuevos }}</div>
            <div class="stat-sub">Total inventario</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fas fa-dove"></i></div>
          <div class="stat-info">
            <div class="stat-label">Gallinas</div>
            <div class="stat-value">{{ stats().totalGallinas }}</div>
            <div class="stat-sub">Total activas</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i class="fas fa-layer-group"></i></div>
          <div class="stat-info">
            <div class="stat-label">Lotes</div>
            <div class="stat-value">{{ stats().totalLotes }}</div>
            <div class="stat-sub">Lotes activos</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon cyan"><i class="fas fa-warehouse"></i></div>
          <div class="stat-info">
            <div class="stat-label">Galpones</div>
            <div class="stat-value">{{ stats().totalGalpones }}</div>
            <div class="stat-sub">Total galpones</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pink"><i class="fas fa-box"></i></div>
          <div class="stat-info">
            <div class="stat-label">Insumos</div>
            <div class="stat-value">{{ stats().totalInsumos }}</div>
            <div class="stat-sub">Registrados</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-chart-bar"></i></div>
          <div class="stat-info">
            <div class="stat-label">Clasificados</div>
            <div class="stat-value">{{ stats().huevosClasificados }}</div>
            <div class="stat-sub">Huevos clasificados</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid">
        <div class="chart-card">
          <h3><i class="fas fa-chart-bar" style="color:#39A900;margin-right:0.8rem"></i>Producción por Tipo de Huevo</h3>
          <canvas #barChart></canvas>
        </div>
        <div class="chart-card">
          <h3><i class="fas fa-chart-pie" style="color:#39A900;margin-right:0.8rem"></i>Clasificación de Huevos</h3>
          <canvas #donutChart></canvas>
        </div>
        <div class="chart-card">
          <h3><i class="fas fa-chart-line" style="color:#39A900;margin-right:0.8rem"></i>Producción de Huevos</h3>
          <canvas #lineChart></canvas>
        </div>
        <div class="chart-card">
          <h3><i class="fas fa-chart-pie" style="color:#39A900;margin-right:0.8rem"></i>Estado de Lotes</h3>
          <canvas #pieChart></canvas>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart') donutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;

  private flocksService = inject(FlocksService);
  private eggService = inject(EggInventoryService);
  private barnsService = inject(BarnsService);
  private suppliesService = inject(SuppliesService);

  loading = signal(true);
  stats = signal({
    totalHuevos: 0, totalGallinas: 0, totalLotes: 0,
    huevosClasificados: 0, totalGalpones: 0, totalInsumos: 0,
  });

  ngOnInit(): void { this.loadStats(); }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 500);
  }

  private loadStats(): void {
    this.flocksService.getAll().subscribe({
      next: (flocks) => {
        const activos = flocks.filter((f) => f.estado === 'activo');
        const totalGallinas = activos.reduce((sum, f) => sum + (f.cantidad_aves || 0), 0);
        this.stats.update((s) => ({ ...s, totalLotes: activos.length, totalGallinas }));
      },
    });

    this.eggService.getAll().subscribe({
      next: (eggs) => {
        const total = eggs.reduce((sum, e) => sum + (e.cantidad || 0), 0);
        this.stats.update((s) => ({ ...s, totalHuevos: total, huevosClasificados: eggs.length }));
      },
    });

    this.barnsService.getAll().subscribe({
      next: (barns) => this.stats.update((s) => ({ ...s, totalGalpones: barns.length })),
    });

    this.suppliesService.getAll().subscribe({
      next: (supplies) => {
        this.stats.update((s) => ({ ...s, totalInsumos: supplies.length }));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private initCharts(): void {
    const green = '#39A900';
    const colors = ['#39A900', '#FF9800', '#2196F3', '#9C27B0', '#00BCD4', '#E91E63'];

    if (this.barChartRef) {
      new Chart(this.barChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['JUMBO', 'AAA', 'AA', 'A', 'B', 'Dañados'],
          datasets: [{ label: 'Cantidad', data: [320, 280, 190, 150, 80, 30], backgroundColor: colors, borderRadius: 6 }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }

    if (this.donutChartRef) {
      new Chart(this.donutChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['JUMBO', 'AAA', 'AA', 'A', 'B'],
          datasets: [{ data: [30, 27, 18, 14, 11], backgroundColor: colors }],
        },
        options: { responsive: true },
      });
    }

    if (this.lineChartRef) {
      new Chart(this.lineChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Huevos',
            data: [1200, 1350, 1100, 1500, 1400, 1600],
            borderColor: green,
            backgroundColor: 'rgba(57,169,0,0.1)',
            tension: 0.4,
            fill: true,
          }],
        },
        options: { responsive: true },
      });
    }

    if (this.pieChartRef) {
      new Chart(this.pieChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: ['Activos', 'Finalizados'],
          datasets: [{ data: [75, 25], backgroundColor: [green, '#e0e0e0'] }],
        },
        options: { responsive: true },
      });
    }
  }
}
