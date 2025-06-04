import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Cliente } from '../../../../Models/cliente.model';
import { ClienteService } from '../../../../services/cliente.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ListagemDinamicaComponent
  ],
  template: `
    <app-listagem-dinamica
      titulo="Clientes"
      [dados]="clientes"
      [colunas]="colunas"
      [carregando]="isLoading"
      (criarNovo)="navegarParaNovoCliente()"
      (editar)="editarCliente($event)"
      (excluir)="excluirCliente($event)">
    </app-listagem-dinamica>
  `,
  styleUrls: ['./lista-clientes.component.css'],
})
export class ListaClienteComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true, largura: '70px' },
    { campo: 'nomeCompleto', titulo: 'Nome', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'cpf', titulo: 'CPF', tipo: 'texto' as const, filtro: true },
    { campo: 'cnpj', titulo: 'CNPJ', tipo: 'texto' as const, filtro: true },
    { campo: 'telefone', titulo: 'Telefone', tipo: 'texto' as const, filtro: false },
    { campo: 'email', titulo: 'E-mail', tipo: 'texto' as const, filtro: false },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'data' as const, ordenavel: true },
    { campo: 'dataModificacao', titulo: 'Modificado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarClientes(): void {
    this.isLoading = true;
    const sub = this.clienteService.obterTodos().subscribe({
      next: (data) => {
        this.clientes = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error(err.message || 'Falha ao carregar clientes.');
        this.isLoading = false;
      },
    });
    this.subscriptions.add(sub);
  }

  navegarParaNovoCliente(): void {
    this.router.navigate(['/cliente/form']);
  }

  editarCliente(id: number | undefined): void {
    if (id !== undefined) {
      this.router.navigate(['/cliente/form', id]);
    } else {
      this.toastService.warning('ID do cliente inválido para edição.');
    }
  }

  excluirCliente(id: number): void {
    if (!id) {
      this.toastService.warning('ID do cliente inválido para exclusão.');
      return;
    }
    const cliente = this.clientes.find(c => c.id === id);
    const nome = cliente?.nomeCompleto || `Cliente ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Cliente',
      message: `Tem certeza que deseja excluir o cliente "${nome}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter',
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        const deleteSub = this.clienteService.remover(id!).subscribe({
          next: () => {
            this.toastService.success(`Cliente "${nome}" excluído com sucesso!`);
            this.carregarClientes();
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir cliente.');
            this.isLoading = false;
          },
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }
}
