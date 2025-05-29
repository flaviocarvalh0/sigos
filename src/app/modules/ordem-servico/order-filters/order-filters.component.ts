// order-filters.component.ts
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FilterState {
  search: string;
  status: string;
  dateRange: string;
}

@Component({
  selector: 'app-order-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card mb-4">
  <div class="card-body p-4">
    <div class="d-flex flex-column gap-3"> <!-- Adicionado gap-3 para espaçamento vertical -->
      
      <!-- Search - Agora com mais margem -->
      <div class="position-relative mb-3"> <!-- Adicionado mb-3 -->
        <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
        <input
          type="text"
          class="form-control ps-5 py-2" 
          placeholder="Buscar por código, cliente ou problema..."
          [(ngModel)]="filters.search"
          (ngModelChange)="handleFilterChange('search', $event)"
        />
      </div>

      <!-- Filters Row - Agora com mais espaçamento -->
      <div class="row g-3"> <!-- Alterado de gap-4 para g-3 -->
        <div class="col-md-6">
          <select 
            class="form-select py-2" 
            [(ngModel)]="filters.status"
            (ngModelChange)="handleFilterChange('status', $event)"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div class="col-md-6">
          <select 
            class="form-select py-2" 
            [(ngModel)]="filters.dateRange"
            (ngModelChange)="handleFilterChange('dateRange', $event)"
          >
            <option value="todos">Todos os Períodos</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mês</option>
            <option value="trimestre">Últimos 3 Meses</option>
          </select>
        </div>
      </div>

      <!-- Clear Filters - Agora com mais margem -->
      <button
        class="btn btn-outline-secondary mt-3 py-2" 
        (click)="clearFilters()"
      >
        Limpar Filtros
      </button>
    </div>
  </div>
</div>
  `
})
export class OrderFiltersComponent {
  filters: FilterState = {
    search: '',
    status: 'todos',
    dateRange: 'todos'
  };

  @Output() filterChange = new EventEmitter<FilterState>();

  handleFilterChange(key: keyof FilterState, value: string) {
    this.filters = { ...this.filters, [key]: value };
    this.filterChange.emit(this.filters);
  }

  clearFilters() {
    this.filters = { search: '', status: 'todos', dateRange: 'todos' };
    this.filterChange.emit(this.filters);
  }
}