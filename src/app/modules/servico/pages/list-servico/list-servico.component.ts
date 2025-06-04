// src/app/features/servico/pages/list-servico/list-servico.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Adicionado OnDestroy
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // NgFor, NgIf vêm daqui
import { FormsModule } from '@angular/forms'; // Para [(ngModel)] dos filtros
import { Subscription } from 'rxjs';
// Corrigido para servico.service.ts
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model'; // Ajuste o path se necessário
import { CurrencyPipe } from '@angular/common'; // Para formatar preço
import { Servico } from '../../../../Models/servico.mode';
import { ServicoService } from '../../../../services/servico.service';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';

@Component({
  selector: 'app-list-servico',
  standalone: true,
  template: `
    <app-listagem-dinamica
      titulo="Lista de Serviços"
      [dados]="servicosFiltrados"
      [colunas]="colunas"
      [carregando]="isLoading"
      (editar)="editarServico($event)"
      (excluir)="excluirServico($event)"
      (criarNovo)="navegarParaNovoServico()">
    </app-listagem-dinamica>
  `,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    ListagemDinamicaComponent
  ]
})
export class ListServicoComponent implements OnInit, OnDestroy {
  servicos: Servico[] = [];
  servicosFiltrados: Servico[] = [];
  isLoading = false; // Renomeado de 'carregando' para consistência

  // Filtros
  filtroNome: string = '';
  filtroDescricao: string = '';

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'nome', titulo: 'Nome', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'descricao', titulo: 'Descrição', tipo: 'texto' as const, filtro: true },
    { campo: 'precoPadrao', titulo: 'Valor', tipo: 'moeda' as const, ordenavel: true, filtro: false },
    { campo: 'tempoEstimadoMinutos', titulo: 'Tempo (min)', tipo: 'texto' as const, filtro: false }
  ];

  private subscriptions = new Subscription();

  constructor(
    private servicoService: ServicoService,
    private router: Router,
    private toastService: ToastService, // Injetado
    private confirmationService: ConfirmationService // Injetado
  ) {}

  ngOnInit(): void {
    this.carregarListaServicos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarListaServicos(): void {
    this.isLoading = true;
    const sub = this.servicoService.obterTodos().subscribe({ // Usando obterTodos()
      next: (data) => {
        this.servicos = data.sort((a,b) => a.nome.localeCompare(b.nome)); // Ordena por nome
        this.aplicarFiltros(); // Mostra todos ou filtrados
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar serviços:', err);
        this.toastService.error(err.message || 'Falha ao carregar lista de serviços.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  aplicarFiltros(): void {
    let resultadoFiltrado = [...this.servicos];

    if (this.filtroNome.trim()) {
      const filtro = this.filtroNome.toLowerCase().trim();
      resultadoFiltrado = resultadoFiltrado.filter(s =>
        s.nome.toLowerCase().includes(filtro)
      );
    }

    if (this.filtroDescricao.trim()) {
      const filtro = this.filtroDescricao.toLowerCase().trim();
      resultadoFiltrado = resultadoFiltrado.filter(s =>
        s.descricao?.toLowerCase().includes(filtro)
      );
    }
    this.servicosFiltrados = resultadoFiltrado;
  }

  limparFiltros(): void {
    this.filtroNome = '';
    this.filtroDescricao = '';
    this.aplicarFiltros();
  }

  editarServico(id: number | undefined): void {
    if (id === undefined) {
      this.toastService.warning('ID do serviço inválido para edição.');
      return;
    }
    this.router.navigate(['/servico/form', id]);
  }

  navegarParaNovoServico(): void { // Nome do método atualizado
    this.router.navigate(['/servico/form']);
  }

  excluirServico(id: number | undefined): void { // Assinatura atualizada
    if (id === undefined) {
      this.toastService.warning('ID do serviço inválido para exclusão.');
      return;
    }
      const servico = this.servicos.find(s => s.id === id);
      const nome = servico?.nome || `Serviço ID ${id}`;

    const config: ConfirmationConfig = {
      // Adapte os campos conforme a definição da sua interface ConfirmationConfig
      title: 'Confirmar Exclusão de Serviço',
      message: `Tem certeza que deseja excluir o serviço "${nome}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true; // Pode ser um loading específico para a linha, ou global
        const deleteSub = this.servicoService.remover(id).subscribe({ // Usando remover()
          next: () => {
            this.toastService.success(`Serviço "${nome}" excluído com sucesso!`);
            // Não precisa mais filtrar localmente, carregarListaServicos vai buscar a lista atualizada
            this.carregarListaServicos(); // Recarrega a lista do servidor
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir serviço.');
            this.isLoading = false; // Garante que o loading seja desativado em caso de erro
          }
          // 'complete' não é estritamente necessário aqui se isLoading é resetado em next/error
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }
  // O @ViewChild('toast') e o método exibirToast() foram removidos
}
