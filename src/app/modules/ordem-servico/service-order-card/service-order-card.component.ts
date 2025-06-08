import { ClienteService } from './../../../services/cliente.service';
// service-order-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { OrdemServico } from '../../../Models/ordem-servico/ordem-servico.model';
import { Cliente } from '../../../Models/cliente.model';
import { Aparelho } from '../../../Models/aparelho.model';
import { AparelhoService } from '../../../services/aparelho.service';
import { MarcaService } from '../../../services/marca.service';
import { ModeloService } from '../../../services/modelo.service';
import { Marca } from '../../../Models/marca.model';
import { Modelo } from '../../../Models/modelo.model';

@Component({
  selector: 'app-service-order-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="card h-100 d-flex flex-column">
      <!-- Flex column para alinhamento interno -->
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h3 class="h6 fw-bold mb-1">OS #{{ order.codigo }}</h3>
            <span class="badge" [ngClass]="getStatusColor(order.nomeEstado!)">
              {{ formatStatus(order.nomeEstado!) }}
            </span>
          </div>
          <div class="text-end">
            <p class="h6 fw-bold text-primary mb-0">
              R$ {{ order.valorTotal }}
            </p>
          </div>
        </div>
      </div>

      <div class="card-body flex-grow-1 d-flex flex-column">
        <!-- Flex-grow para ocupar espaço -->
        <!-- Conteúdo superior -->
        <div>
          <div class="d-flex align-items-center gap-2 text-muted small mb-2">
            <i class="bi bi-person"></i>
            <span class="text-truncate">{{ order.nomeCliente}}</span>
          </div>

          <div class="d-flex align-items-center gap-2 text-muted small mb-2">
            <i class="bi bi-phone"></i>
            <span class="text-truncate"></span>
          </div>

          <div class="d-flex align-items-center gap-2 text-muted small mb-3">
            <i class="bi bi-calendar"></i>
            <span>{{ order.dataCriacao | date : 'dd/MM/yyyy' }}</span>
          </div>

          <div class="mb-3">
            <p class="small text-muted mb-1">Problema:</p>
            <p class="small mb-0 text-break line-clamp-2">
              {{ order.descricaoProblema }}
            </p>
          </div>
        </div>

        <!-- Botão alinhado na base -->
        <div class="mt-auto">
          <!-- mt-auto empurra o botão para baixo -->
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
  client: Cliente[] = [];
  aparelho: Aparelho[] = [];
  marcas: Marca[] = [];
  modelos: Modelo[] = [];

  constructor(
    private clienteService: ClienteService,
    private aparelhoService: AparelhoService,
    private marcaService: MarcaService,
    private modeloService: ModeloService
  ) {}

  ngOnInit(): void {
    this.getClientes();

    // this.aparelhoService.listar().subscribe({
    //   next: (data) => {
    //     this.aparelho = data;
    //   },
    //   error: (err) => {
    //     console.error('Erro ao carregar aparelhos', err);
    //   },
    // });

    this.marcaService.getMarcas().subscribe({
      next: (data) => {
        this.marcas = data;
      },
      error: (err) => {
        console.error('Erro ao carregar marcas', err);
      },
    });

    // this.modeloService.getModelos().subscribe({
    //   next: (data) => {
    //     this.modelos = data;
    //   },
    //   error: (err) => {
    //     console.error('Erro ao carregar modelos', err);
    //   },
    // });
  }
  @Input() order!: OrdemServico;
  @Output() onViewDetails = new EventEmitter<OrdemServico>();

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'bg-warning text-warning-foreground';
      case 'em_andamento':
        return 'bg-info text-info-foreground';
      case 'concluído':
        return 'bg-success text-success-foreground';
      case 'cancelado':
        return 'bg-danger text-danger-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  }

  getClientes() : void{
    this.clienteService.obterTodos().subscribe({ // Ou this.clienteService.obterTodos() se você mudou a chamada no card
  next: (data: Cliente[]) => {
    this.client = data; // Atribui os clientes carregados à propriedade do componente
    // this.isLoadingClientes = false;
    console.log('Clientes carregados para o card:', this.client);
  },
  error: (err: any) => {
    console.error('Erro ao carregar clientes para o card:', err);
    // this.toastService.error(err.message || 'Falha ao carregar clientes para o card.'); // Exemplo com ToastService
    // this.isLoadingClientes = false;
  }
});
  }

  getNomeClienteById(id: number): string {
    const cliente = this.client.find((c) => c.id === id);
    return cliente ? cliente.nomeCompleto : 'Cliente Desconhecido';
  }
  // getNomeMarca(idAparelho: number): string {
  //   const aparelho = this.aparelho.find((a) => a.id === idAparelho);
  //   const marca = this.marcas.find((m) => m.id === aparelho!.id_marca);
  //   return marca ? marca.nome : 'Desconhecida';
  // }

  // getNomeModelo(idAparelho: number): string {
  //   const aparelho = this.aparelho.find((a) => a.id === idAparelho);
  //   const modelo = this.modelos.find((m) => m.id === aparelho?.id_modelo);
  //   return modelo ? modelo.nome : 'Desconhecido';
  // }
  formatStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'Pendente';
      case 'em_andamento':
        return 'Em Andamento';
      case 'Concluído':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  }
}
