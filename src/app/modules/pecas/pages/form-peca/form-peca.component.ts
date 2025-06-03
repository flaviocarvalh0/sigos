import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModeloService } from '../../../../services/modelo.service';
import { MarcaService } from '../../../../services/marca.service';
import { PecaService } from '../../../../services/peca.service';
import { FornecedorService } from '../../../../services/fornecedor.service';
import { ToastService } from '../../../../services/toast.service';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { Fornecedor } from '../../../../Models/fornecedor.model';
import { CategoriaService } from '../../../../services/categoria.service';
import { Peca } from '../../../../Models/peca.model';

@Component({
  selector: 'app-form-peca',
  templateUrl: './form-peca.component.html',
  styleUrls: ['./form-peca.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, ReactiveFormsModule]
})
export class FormPecaComponent implements OnInit {
  form!: FormGroup;
  isEditando = false;
  isLoading = false;
  cardTitle = 'Cadastrar Peça';
  saveButtonText = 'Salvar';
  idPeca?: number;
  dataUltimaModificacao?: Date;

  marcas: { id: number, nome: string }[] = [];
  modelos: { id: number, nome: string }[] = [];
  fornecedores: { id: number, nome: string }[] = [];
  categorias: { id: number, nome: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private modeloService: ModeloService,
    private marcaService: MarcaService,
    private pecaService: PecaService,
    private fornecedorService: FornecedorService,
    private categoriaService: CategoriaService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.idPeca = Number(this.route.snapshot.paramMap.get('id'));
    this.inicializarFormulario();
    this.carregarDadosParaSelects();

    if (this.idPeca) {
      this.isEditando = true;
      this.cardTitle = 'Editar Peça';
      this.saveButtonText = 'Atualizar';
      this.carregarPeca(this.idPeca);
    }
  }


  inicializarFormulario(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      precoCusto: [0, [Validators.required, Validators.min(0.01)]],
      precoVenda: [0, [Validators.required, Validators.min(0.01)]],
      localizacaoFisica: [''],
      quantidadeMinimaEstoque: [0, [Validators.min(0)]],
      idMarca: [null],
      idModelo: [null],
      idFornecedor: [null],
      idCategoria: [null],
      dataUltimaModificacao: [null]
    });
  }

  carregarDadosParaSelects(): void {
    this.marcaService.getMarcas().subscribe({
      next: marcas => this.marcas = marcas.map(m => ({ id: m.id, nome: m.nome })),
      error: err => this.toastService.error(err.message || 'Erro ao carregar marcas.')
    });

    this.modeloService.obterTodos().subscribe({
      next: modelos => this.modelos = modelos.map(m => ({ id: m.id, nome: m.nome })),
      error: err => this.toastService.error(err.message || 'Erro ao carregar modelos.')
    });

    this.fornecedorService.obterTodos().subscribe({
      next: (fornecedores: Fornecedor[]) => {
        this.fornecedores = fornecedores.map(f => ({
          id: f.id!,
          nome: f.nomeFantasia || f.razaoSocial || 'Nome Indefinido'
        }));
      },
      error: err => this.toastService.error(err.message || 'Erro ao carregar fornecedores.')
    });

    this.categoriaService.obterTodos().subscribe({
      next: categorias => this.categorias = categorias.map(c => ({ id: c.id, nome: c.nome })),
      error: err => this.toastService.error(err.message || 'Erro ao carregar categorias.')
    });
  }

  carregarPeca(id: number): void {
    this.isLoading = true;
    this.pecaService.obterPorId(id).subscribe({
      next: (peca: Peca | undefined) => {
        if (!peca) return;
        this.form.patchValue({
          nome: peca.nome,
          precoCusto: peca.precoCusto,
          precoVenda: peca.precoVenda,
          localizacaoFisica: peca.localizacaoFisica,
          quantidadeMinimaEstoque: peca.quantidadeMinimaEstoque,
          idMarca: peca.idMarca,
          idModelo: peca.idModelo,
          idFornecedor: peca.idFornecedor,
          idCategoria: peca.idCategoria,
          dataUltimaModificacao: peca.dataModificacao
        });
        this.dataUltimaModificacao = peca.dataModificacao
        this.isLoading = false;
      },
      error: err => {
        this.toastService.error(err.message || 'Erro ao carregar peça.');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const payload = this.form.value;

    if (this.isEditando && this.idPeca) {
      payload.id = this.idPeca;
      payload.dataUltimaModificacao = this.dataUltimaModificacao;
      this.pecaService.atualizar(this.idPeca, payload).subscribe({
        next: () => {
          this.toastService.success('Peça atualizada com sucesso!');
          this.router.navigate(['/peca']);
        },
        error: err => {
          this.toastService.error(err.message || 'Erro ao atualizar peça.');
          this.isLoading = false;
        }
      });
    } else {
      this.pecaService.criar(payload).subscribe({
        next: () => {
          this.toastService.success('Peça criada com sucesso!');
          this.router.navigate(['/peca']);
        },
        error: err => {
          this.toastService.error(err.message || 'Erro ao criar peça.');
          this.isLoading = false;
        }
      });
    }
  }

  onCancelar(): void {
    this.router.navigate(['/peca']);
  }

  onExcluir(): void {
    if (!this.idPeca) return;
    this.isLoading = true;
    this.pecaService.remover(this.idPeca).subscribe({
      next: () => {
        this.toastService.success('Peça excluída com sucesso!');
        this.router.navigate(['/peca']);
      },
      error: err => {
        this.toastService.error(err.message || 'Erro ao excluir peça.');
        this.isLoading = false;
      }
    });
  }

  isInvalidControl(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getControlErrors(controlName: string): any {
    return this.form.get(controlName)?.errors;
  }

  get f() {
    return this.form.controls;
  }
}
