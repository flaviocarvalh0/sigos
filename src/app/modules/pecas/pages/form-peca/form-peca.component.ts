import { NgSelectModule } from '@ng-select/ng-select';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Peca } from '../../../../Models/peca.model';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';
import { PecaService } from '../../../../services/peca.service';
import { NgIf } from '@angular/common';
import { FornecedorService } from '../../../../services/fornecedor.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Fornecedor } from '../../../../Models/fornecedor.model';

declare const bootstrap: any;

@Component({
  selector: 'app-peca-form',
  templateUrl: './form-peca.component.html',
  styleUrls: ['./form-peca.component.css'],
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, NgIf]
})
export class FormPecaComponent implements OnInit {
  @ViewChild('toast') toastEl: any;
  toast: any;
  toastMessage = '';

  form: FormGroup;
  isEditando = false;
  pecaId: number | null = null;

  marcas: any[] = [];
  modelos: any[] = [];
  fornecedores: any[] = [];
  isLoadingFornecedores: boolean = false;
  toastService: any;
  subscriptions: any;


  constructor(
    private fb: FormBuilder,
    private pecaService: PecaService,
    private marcaService: MarcaService,
    private modeloService: ModeloService,
    private fornecedorService: FornecedorService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      preco_custo: [0, [Validators.required, Validators.min(0)]],
      preco_venda: [0, [Validators.required, Validators.min(0)]],
      localizacao_fisica: [''],
      quantidade_minima_estoque: [0, [Validators.min(0)]],
      id_marca: [null],
      id_modelo: [null],
      id_fornecedor: [null]
    });
  }

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const id = params.get('id')

    if (id !== null && id !== undefined && !isNaN(+id)) {
      this.pecaId = +id;
      this.isEditando = true;
      console.log('[DEBUG] Modo EDICAO ativado. ID:', this.pecaId);
      this.carregarDadosPeca();
    } else {
      this.pecaId = null;
      this.isEditando = false;
    }
  });

  this.carregarDadosSelects();
}

  carregarDadosSelects(): void {
    this.marcaService.getMarcas().subscribe(marcas => {
      this.marcas = marcas.map(m => ({ id: m.id, nome: m.nome }));
    });

    this.modeloService.getModelos().subscribe(modelos => {
      this.modelos = modelos.map(m => ({ id: m.id, nome: m.nome }));
    });

    this.carregarFornecedoresParaSelect();
  }

  carregarFornecedoresParaSelect(): void {
    this.isLoadingFornecedores = true;
    // O método no seu FornecedorService é listar()
    const sub = this.fornecedorService.obterTodos().subscribe({
      next: (fornecedoresApi: Fornecedor[]) => {
        this.fornecedores = fornecedoresApi.map(f => ({
          id: f.id!, // Usando non-null assertion operator pois o ID deve existir
          nome: f.nomeFantasia || f.razaoSocial || 'Nome Indefinido' // Prioriza nomeFantasia, depois razaoSocial
        }));
        this.isLoadingFornecedores = false;
        console.log('Fornecedores carregados para select:', this.fornecedores);
      },
      error: (err) => {
        console.error('Erro ao carregar fornecedores:', err);
        this.toastService.error('Erro ao carregar fornecedores. ' + (err.message || ''));
        this.isLoadingFornecedores = false;
      }
    });
    this.subscriptions.add(sub);
  }

  carregarDadosPeca(): void {
    console.log('Iniciando carregamento da peça com ID:', this.pecaId);
    if (this.pecaId) {
      this.pecaService.buscarPorId(this.pecaId).subscribe(peca => {
        if (peca) {
          console.log('Dados da peça:', peca);
          this.form.patchValue(peca);
        }
      });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const peca: Peca = this.form.value;

      const operacao = this.isEditando && this.pecaId ?
        this.pecaService.atualizar(this.pecaId, peca) :
        this.pecaService.criar(peca);

      operacao.subscribe({
        next: () => {
          this.showToast (this.isEditando ? 'Peça atualizada com sucesso!' : 'Peça cadastrada com sucesso!');
          if (!this.isEditando) this.form.reset();
          this.router.navigate(['/peca']);
        },
        error: () => {
          this.toastMessage = 'Erro ao salvar peça';
          this.toast.show();
        }
      });
    } else {
      this.marcarCamposComoSucios();
    }
  }

  onCancelar(): void {
    history.back();
  }

  onExcluir(): void {
    if (this.pecaId && confirm('Tem certeza que deseja excluir esta peça?')) {
      this.pecaService.excluir(this.pecaId).subscribe({
        next: () => {
          this.showToast("Peça excluída com sucesso!");
          this.onCancelar();
        },
        error: () => {
          this.toastMessage = 'Erro ao excluir peça';
          this.toast.show();
        }
      });
    }
  }

  private showToast(message: string): void {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const toastBody = toastEl.querySelector('.toast-body');
      if (toastBody) toastBody.textContent = message;

      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }

  private marcarCamposComoSucios(): void {
    Object.keys(this.form.controls).forEach(campo => {
      this.form.get(campo)?.markAsTouched();
    });
  }
}
