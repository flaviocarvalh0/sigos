// src/app/features/marca/pages/list-marca/list-marca.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { MarcaService } from '../../../../services/marca.service';
import { Marca } from '../../../../Models/marca.model';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';

@Component({
  selector: 'app-list-marca',
  templateUrl: './list-marca.component.html',
  styleUrls: ['./list-marca.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ]
})
export class ListMarcaComponent implements OnInit, OnDestroy {
  marcas: Marca[] = [];
  marcasFiltradas: Marca[] = [];
  isLoading = false;

  // Filtros
  filtroNome: string = '';
  filtroId: string = ''; // Novo filtro por ID

  // Ordenação
  sortColumn: keyof Marca | 'id' | 'nome' = 'nome'; // Coluna atual para ordenação (default: nome)
                                             // Usando string literal union para colunas conhecidas
  sortDirection: 'asc' | 'desc' = 'asc'; // Direção da ordenação

  private subscriptions = new Subscription();

  constructor(
    private marcaService: MarcaService,
    private router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.carregarListaMarcas();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarListaMarcas(): void {
    this.isLoading = true;
    const sub = this.marcaService.getMarcas().subscribe({ // getMarcas() chama obterTodos()
      next: (data: Marca[]) => {
        this.marcas = data;
        // Não precisa ordenar aqui, aplicarFiltros fará isso com base no estado atual de sortColumn/sortDirection
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Erro ao carregar marcas', err);
        this.toastService.error(err.message || 'Falha ao carregar lista de marcas.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  aplicarFiltros(): void {
    let resultadoFiltrado = [...this.marcas];

    // 1. Filtro por ID (se preenchido, tem prioridade e resultado é único ou vazio)
    if (this.filtroId.trim()) {
      const idNumerico = parseInt(this.filtroId.trim(), 10);
      if (!isNaN(idNumerico)) {
        const marcaEncontrada = this.marcas.find(m => m.id === idNumerico);
        resultadoFiltrado = marcaEncontrada ? [marcaEncontrada] : [];
      } else {
        // ID inválido, retorna lista vazia para o filtro de ID
        resultadoFiltrado = [];
      }
    } else {
      // 2. Se não filtrou por ID, aplica filtro por Nome
      if (this.filtroNome.trim()) {
        const filtro = this.filtroNome.toLowerCase().trim();
        resultadoFiltrado = resultadoFiltrado.filter(marca =>
          marca.nome.toLowerCase().includes(filtro)
        );
      }
    }

    // 3. Aplicar Ordenação
    if (this.sortColumn) {
      resultadoFiltrado.sort((a, b) => {
        const valA = a[this.sortColumn];
        const valB = b[this.sortColumn];

        let comparison = 0;
        if (valA === null || valA === undefined) comparison = -1;
        else if (valB === null || valB === undefined) comparison = 1;
        else if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else {
          if (valA > valB) comparison = 1;
          else if (valA < valB) comparison = -1;
        }
        return this.sortDirection === 'asc' ? comparison : comparison * -1;
      });
    }

    this.marcasFiltradas = resultadoFiltrado;
  }

  limparFiltros(): void {
    this.filtroNome = '';
    this.filtroId = ''; // Limpa filtro de ID
    // Opcional: Resetar ordenação para o padrão ou manter a atual
    // this.sortColumn = 'nome';
    // this.sortDirection = 'asc';
    this.aplicarFiltros();
  }

  // Método para mudar a ordenação
  onSort(column: keyof Marca | 'id' | 'nome'): void {
    if (this.sortColumn === column) {
      // Inverte a direção se for a mesma coluna
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Muda para a nova coluna e define direção ascendente como padrão
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.aplicarFiltros(); // Reaplica filtros e ordenação
  }

  // Método para ser chamado no (input) do filtroId se quiser busca "ao digitar" para ID
  onIdFilterChange(): void {
    // Se o campo ID for limpo e outros filtros estiverem ativos, eles devem ser reaplicados
    // Se o ID for preenchido, aplicarFiltros já dará prioridade a ele.
    this.aplicarFiltros();
  }


  navegarParaNovaMarca(): void {
    this.router.navigate(['/marca/form']);
  }

  editarMarca(id: number | undefined): void {
    if (id === undefined) {
      this.toastService.warning('ID da marca inválido para edição.');
      return;
    }
    this.router.navigate(['/marca/form', id]);
  }

  excluirMarca(id: number | undefined, nomeMarca: string | undefined): void {
    if (id === undefined) {
      this.toastService.warning('ID da marca inválido para exclusão.');
      return;
    }
    const nomeParaExibicao = nomeMarca || `Marca ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Marca',
      message: `Tem certeza que deseja excluir a marca "${nomeParaExibicao}"? Modelos associados a esta marca podem ser afetados.`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Manter'
    };

    const confirmSub = this.confirmationService.confirm(config).subscribe(confirmado => {
      if (confirmado) {
        this.isLoading = true;
        const deleteSub = this.marcaService.remover(id).subscribe({
          next: () => {
            this.toastService.success(`Marca "${nomeParaExibicao}" excluída com sucesso!`);
            this.carregarListaMarcas(); // Recarrega e aplica filtros/ordenação
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao excluir marca. Verifique se ela não está em uso.');
            this.isLoading = false;
          }
        });
        this.subscriptions.add(deleteSub);
      }
    });
    this.subscriptions.add(confirmSub);
  }
}