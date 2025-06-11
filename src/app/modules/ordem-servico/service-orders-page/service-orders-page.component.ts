import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricCardComponent } from '../metric-card/metric-card.component';
import { OrderFiltersComponent } from '../order-filters/order-filters.component';
import { ServiceOrderCardComponent } from '../service-order-card/service-order-card.component';
import { OrdemServicoService } from '../../../services/ordem-servico/ordem-servico.service';
import { OrdemServico } from '../../../Models/ordem-servico/ordem-servico.model';
import { EstadoSelecao } from '../../../Models/workflow/workflow-estado.model';
import { WorkflowEstadoService } from '../../../services/workflow/workflow-estado.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-ordem-servico',
  standalone: true,
  imports: [
    CommonModule,
    MetricCardComponent,
    OrderFiltersComponent,
    ServiceOrderCardComponent
  ],
  templateUrl: './service-orders-page.component.html',
  styleUrls: ['./service-orders-page.component.css']
})
export class OrdemServicoComponent implements OnInit {
  filteredOrders: OrdemServico[] = [];
  allOrders: OrdemServico[] = [];
  metrics: any = {};
  isLoading: boolean = true;
  currentFilters: any = { search: '', status: 'todos', dateRange: 'todos' };
  showingAll: boolean = false;
  pageTitle: string = 'Ordens Recentes';
  statusOptions: EstadoSelecao[] = [];

  constructor(private serviceOrderService: OrdemServicoService, private workflowEstadoService: WorkflowEstadoService ,private router: Router) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

   // MÉTODO formatDate CORRIGIDO para respeitar o fuso horário local
  private formatDate(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() é base 0 (janeiro = 0)
    const day = date.getDate();

    return `${year}-${pad(month)}-${pad(day)}`;
  }


getRecentOrders(orders: OrdemServico[]): OrdemServico[] {
    return [...orders].sort((a, b) =>
        new Date(b.dataCriacao ?? 0).getTime() - new Date(a.dataCriacao ?? 0).getTime()
      ).slice(0, 6);
  }

  calculateMetrics(orders: OrdemServico[]): void {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const estadosPendentes = ['recebida', 'em análise', 'aguardando aprovação', 'aprovada', 'em execução', 'pausada', 'reaberta'];
    const estadosConcluidos = ['finalizada', 'entregue'];

    let completedToday = 0;
    let completedYesterday = 0;

    for (const order of orders) {
      const nomeEstado = order.nomeEstado?.toLowerCase() || '';

      if (estadosConcluidos.includes(nomeEstado) && order.dataConclusao) {
        // Converte a data da OS para um objeto Date local
        const dataConclusao = new Date(order.dataConclusao);

        // Compara ano, mês e dia no fuso horário LOCAL do usuário
        if (dataConclusao.getFullYear() === today.getFullYear() &&
            dataConclusao.getMonth() === today.getMonth() &&
            dataConclusao.getDate() === today.getDate()) {
          completedToday++;
        }

        if (dataConclusao.getFullYear() === yesterday.getFullYear() &&
            dataConclusao.getMonth() === yesterday.getMonth() &&
            dataConclusao.getDate() === yesterday.getDate()) {
          completedYesterday++;
        }
      }
    }

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => estadosPendentes.includes(o.nomeEstado?.toLowerCase() || '')).length;
    const changeCompleted = completedToday - completedYesterday;

    this.metrics = {
      totalOrders: totalOrders.toString(),
      pendingOrders: pendingOrders.toString(),
      completedToday: completedToday.toString(),
      changeTotal: `Total de ${totalOrders} ordens no sistema`,
      changeTotalType: 'neutral',
      changeCompleted: changeCompleted === 0 ? 'Nenhuma variação' : (changeCompleted > 0 ? `+${changeCompleted} desde ontem` : `${changeCompleted} desde ontem`),
      changeCompletedType: changeCompleted === 0 ? 'neutral' : (changeCompleted > 0 ? 'positive' : 'negative'),
    };
  }

   loadOrders(filters: any): void {
    this.isLoading = true;
    this.currentFilters = filters;
    this.pageTitle = 'Resultados do Filtro';

    // Assumindo que seu service.obterTodos() aceita filtros
    this.serviceOrderService.obterTodos(filters).subscribe({
      next: (orders) => {
        // CORREÇÃO: Não limita mais aos recentes, mostra todos os resultados do filtro
        this.filteredOrders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar ordens filtradas:', err);
        this.isLoading = false;
      }
    });
  }


  loadInitialData(): void {
    this.isLoading = true;
    this.pageTitle = 'Ordens Recentes';

    forkJoin({
      orders: this.serviceOrderService.obterTodos(),
      statusList: this.workflowEstadoService.obterParaSelecao(),
    }).subscribe({
      next: ({ orders, statusList }) => {
        this.allOrders = orders.sort((a, b) => new Date(b.dataCriacao ?? 0).getTime() - new Date(a.dataCriacao ?? 0).getTime());
        this.statusOptions = statusList;

        this.applyFilters(true);
        this.calculateMetrics(this.allOrders);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar dados iniciais:', err);
        this.isLoading = false;
      }
    });
  }

  handleFilterChange(filters: any): void {
    this.currentFilters = filters;
    this.pageTitle = 'Resultados do Filtro';
    this.applyFilters();
  }

  applyFilters(initialLoad = false): void {
       this.isLoading = true;
    let results = [...this.allOrders];
    const filters = this.currentFilters;

    // Filtro por termo de busca
    if (filters.search) {
      const termo = filters.search.toLowerCase();
      results = results.filter(order =>
        order.codigo?.toLowerCase().includes(termo) ||
        order.nomeCliente?.toLowerCase().includes(termo) ||
        order.descricaoProblema?.toLowerCase().includes(termo)
      );
    }

    if (filters.statusId) {
      results = results.filter(order => order.idEstado === filters.statusId);
    }


    // Filtro por Período de Data (dateRange)
    if (filters.dateRange && filters.dateRange !== 'todos') {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      let dataInicioFiltro: Date | null = null;

      switch (filters.dateRange) {
        case 'hoje':
          dataInicioFiltro = hoje;
          break;
        case 'semana':
          dataInicioFiltro = new Date(hoje);
          dataInicioFiltro.setDate(hoje.getDate() - 7);
          break;
        case 'mes':
          dataInicioFiltro = new Date(hoje);
          dataInicioFiltro.setMonth(hoje.getMonth() - 1);
          break;
        case 'trimestre':
            dataInicioFiltro = new Date(hoje);
            dataInicioFiltro.setMonth(hoje.getMonth() - 3);
            break;
      }

      if (dataInicioFiltro) {
        results = results.filter(order => {
          if (!order.dataCriacao) return false;
          return new Date(order.dataCriacao) >= dataInicioFiltro!;
        });
      }
    }

    // Pequeno delay para melhorar a percepção de carregamento
    setTimeout(() => {
      this.filteredOrders = initialLoad ? results.slice(0, 6) : results;
      this.isLoading = false;
    }, 200);
  }

  loadAllOrders(): void {
    this.pageTitle = 'Todas as Ordens de Serviço';
    this.currentFilters = { search: '', status: 'todos', dateRange: 'todos' };
    this.applyFilters(); // Re-aplica os filtros (agora vazios) para mostrar tudo
  }

  resetFilters(): void {
    this.loadInitialData(); // Volta ao estado inicial da página
    // Aqui você também pode querer emitir um evento para o componente filho limpar seus campos,
    // mas por enquanto, recarregar a página resolve.
  }

  handleViewDetails(order: OrdemServico): void {
    this.router.navigate(['/ordem-servico/form', order.id]);
  }

  novaOrdemServico(): void {
    this.router.navigate(['/ordem-servico/form']);
  }
}
