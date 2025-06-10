import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricCardComponent } from '../metric-card/metric-card.component';
import { OrderFiltersComponent } from '../order-filters/order-filters.component';
import { ServiceOrderCardComponent } from '../service-order-card/service-order-card.component';
import { OrdemServicoService } from '../../../services/ordem-servico/ordem-servico.service';
import { OrdemServico } from '../../../Models/ordem-servico/ordem-servico.model';

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

  constructor(private serviceOrderService: OrdemServicoService, private router: Router) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }


getRecentOrders(orders: OrdemServico[]): OrdemServico[] {
    return [...orders].sort((a, b) =>
        new Date(b.dataCriacao ?? 0).getTime() - new Date(a.dataCriacao ?? 0).getTime()
      ).slice(0, 6);
  }

  calculateMetrics(orders: OrdemServico[]): void {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todayISO = this.formatDate(today);
    const yesterdayISO = this.formatDate(yesterday);

    // Ordens concluídas hoje
    const completedToday = orders.filter(o =>
      o.nomeEstado!.toLocaleLowerCase() === 'concluído' &&
      o.dataConclusao &&
      this.formatDate(new Date(o.dataConclusao)) === todayISO
    ).length;

    // Ordens concluídas ontem
    const completedYesterday = orders.filter(o =>
      o.nomeEstado!.toLocaleLowerCase() === 'concluído' &&
      o.dataConclusao &&
      this.formatDate(new Date(o.dataConclusao)) === yesterdayISO
    ).length;


    // Cálculo da variação percentual deste mês
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const thisMonthOrders = orders.filter(o => {
      if (!o.dataCriacao) return false;
      const date = new Date(o.dataCriacao);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const lastMonthOrders = orders.filter(o => {
      if (!o.dataCriacao) return false;
      const date = new Date(o.dataCriacao);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === lastMonth && date.getFullYear() === year;
    }).length;

    const changePercent = lastMonthOrders > 0
      ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : thisMonthOrders > 0 ? 100 : 0;

    const totalPendentes = orders.filter(o => o.nomeEstado!!.toLocaleLowerCase() === 'pendente').length;

    this.metrics = {
      totalOrders: orders.length.toString(),
      pendingOrders: orders.filter(o => o.nomeEstado!!.toLocaleLowerCase() === 'pendente').length.toString(),
      completedToday: completedToday.toString(),
      changeTotal: changePercent >= 0 ? `+${changePercent}% este mês` : `${changePercent}% este mês`,
      changeTotalType: changePercent >= 0 ? 'positive' : 'negative',
      changeTotalTypePeding: totalPendentes == 0 ? '' : 'Nenhuma Pendente',
      changeCompleted: completedYesterday > 0
        ? `+${completedToday - completedYesterday} desde ontem`
        : 'Nenhuma ontem',
      changeCompletedType: completedYesterday > 0
        ? (completedToday >= completedYesterday ? 'positive' : 'negative')
        : 'neutral'
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

    this.serviceOrderService.obterTodos().subscribe({
      next: (orders) => {
        this.allOrders = orders.sort((a, b) =>
          new Date(b.dataCriacao ?? 0).getTime() - new Date(a.dataCriacao ?? 0).getTime()
        );
        this.applyFilters(true); // Aplica o filtro inicial de "recentes"
        this.calculateMetrics(this.allOrders);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar ordens:', err);
        this.isLoading = false;
      }
    });
  }

  handleFilterChange(filters: any): void {
    this.currentFilters = filters;
    this.pageTitle = 'Resultados do Filtro';
    this.applyFilters();
  }

  // MÉTODO applyFilters COMPLETAMENTE REESCRITO
  applyFilters(initialLoad = false): void {
    this.isLoading = true;
    let results = [...this.allOrders];
    const filters = this.currentFilters;

    // Filtro por termo de busca (search)
    if (filters.search) {
      const termo = filters.search.toLowerCase();
      results = results.filter(order =>
        order.codigo?.toLowerCase().includes(termo) ||
        order.nomeCliente?.toLowerCase().includes(termo) ||
        order.descricaoProblema?.toLowerCase().includes(termo)
      );
    }

    // Filtro por Status
    if (filters.status && filters.status !== 'todos') {
      // O valor do filtro é "em_andamento", mas o nome no objeto é "Em Andamento"
      const statusFormatado = filters.status.replace('_', ' ');
      results = results.filter(order =>
        order.nomeEstado?.toLowerCase() === statusFormatado.toLowerCase()
      );
    }

    // Filtro por Período de Data (dateRange)
    if (filters.dateRange && filters.dateRange !== 'todos') {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zera a hora para comparações de dia

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

    // Lógica para mostrar apenas recentes na carga inicial
    if (initialLoad) {
      this.filteredOrders = results.slice(0, 6);
    } else {
      this.filteredOrders = results;
    }

    this.isLoading = false;
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
