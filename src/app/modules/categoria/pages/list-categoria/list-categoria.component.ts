import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CategoriaService } from '../../../../services/categoria.service';
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { Categoria } from '../../../../Models/categoria.model';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { CommonModule } from '@angular/common';
import { ListagemDinamicaComponent } from '../../../../shared/components/listagem-dinamica/listagem-dinamica.component';
import { ModalService } from '../../../../services/dialog.service';
import { FormCategoriaComponent } from '../form-categoria/form-categoria.component';

@Component({
  selector: 'app-list-categoria',
  standalone: true,
  imports: [CommonModule, ListagemDinamicaComponent],
  template: `
    <app-listagem-dinamica
      titulo="Categorias"
      [dados]="categorias"
      [colunas]="colunas"
      [carregando]="isLoading"
      (criarNovo)="abrirModalParaCriar()"
      (editar)="editarCategoria($event)"
      (excluir)="excluirCategoria($event)">
    </app-listagem-dinamica>
  `,
  styleUrls: ['./list-categoria.component.css']
})
export class ListCategoriaComponent implements OnInit, OnDestroy {
  categorias: Categoria[] = [];
  isLoading = false;
  private subscriptions = new Subscription();

  colunas = [
    { campo: 'id', titulo: 'ID', tipo: 'texto' as const, ordenavel: true, filtro: true, largura: '80px' },
    { campo: 'nome', titulo: 'Nome', tipo: 'texto' as const, ordenavel: true, filtro: true },
    { campo: 'criadoPor', titulo: 'Criado por', tipo: 'texto' as const, filtro: true },
    { campo: 'dataCriacao', titulo: 'Criado em', tipo: 'dataHora' as const, ordenavel: true },
    { campo: 'modificadoPor', titulo: 'Modificado por', tipo: 'texto' as const, filtro: true },
    { campo: 'dataModificacao', titulo: 'Atualizado em', tipo: 'dataHora' as const, ordenavel: true }
  ];

  constructor(
    private categoriaService: CategoriaService,
    private toast: ToastService,
    private confirmation: ConfirmationService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.carregarCategorias();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarCategorias(): void {
    this.isLoading = true;
    const sub = this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        this.isLoading = false;
      },
      error: () => {
        this.toast.error('Erro ao carregar categorias.');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  abrirModalParaCriar(): void {
    this.modalService.open(FormCategoriaComponent).then(result => {
      if (result === 'salvo') {
        this.carregarCategorias();
      }
    });
  }

  editarCategoria(id: number): void {
    this.modalService.open(FormCategoriaComponent, {
      categoriaIdParaEditar: id
    }).then(result => {
      if (result === 'salvo' || result === 'excluido') {
        this.carregarCategorias();
      }
    });
  }

  excluirCategoria(id: number): void {
    const categoria = this.categorias.find(c => c.id === id);
    const nome = categoria?.nome || `Categoria ID ${id}`;

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a categoria "${nome}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Cancelar'
    };

    const confirmSub = this.confirmation.confirm(config).subscribe(confirmed => {
      confirmSub.unsubscribe();

      if (!confirmed) return;

      this.isLoading = true;
      const deleteSub = this.categoriaService.remover(id).subscribe({
        next: () => {
          this.toast.success(`Categoria "${nome}" excluída com sucesso!`);
          this.carregarCategorias();
        },
        error: (err) => {
          if (err.message?.includes('404') || err.message?.toLowerCase().includes('não encontrada')) {
            this.toast.warning(`Categoria "${nome}" já foi excluída ou não existe.`);
          } else if (err.message?.includes('constraint') || err.message?.includes('relacionada')) {
            this.toast.error(`A categoria "${nome}" não pode ser excluída pois está relacionada a outros registros.`);
          } else {
            this.toast.error(err.message || `Erro ao remover categoria "${nome}".`);
          }
          this.isLoading = false;
        }
      });
      this.subscriptions.add(deleteSub);
    });

    this.subscriptions.add(confirmSub);
  }
}
