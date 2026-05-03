import { Component, inject } from '@angular/core';
import { SimpleCrudComponent, CrudField } from '../../../shared/components/simple-crud/simple-crud.component';
import { BarnsService } from '../../../core/services/api.services';

@Component({
  selector: 'app-barns-config',
  standalone: true,
  imports: [SimpleCrudComponent],
  template: `
    <app-simple-crud
      [service]="service"
      title="Galpones"
      subtitle="Gestiona los galpones de la granja."
      entityName="Galpón"
      icon="fa-warehouse"
      [fields]="fields"
    />
  `,
})
export class BarnsConfigComponent {
  service = inject(BarnsService);
  fields: CrudField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Galpón 1', required: true },
    { key: 'capacidad', label: 'Capacidad', type: 'number', placeholder: 'Ej: 500', required: false },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción...', required: false },
  ];
}
