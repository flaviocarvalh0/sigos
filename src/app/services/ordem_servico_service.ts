// src/app/services/service-order.service.ts
import { Injectable } from '@angular/core';
import { of, Observable, delay } from 'rxjs';
import { OrdemServico } from '../Models/ordem_servico.model';

@Injectable({
  providedIn: 'root',
})
export class OrdemServicoService {
  private mockOrders: OrdemServico[] = [
    {
      id: 1,
      codigo: 'OS-2024-001',
      status: 'pendente',
      valor_total: 350.0,
      data_retirada: null,
      data_execucao: null,
      data_conclusao: null,
      relato_do_problema:
        'Tela quebrada após queda. Touch funcionando parcialmente.',
      relato_tecnico: null,
      observacoes: 'Cliente solicitou orçamento antes de aprovar serviço',
      data_expiracao_garantia: new Date('2024-07-15'),
      data_criacao: new Date('2024-01-15'),
      id_prazo_garantia: 1,
      id_cliente: 1,
      id_aparelho: 1,
      id_empresa: 1,
      id_usuario_criador: 1,
      id_usuario_modificador: 1,
      data_modificacao: new Date('2024-01-15'),
      cliente_nome: 'João Silva',
      aparelho_descricao: 'iPhone 13 Pro',
      empresa_nome: 'Tech Repair Center',
    },
    {
      id: 2,
      codigo: 'OS-2024-002',
      status: 'em_andamento',
      valor_total: 180.0,
      data_retirada: new Date('2024-01-16'),
      data_execucao: new Date('2024-01-17'),
      data_conclusao: null,
      relato_do_problema: 'Bateria não carrega mais. Aparelho desliga sozinho.',
      relato_tecnico: 'Bateria apresentou defeito. Substituição realizada.',
      observacoes: 'Aguardando peça adicional',
      data_expiracao_garantia: new Date('2024-08-14'),
      data_criacao: new Date('2024-01-14'),
      id_prazo_garantia: 1,
      id_cliente: 2,
      id_aparelho: 2,
      id_empresa: 1,
      id_usuario_criador: 2,
      id_usuario_modificador: 2,
      data_modificacao: new Date('2024-01-17'),
      cliente_nome: 'Maria Santos',
      aparelho_descricao: 'Samsung Galaxy S21',
      empresa_nome: 'Tech Repair Center',
    },
    {
      id: 3,
      codigo: 'OS-2024-003',
      status: 'concluido',
      valor_total: 120.0,
      data_retirada: new Date('2024-01-18'),
      data_execucao: new Date('2024-01-18'),
      data_conclusao: new Date('2024-01-19'),
      relato_do_problema: 'Alto-falante sem áudio. Microfone funcionando.',
      relato_tecnico:
        'Alto-falante substituído. Testes realizados com sucesso.',
      observacoes: 'Cliente já retirou o aparelho',
      data_expiracao_garantia: new Date('2024-07-19'),
      data_criacao: new Date('2024-01-13'),
      id_prazo_garantia: 1,
      id_cliente: 3,
      id_aparelho: 3,
      id_empresa: 1,
      id_usuario_criador: 1,
      id_usuario_modificador: 1,
      data_modificacao: new Date('2024-01-19'),
      cliente_nome: 'Pedro Costa',
      aparelho_descricao: 'Xiaomi Redmi Note 10',
      empresa_nome: 'Tech Repair Center',
    },
  ];

  constructor() {}

  // Método para obter todas as ordens de serviço
  getAllOrders(): Observable<OrdemServico[]> {
    return of(this.mockOrders).pipe(delay(500));
  }

  // Método para filtrar ordens de serviço
  getFilteredOrders(filters: any): Observable<OrdemServico[]> {
    let filtered = [...this.mockOrders];

    // Filtro por busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.codigo.toLowerCase().includes(searchTerm) ||
          (order.cliente_nome &&
            order.cliente_nome.toLowerCase().includes(searchTerm)) ||
          order.relato_do_problema.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por status
    if (filters.status && filters.status !== 'todos') {
      filtered = filtered.filter((order) => order.status === filters.status);
    }

    // Filtro por período
    if (filters.dateRange && filters.dateRange !== 'todos') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.data_criacao);
        orderDate.setHours(0, 0, 0, 0);

        switch (filters.dateRange) {
          case 'hoje':
            return orderDate.getTime() === today.getTime();
          case 'semana':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return orderDate >= startOfWeek;
          case 'mes':
            return (
              orderDate.getMonth() === today.getMonth() &&
              orderDate.getFullYear() === today.getFullYear()
            );
          case 'trimestre':
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(today.getMonth() - 3);
            return orderDate >= threeMonthsAgo;
          default:
            return true;
        }
      });
    }

    return of(filtered).pipe(delay(300));
  }

  // Método para obter uma ordem por ID
  getOrderById(id: number): Observable<OrdemServico | undefined> {
    const order = this.mockOrders.find((o) => o.id === id);
    return of(order).pipe(delay(200));
  }

  // Método para criar uma nova ordem
  createOrder(order: Omit<OrdemServico, 'id'>): Observable<OrdemServico> {
    const newOrder: OrdemServico = {
      ...order,
      id: this.mockOrders.length + 1,
      data_criacao: new Date(),
      data_modificacao: new Date(),
    };
    this.mockOrders.push(newOrder);
    return of(newOrder).pipe(delay(500));
  }

  // Método para atualizar uma ordem
  updateOrder(
    id: number,
    updates: Partial<OrdemServico>
  ): Observable<OrdemServico | null> {
    const index = this.mockOrders.findIndex((o) => o.id === id);
    if (index !== -1) {
      this.mockOrders[index] = {
        ...this.mockOrders[index],
        ...updates,
        data_modificacao: new Date(),
      };
      return of(this.mockOrders[index]).pipe(delay(500));
    }
    return of(null);
  }

  // Método para obter métricas/resumo
  getMetrics(): Observable<any> {
    const total = this.mockOrders.length;
    const pending = this.mockOrders.filter(
      (o) => o.status === 'pendente'
    ).length;
    const inProgress = this.mockOrders.filter(
      (o) => o.status === 'em_andamento'
    ).length;
    const completed = this.mockOrders.filter(
      (o) => o.status === 'concluido'
    ).length;
    const revenue = this.mockOrders.reduce(
      (sum, order) => sum + order.valor_total,
      0
    );

    return of({
      totalOrders: total.toString(),
      pendingOrders: pending.toString(),
      inProgressOrders: inProgress.toString(),
      completedOrders: completed.toString(),
      revenue: `R$ ${revenue.toFixed(2)}`,
    }).pipe(delay(300));
  }
}
