// service-order-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { OrdemServico } from '../../../Models/ordem_servico.model';

@Component({
  selector: 'app-service-order-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="card h-100 d-flex flex-column"> <!-- Flex column para alinhamento interno -->
  <div class="card-header">
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <h3 class="h6 fw-bold mb-1">OS #{{order.codigo}}</h3>
        <span class="badge" [ngClass]="getStatusColor(order.status)">
          {{formatStatus(order.status)}}
        </span>
      </div>
      <div class="text-end">
        <p class="h6 fw-bold text-primary mb-0">
          R$ {{order.valor_total.toFixed(2)}}
        </p>
      </div>
    </div>
  </div>

  <div class="card-body flex-grow-1 d-flex flex-column"> <!-- Flex-grow para ocupar espaço -->
    <!-- Conteúdo superior -->
    <div>
      <div class="d-flex align-items-center gap-2 text-muted small mb-2">
        <i class="bi bi-person"></i>
        <span class="text-truncate">{{order.cliente_nome}}</span>
      </div>
      
      <div class="d-flex align-items-center gap-2 text-muted small mb-2">
        <i class="bi bi-phone"></i>
        <span class="text-truncate">{{order.aparelho_descricao}}</span>
      </div>
      
      <div class="d-flex align-items-center gap-2 text-muted small mb-3">
        <i class="bi bi-calendar"></i>
        <span>{{order.data_criacao | date:'dd/MM/yyyy'}}</span>
      </div>
      
      <div class="mb-3">
        <p class="small text-muted mb-1">Problema:</p>
        <p class="small mb-0 text-break line-clamp-2">
          {{order.relato_do_problema}}
        </p>
      </div>
    </div>

    <!-- Botão alinhado na base -->
    <div class="mt-auto"> <!-- mt-auto empurra o botão para baixo -->
      <button 
        (click)="onViewDetails.emit(order)"
        class="btn btn-outline-primary w-100 btn-sm"
      >
        Ver Detalhes
      </button>
    </div>
  </div>
</div>
  `,
})
export class ServiceOrderCardComponent {
  @Input() order!: OrdemServico;
  @Output() onViewDetails = new EventEmitter<OrdemServico>();

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      case 'em_andamento':
        return 'bg-info text-info-foreground';
      case 'concluido':
        return 'bg-success text-success-foreground';
      case 'cancelado':
        return 'bg-danger text-danger-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  }

  formatStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'Pendente';
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }
}
