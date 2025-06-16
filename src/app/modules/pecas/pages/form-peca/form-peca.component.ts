import { Component, OnInit, OnDestroy, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormularioDinamicoComponent, FormularioDinamicoConfig } from '../../../../shared/components/formulario-dinamico/formulario-dinamico.component';
import { FormLayoutComponent } from '../../../../shared/components/form-layout/form-layout.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PecaService } from '../../../../services/peca.service';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';
import { FornecedorService } from '../../../../services/fornecedor.service';
import { CategoriaService } from '../../../../services/categoria.service';
import { ToastService } from '../../../../services/toast.service';
import { Peca, PecaAtualizacaoPayload, PecaCriacaoPayload } from '../../../../Models/peca.model';

@Component({
  selector: 'app-form-peca',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormLayoutComponent, FormularioDinamicoComponent],
  template: `
    <app-form-layout
      [form]="form"
      [titulo]="config.titulo"
      [isLoading]="isLoading"
      [isEditMode]="isEditando"
      (save)="onSubmit()"
      (cancel)="onCancelar()"
      (delete)="onExcluir()"
    >
      <app-formulario-dinamico
        [form]="form"
        [config]="config"
        [data]="dadosIniciais"
      ></app-formulario-dinamico>
    </app-form-layout>
  `,
  styleUrls: ['./form-peca.component.css'],
})
export class FormPecaComponent implements OnInit, OnDestroy {
  @Input() pecaIdParaEditar?: number;
  close!: (result?: any) => void;

  form!: FormGroup;
  config!: FormularioDinamicoConfig;
  dadosIniciais: any = {};
  isEditando = false;
  isLoading = false;
  private dataModificacaoOriginal?: Date;
  private subscriptions = new Subscription();

  private fb = inject(FormBuilder);
  private pecaService = inject(PecaService);
  private marcaService = inject(MarcaService);
  private modeloService = inject(ModeloService);
  private fornecedorService = inject(FornecedorService);
  private categoriaService = inject(CategoriaService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.inicializarConfig();

    if (this.pecaIdParaEditar) {
      this.isEditando = true;
      this.carregarPeca(this.pecaIdParaEditar);
    }

    this.carregarDropdowns();
    this.inicializarForm();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  inicializarConfig(): void {
    this.config = {
      titulo: this.isEditando ? 'Editar Peça' : 'Cadastrar Peça',
      iconeTitulo: 'bi-tools',
      abas: [
        {
          titulo: '',
          campos: [
            { nome: 'nome', tipo: 'texto', rotulo: 'Nome da Peça', obrigatorio: true, col: 'col-md-6' },
            { nome: 'precoCusto', tipo: 'moeda', rotulo: 'Preço de Custo', obrigatorio: true, col: 'col-md-3' },
            { nome: 'precoVenda', tipo: 'moeda', rotulo: 'Preço de Venda', obrigatorio: true, col: 'col-md-3' },
            { nome: 'localizacaoFisica', tipo: 'texto', rotulo: 'Localização Física', col: 'col-md-6' },
            { nome: 'quantidadeMinimaEstoque', tipo: 'inteiro', rotulo: 'Qtd. Mínima Estoque', col: 'col-md-3' },
            { nome: 'idMarca', tipo: 'select', rotulo: 'Marca', col: 'col-md-6', opcoes: [] },
            { nome: 'idModelo', tipo: 'select', rotulo: 'Modelo', col: 'col-md-6', opcoes: [] },
            { nome: 'idFornecedor', tipo: 'select', rotulo: 'Fornecedor', col: 'col-md-6', opcoes: [] },
            { nome: 'idCategoria', tipo: 'select', rotulo: 'Categoria', col: 'col-md-6', opcoes: [] },
          ],
        },
      ],
    };
  }

  inicializarForm(): void {
    const grupo: any = {};

    this.config.abas.forEach((aba) => {
      aba.campos.forEach((campo) => {
        grupo[campo.nome] = this.fb.control('');
      });
    });

    this.form = this.fb.group(grupo);
  }

  carregarDropdowns(): void {
    this.isLoading = true;
    Promise.all([
      this.marcaService.getMarcas().toPromise(),
      this.modeloService.obterTodos().toPromise(),
      this.fornecedorService.obterTodos().toPromise(),
      this.categoriaService.obterTodos().toPromise(),
    ])
      .then(([marcas, modelos, fornecedores, categorias]) => {
        this.config.abas[0].campos.find((c) => c.nome === 'idMarca')!.opcoes =
          (marcas ?? []).map((m) => ({ id: m.id, nome: m.nome }));
        this.config.abas[0].campos.find((c) => c.nome === 'idModelo')!.opcoes =
          (modelos ?? []).map((m) => ({ id: m.id, nome: m.nome }));
        this.config.abas[0].campos.find((c) => c.nome === 'idFornecedor')!.opcoes =
          (fornecedores ?? []).map((f) => ({ id: f.id, nome: f.nomeFantasia || f.razaoSocial }));
        this.config.abas[0].campos.find((c) => c.nome === 'idCategoria')!.opcoes =
          (categorias ?? []).map((c) => ({ id: c.id, nome: c.nome }));

        this.isLoading = false;
      })
      .catch(() => {
        this.toastService.error('Erro ao carregar dropdowns.');
        this.isLoading = false;
      });
  }

  carregarPeca(id: number): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.pecaService.obterPorId(id).subscribe({
        next: (peca) => {
          if (!peca) {
            this.toastService.error('Peça não encontrada.');
            this.finalizarModal('cancelado');
            return;
          }
          this.dataModificacaoOriginal = peca.dataModificacao;
          this.dadosIniciais = { ...peca };
          this.isLoading = false;
        },
        error: (err) => {
          this.toastService.error(err.message || 'Erro ao carregar peça.');
          this.isLoading = false;
        },
      })
    );
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const payloadBase = {
      nome: formValue.nome,
      precoCusto: Number(formValue.precoCusto),
      precoVenda: Number(formValue.precoVenda),
      localizacaoFisica: formValue.localizacaoFisica,
      quantidadeMinimaEstoque: Number(formValue.quantidadeMinimaEstoque || 0),
      idMarca: Number(formValue.idMarca),
      idModelo: Number(formValue.idModelo),
      idFornecedor: Number(formValue.idFornecedor),
      idCategoria: Number(formValue.idCategoria),
    };

    this.isLoading = true;

    if (this.isEditando && this.pecaIdParaEditar) {
      const payload: PecaAtualizacaoPayload = {
        ...payloadBase,
        id: this.pecaIdParaEditar,
        dataUltimaModificacao: this.dataModificacaoOriginal,
      };

      this.subscriptions.add(
        this.pecaService.atualizar(this.pecaIdParaEditar, payload).subscribe({
          next: () => {
            this.toastService.success('Peça atualizada com sucesso!');
            this.finalizarModal('salvo');
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao atualizar peça.');
            this.isLoading = false;
          },
        })
      );
    } else {
      const payload: PecaCriacaoPayload = payloadBase;

      this.subscriptions.add(
        this.pecaService.criar(payload).subscribe({
          next: () => {
            this.toastService.success('Peça criada com sucesso!');
            this.finalizarModal('salvo');
          },
          error: (err) => {
            this.toastService.error(err.message || 'Erro ao criar peça.');
            this.isLoading = false;
          },
        })
      );
    }
  }

  onExcluir(): void {
    if (!this.pecaIdParaEditar) return;

    this.isLoading = true;
    this.subscriptions.add(
      this.pecaService.remover(this.pecaIdParaEditar).subscribe({
        next: () => {
          this.toastService.success('Peça excluída com sucesso!');
          this.finalizarModal('excluido');
        },
        error: (err) => {
          this.toastService.error(err.message || 'Erro ao excluir peça.');
          this.isLoading = false;
        },
      })
    );
  }

  onCancelar(): void {
    this.finalizarModal('cancelado');
  }

  private finalizarModal(result?: any): void {
    if (this.close) {
      this.close(result);
    }
  }
}
