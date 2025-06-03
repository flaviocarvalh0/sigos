import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Cliente } from '../../../../Models/cliente.model';
import { ClienteService } from '../../../../services/cliente.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgxMaskDirective,
    NgxMaskPipe,
    FormsModule,
  ],
  providers: [provideNgxMask()],
  templateUrl: './lista-clientes.component.html',
  styleUrls: ['./lista-clientes.component.css'],
})
export class ListaClienteComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  isLoading = false;
  filtroNome: string = '';
  filtroCpfCnpj: string = '';
  filtroId: string = '';

  private subscriptions = new Subscription();

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.isLoading = true;
    const sub = this.clienteService.obterTodos().subscribe({
      next: (data) => {
        this.clientes = data;
        this.clientesFiltrados = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar clientes:', err);
        this.toastService.error(err.message || 'Falha ao carregar clientes.');
        this.isLoading = false;
      },
    });
    this.subscriptions.add(sub);
  }

  aplicarFiltros(): void {
    let resultadoFiltrado = [...this.clientes]; // Começa com todos os clientes

    // 1. Filtro por ID (tem prioridade e retorna resultado único ou vazio)
    if (this.filtroId.trim()) {
      const idNumerico = parseInt(this.filtroId.trim(), 10);
      if (!isNaN(idNumerico)) {
        const clienteEncontrado = this.clientes.find(
          (c) => c.id === idNumerico
        );
        this.clientesFiltrados = clienteEncontrado ? [clienteEncontrado] : [];
        return; // Se filtrou por ID, não aplica outros filtros
      } else {
        // ID fornecido mas não é um número válido, pode mostrar lista vazia ou um aviso
        this.clientesFiltrados = [];
        this.toastService.warning(
          'ID fornecido para filtro não é um número válido.'
        );
        return;
      }
    }

    // 2. Se não filtrou por ID, aplica os outros filtros combinados
    if (this.filtroNome.trim()) {
      resultadoFiltrado = resultadoFiltrado.filter((cliente) =>
        cliente.nomeCompleto
          ?.toLowerCase()
          .includes(this.filtroNome.trim().toLowerCase())
      );
    }

    if (this.filtroCpfCnpj.trim()) {
      const cpfCnpjInput = this.filtroCpfCnpj.trim().replace(/\D/g, '');
      resultadoFiltrado = resultadoFiltrado.filter((cliente) => {
        const cpfMatch = cliente.cpf
          ? cliente.cpf.replace(/\D/g, '').includes(cpfCnpjInput)
          : false;
        const cnpjMatch = cliente.cnpj
          ? cliente.cnpj.replace(/\D/g, '').includes(cpfCnpjInput)
          : false;
        return cpfMatch || cnpjMatch;
      });
    }
    this.clientesFiltrados = resultadoFiltrado;
  }

  limparFiltros(): void {
    this.filtroNome = '';
    this.filtroCpfCnpj = '';
    this.filtroId = ''; // Limpa filtro de ID
    this.aplicarFiltros(); // Reaplica para mostrar todos os clientes
  }

  onIdFilterChange(): void {
    if (!this.filtroId.trim()) {
      // Se o campo ID for limpo, reaplica os outros filtros
      this.aplicarFiltros();
    }
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

  excluirCliente(id: number | undefined, nomeCliente: string): void {
    if (id === undefined) {
      this.toastService.warning('ID do cliente inválido para exclusão.');
      return;
    }

    // TODO: Adicionar verificação se o cliente possui OS ou Aparelhos antes de excluir, se necessário.
    // Esta verificação deve ser feita idealmente no backend ou chamando outros serviços aqui.

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Cliente',
      message: `Tem certeza que deseja excluir o cliente "${nomeCliente}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter',
    };

    const confirmSub = this.confirmationService
      .confirm(config)
      .subscribe((confirmado) => {
        if (confirmado) {
          this.isLoading = true;
          const deleteSub = this.clienteService.remover(id).subscribe({
            next: () => {
              this.toastService.success(
                `Cliente "${nomeCliente}" excluído com sucesso!`
              );
              this.carregarClientes(); // Recarrega a lista
            },
            error: (err) => {
              this.toastService.error(
                err.message || 'Erro ao excluir cliente.'
              );
              this.isLoading = false; // Resetar isLoading em caso de erro na exclusão
            },
          });
          this.subscriptions.add(deleteSub);
        }
      });
    this.subscriptions.add(confirmSub);
  }

  formatarDocumento(cliente: Cliente): string {
    if (cliente.tipoPessoa?.toLowerCase() === 'física' && cliente.cpf) {
      return cliente.cpf; // A máscara será aplicada no template
    } else if (
      cliente.tipoPessoa?.toLowerCase() === 'jurídica' &&
      cliente.cnpj
    ) {
      return cliente.cnpj; // A máscara será aplicada no template
    }
    return '-';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
