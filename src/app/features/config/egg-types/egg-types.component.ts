import { Component, inject } from '@angular/core';
import { SimpleCrudComponent, CrudField } from '../../../shared/components/simple-crud/simple-crud.component';
import { EggTypesService } from '../../../core/services/api.services';

@Component({
  selector: 'app-egg-types',
  standalone: true,
  imports: [SimpleCrudComponent],
  template: `
    <app-simple-crud
      [service]="service"
      title="Tipos de Huevo"
      subtitle="Gestiona la clasificación de tipos de huevo."
      entityName="Tipo de Huevo"
      icon="fa-egg"
      [fields]="fields"
    />
  `,
})
export class EggTypesComponent {
  service = inject(EggTypesService);
  fields: CrudField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: JUMBO', required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción...', required: false },
  ];
}
