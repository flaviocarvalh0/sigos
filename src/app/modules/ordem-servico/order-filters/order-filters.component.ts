import { NgSelectModule } from '@ng-select/ng-select';
import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EstadoSelecao } from '../../../Models/workflow/workflow-estado.model';

// Interface para as opções de status que virão do componente pai
interface StatusOption {
  id: number;
  descricao: string;
}

@Component({
  selector: 'app-order-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  template: `<form [formGroup]="filterForm" class="row g-3 align-items-center">

  <!-- Campo de Busca -->
  <div class="col-12 col-md">
    <div class="input-group input-group-sm">
      <span class="input-group-text bg-light border-0"><i class="bi bi-search"></i></span>
      <input type="text" class="form-control bg-light border-0" formControlName="search" placeholder="Buscar por código, cliente, aparelho...">
    </div>
  </div>

  <!-- Filtro de Status (com a largura ajustada) -->
  <div class="col-12 col-sm-6 col-md-3">
    <ng-select
        formControlName="statusId"
        [items]="statusOptions"
        bindLabel="descricao"
        bindValue="id"
        placeholder="Todos os Status"
        [clearable]="true"
        class="ng-select-sm"
        appendTo="body">
    </ng-select>
  </div>

  <!-- Botão Limpar -->
  <div class="col-12 col-md-auto">
    <button type="button" class="btn btn-sm btn-outline-secondary w-100 w-md-auto" (click)="clearFilters()">Limpar</button>
  </div>
</form>`,
})
export class OrderFiltersComponent implements OnInit, OnDestroy {
  // Recebe a lista de status do componente pai
  @Input() statusOptions: EstadoSelecao[] = [];

  // Emite o objeto de filtros para o componente pai
  @Output() filterChange = new EventEmitter<any>();

  filterForm: FormGroup;
  private formSub: Subscription | undefined;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      search: [''],
      statusId: [null], // Agora filtramos pelo ID
      dateRange: ['todos'],
    });
  }

  ngOnInit(): void {
    // Escuta as mudanças no formulário
    this.formSub = this.filterForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((filters) => {
        this.filterChange.emit(filters);
      });
  }

  ngOnDestroy(): void {
    this.formSub?.unsubscribe();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      statusId: null,
      dateRange: 'todos',
    });
  }
}
