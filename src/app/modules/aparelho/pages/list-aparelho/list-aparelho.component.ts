// src/app/features/aparelho/pages/list-aparelho/list-aparelho.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Adicionado OnDestroy
import { CommonModule } from '@angular/common'; // NgFor, NgIf vêm daqui
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Para ngModel dos filtros
import { Subscription } from 'rxjs';

import { Aparelho } from '../../../../Models/aparelho.model';
import { AparelhoService } from '../../../../services/aparelho.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model'; // Ajuste o path se necessário
// NgxMask para exibir IMEI/Num Serie formatados (opcional, mas bom ter)
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';


@Component({
  selector: 'app-list-aparelho',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule, // Adicionado para filtros
    NgxMaskDirective, // Opcional: para máscaras
    NgxMaskPipe      // Opcional: para máscaras
  ],
  providers: [provideNgxMask()], // Opcional: se usar NgxMask
  templateUrl: './list-aparelho.component.html',
  styleUrls: ['./list-aparelho.component.css'] // Corrigido styleUrl para styleUrls
})
export class ListAparelhoComponent implements OnInit, OnDestroy {
  aparelhos: Aparelho[] = [];
  aparelhosFiltrados: Aparelho[] = [];
  isLoading = false; // Flag única de carregamento

  // Propriedades para filtros (exemplo)
  filtroDescricao: string = '';
  filtroImeiOuSerie: string = '';
  filtroClienteNome: string = '';
  // Você pode adicionar mais filtros conforme necessário (ex: por marca, modelo)

  private subscriptions = new Subscription();

  constructor(
    private aparelhoService: AparelhoService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
    // ClienteService, MarcaService, ModeloService não são mais necessários aqui
    // se Aparelho já vem com nomeCliente, nomeMarca, nomeModelo
  ) {}

  ngOnInit(): void {
    this.carregarListaAparelhos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarListaAparelhos(): void {
    this.isLoading = true;
    const sub = this.aparelhoService.obterTodos().subscribe({
      next: data => {
        // Ordenar por ID ou outro critério, se desejado
        this.aparelhos = data.sort((a, b) => a.id - b.id);
        this.aplicarFiltros(); // Aplica filtros (que inicialmente mostrarão todos)
        this.isLoading = false;
      },
      error: err => {
        console.error('Erro ao carregar aparelhos', err);
        this.toastService.error(err.message || 'Falha ao carregar lista de aparelhos.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  aplicarFiltros(): void {
    let resultadoFiltrado = [...this.aparelhos];

    if (this.filtroDescricao.trim()) {
      const filtro = this.filtroDescricao.toLowerCase().trim();
      resultadoFiltrado = resultadoFiltrado.filter(ap =>
        ap.descricaoAuxiliar?.toLowerCase().includes(filtro) ||
        ap.cor?.toLowerCase().includes(filtro) ||
        ap.observacoes?.toLowerCase().includes(filtro)
      );
    }

    if (this.filtroImeiOuSerie.trim()) {
      const filtro = this.filtroImeiOuSerie.toLowerCase().trim();
      resultadoFiltrado = resultadoFiltrado.filter(ap =>
        ap.imei1?.toLowerCase().includes(filtro) ||
        ap.imei2?.toLowerCase().includes(filtro) ||
        ap.numeroSerie?.toLowerCase().includes(filtro)
      );
    }

    if (this.filtroClienteNome.trim()) {
      const filtro = this.filtroClienteNome.toLowerCase().trim();
      resultadoFiltrado = resultadoFiltrado.filter(ap =>
        ap.nomeCliente?.toLowerCase().includes(filtro)
      );
    }
    // Adicionar mais lógicas de filtro aqui (ex: por marcaId, modeloId se tiver selects para isso)

    this.aparelhosFiltrados = resultadoFiltrado;
  }

  limparFiltros(): void {
    this.filtroDescricao = '';
    this.filtroImeiOuSerie = '';
    this.filtroClienteNome = '';
    this.aplicarFiltros();
  }

  // Os métodos getNomeMarca, getNomeModelo, getNomeCliente não são mais necessários
  // se o template acessar diretamente aparelho.nomeMarca, etc.

  editarAparelho(id: number | undefined): void { // Corrigido nome e parâmetro
    if (id !== undefined) {
      this.router.navigate(['/aparelho/form', id]);
    } else {
      this.toastService.warning('ID do aparelho inválido para edição.');
    }
  }

  navegarParaNovoAparelho(): void { // Nome mais descritivo
    this.router.navigate(['/aparelho/form']);
  }

  excluirAparelho(id: number | undefined, descricao: string | undefined | null): void { // Assumindo que 'descricao' pode ser descricaoAuxiliar ou imei
    if (id === undefined) {
      this.toastService.warning('ID do aparelho inválido para exclusão.');
      return;
    }

    const nomeParaExibicao = descricao || `Aparelho ID ${id}`;

    const config: ConfirmationConfig = {
      // Adapte os campos de ConfirmationConfig conforme sua definição
      title: 'Confirmar Exclusão de Aparelho',
      message: `Tem certeza que deseja excluir o aparelho "${nomeParaExibicao}"? Esta ação não pode ser desfeita.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true; // Pode ativar um loading específico para a linha ou global
        const deleteSub = this.aparelhoService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Aparelho "${nomeParaExibicao}" excluído com sucesso!`);
            this.carregarListaAparelhos(); // Recarrega a lista para refletir a exclusão
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir aparelho.');
            this.isLoading = false;
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }

}