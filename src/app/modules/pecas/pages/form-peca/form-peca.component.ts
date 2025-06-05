// FormPecaComponent adaptado ao padrão com config centralizada
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormularioDinamicoComponent, FormularioDinamicoConfig } from '../../../../shared/components/formulario-dinamico/formulario-dinamico.component';
import { ModeloService } from '../../../../services/modelo.service';
import { MarcaService } from '../../../../services/marca.service';
import { PecaService } from '../../../../services/peca.service';
import { FornecedorService } from '../../../../services/fornecedor.service';
import { CategoriaService } from '../../../../services/categoria.service';
import { ToastService } from '../../../../services/toast.service';
import { Fornecedor } from '../../../../Models/fornecedor.model';
import { Peca } from '../../../../Models/peca.model';

@Component({
  selector: 'app-form-peca',
  template: `
    <app-form-dinamico
      [config]="config"
      [data]="dadosIniciais"
      [isLoading]="isLoading"
      [isEditando]="isEditando"
      (salvar)="onSubmit($event)"
      (cancelar)="onCancelar()"
      (excluir)="onExcluir()"
    ></app-form-dinamico>
  `,
  styleUrls: ['./form-peca.component.css'],
  standalone: true,
  imports: [CommonModule, FormularioDinamicoComponent]
})
export class FormPecaComponent implements OnInit {
  isEditando = false;
  isLoading = false;
  idPeca?: number;
  dataUltimaModificacao?: Date;
  dadosIniciais: any = {};

  opMarcas: any[] = [];
  opModelos: any[] = [];
  opFornecedores: any[] = [];
  opCategorias: any[] = [];

  config: FormularioDinamicoConfig = {
    titulo: 'Cadastrar Peça',
    iconeTitulo: 'bi-tools',
    botoes: {
      cancelar: true,
      excluir: false,
      cancelarTexto: 'Cancelar',
      salvarTexto: 'Salvar',
      excluirTexto: 'Excluir'
    },
    abas: [
      {
        titulo: '',
        campos: [
          {
            nome: 'nome',
            tipo: 'text',
            rotulo: 'Nome da Peça',
            placeholder: 'Digite o nome da peça',
            obrigatorio: true,
            col: 'col-md-6',
            mensagensErro: {
              required: 'Nome é obrigatório.'
            }
          },
          {
            nome: 'precoCusto',
            tipo: 'text',
            rotulo: 'Preço de Custo',
            placeholder: 'Digite o preço de custo',
            obrigatorio: true,
            col: 'col-md-3'
          },
          {
            nome: 'precoVenda',
            tipo: 'text',
            rotulo: 'Preço de Venda',
            placeholder: 'Digite o preço de venda',
            obrigatorio: true,
            col: 'col-md-3'
          },
          {
            nome: 'localizacaoFisica',
            tipo: 'text',
            rotulo: 'Localização Física',
            placeholder: 'Informe a localização',
            col: 'col-md-4'
          },
          {
            nome: 'quantidadeMinimaEstoque',
            tipo: 'text',
            rotulo: 'Qtd. Mínima Estoque',
            placeholder: 'Informe a quantidade mínima',
            col: 'col-md-4'
          },
          {
            nome: 'idMarca',
            tipo: 'select',
            rotulo: 'Marca',
            placeholder: 'Selecione a marca',
            col: 'col-md-6',
            opcoes: this.opMarcas
          },
          {
            nome: 'idModelo',
            tipo: 'select',
            rotulo: 'Modelo',
            placeholder: 'Selecione o modelo',
            col: 'col-md-6',
            opcoes: this.opModelos
          },
          {
            nome: 'idFornecedor',
            tipo: 'select',
            rotulo: 'Fornecedor',
            placeholder: 'Selecione o fornecedor',
            col: 'col-md-6',
            opcoes: this.opFornecedores
          },
          {
            nome: 'idCategoria',
            tipo: 'select',
            rotulo: 'Categoria',
            placeholder: 'Selecione a categoria',
            col: 'col-md-6',
            opcoes: this.opCategorias
          }
        ]
      }
    ]
  };

  constructor(
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
    if (this.idPeca) {
      this.isEditando = true;
      this.config.titulo = 'Editar Peça';
      this.config.botoes = {
        ...this.config.botoes,
        salvarTexto: 'Atualizar',
        excluir: true
      };
      this.carregarPeca(this.idPeca);
    }
    this.carregarDadosParaSelects();
  }

  carregarPeca(id: number): void {
    this.isLoading = true;
    this.pecaService.obterPorId(id).subscribe({
      next: (peca: Peca | undefined) => {
        if (!peca) return;
        this.dadosIniciais = { ...peca };
        this.dataUltimaModificacao = peca.dataModificacao;
        this.isLoading = false;
      },
      error: err => {
        this.toastService.error(err.message || 'Erro ao carregar peça.');
        this.isLoading = false;
      }
    });
  }

  carregarDadosParaSelects(): void {
    this.isLoading = true;
    Promise.all([
      this.marcaService.getMarcas().toPromise(),
      this.modeloService.obterTodos().toPromise(),
      this.fornecedorService.obterTodos().toPromise(),
      this.categoriaService.obterTodos().toPromise()
    ])
      .then(([marcas, modelos, fornecedores, categorias]) => {
        this.opMarcas = (marcas ?? []).map(m => ({ id: m.id, nome: m.nome }));
        this.opModelos = (modelos ?? []).map(m => ({ id: m.id, nome: m.nome }));
        this.opFornecedores = (fornecedores ?? []).map((f: Fornecedor) => ({
          id: f.id!,
          nome: f.nomeFantasia || f.razaoSocial || 'Sem nome'
        }));
        this.opCategorias = (categorias ?? []).map(c => ({ id: c.id, nome: c.nome }));

        // Atualizar opções dos selects na config
        const campos = this.config.abas[0].campos;
        campos.find(c => c.nome === 'idMarca')!.opcoes = this.opMarcas;
        campos.find(c => c.nome === 'idModelo')!.opcoes = this.opModelos;
        campos.find(c => c.nome === 'idFornecedor')!.opcoes = this.opFornecedores;
        campos.find(c => c.nome === 'idCategoria')!.opcoes = this.opCategorias;

        this.isLoading = false;
      })
      .catch(() => {
        this.toastService.error('Erro ao carregar listas.');
        this.isLoading = false;
      });
  }

  onSubmit(dados: any): void {
    this.isLoading = true;

    if (this.isEditando && this.idPeca) {
      const payload = { ...dados, id: this.idPeca, dataUltimaModificacao: this.dataUltimaModificacao };
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
      this.pecaService.criar(dados).subscribe({
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
}
