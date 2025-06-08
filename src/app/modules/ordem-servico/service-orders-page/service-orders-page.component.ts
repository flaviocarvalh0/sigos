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
  currentFilters: any = {};
  showingAll: boolean = false;

  constructor(private serviceOrderService: OrdemServicoService, private router: Router) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadInitialData(): void {
    this.isLoading = true;

    this.serviceOrderService.obterTodos().subscribe({
      next: (orders) => {
        this.allOrders = orders;
        this.filteredOrders = this.getRecentOrders(orders);
        this.calculateMetrics(orders);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar ordens:', err);
        this.isLoading = false;
      }
    });
  }

  getRecentOrders(orders: OrdemServico[]): OrdemServico[] {
    // Retorna as últimas 10 ordens ou todas se tiver menos que 10
    return orders.length > 10
      ? [...orders].sort((a, b) =>
          new Date(b.dataCriacao ?? 0).getTime() - new Date(a.dataCriacao ?? 0).getTime()
        ).slice(0, 10)
      : orders;
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

  loadOrders(filters: any = {}): void {
    this.isLoading = true;
    this.currentFilters = filters;
    this.showingAll = false;

    this.serviceOrderService.obterTodos(filters).subscribe({
      next: (orders) => {
        this.filteredOrders = this.getRecentOrders(orders);
        this.calculateMetrics(orders);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar ordens:', err);
        this.isLoading = false;
      }
    });
  }

  loadAllOrders(): void {
    this.isLoading = true;
    this.showingAll = true;

    this.serviceOrderService.obterTodos().subscribe({
      next: (orders) => {
        this.filteredOrders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar todas as ordens:', err);
        this.isLoading = false;
      }
    });
  }

  handleFilterChange(filters: any): void {
    this.loadOrders(filters);
  }

  resetFilters(): void {
    this.loadOrders({});
  }

  handleViewDetails(order: OrdemServico): void {
    this.router.navigate(['/ordem-servico/form', order.id]);
  }

  novaOrdemServico(): void {
    this.router.navigate(['/ordem-servico/form']);
  }
}
