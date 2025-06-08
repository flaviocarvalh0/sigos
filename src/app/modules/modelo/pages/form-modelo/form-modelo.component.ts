import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModeloService } from '../../../../services/modelo.service';
import { MarcaService } from '../../../../services/marca.service';
import { ToastService } from '../../../../services/toast.service';
import { CommonModule } from '@angular/common';
import { FormularioDinamicoComponent, CampoFormularioConfig, FormularioDinamicoConfig } from '../../../../shared/components/formulario-dinamico/formulario-dinamico.component';

@Component({
  selector: 'app-form-modelo',
  template: `<app-form-dinamico
    [config]="config"
    [data]="dadosIniciais"
    [isLoading]="isLoading"
    [isEditando]="isEditando"
    (salvar)="onSubmit($event)"
    (cancelar)="onCancelar()"
    (excluir)="onExcluir()"
  >
  </app-form-dinamico> `,
  styleUrls: ['./form-modelo.component.css'],
  standalone: true,
  imports: [CommonModule, FormularioDinamicoComponent]
})
export class FormModeloComponent implements OnInit {
  isEditando = false;
  isLoading = false;
  idModelo?: number;
  marcas: { id: number, nome: string }[] = [];
  dadosIniciais: any = {};
  private dataUltimaModificacaoOriginal?: Date;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modeloService: ModeloService,
    private marcaService: MarcaService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.idModelo = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarMarcas();

    if (this.idModelo) {
      this.isEditando = true;
      this.carregarModelo(this.idModelo);
    }

     this.config = {
      ...this.config,
      titulo: this.cardTitle,
      botoes: {
        ...this.config.botoes,
        salvarTexto: this.saveButtonText,
        excluir: this.isEditando,
      },
    };
  }

  carregarMarcas(): void {
  this.marcaService.obterParaSelecao().subscribe({
    next: (marcas) => {
      this.marcas = marcas.map(m => ({ id: m.id, nome: m.nome }));

      // Atualiza dinamicamente o campo do select com as marcas
      const campoMarca = this.config.abas[0].campos.find(c => c.nome === 'idMarca');
      if (campoMarca) {
        campoMarca.opcoes = this.marcas;
      }
    },
    error: err => this.toastService.error(err.message || 'Erro ao carregar marcas.')
  });
}

  get cardTitle(): string {
    return this.isEditando ? 'Editar Modelo' : 'Cadastrar Modelo';
  }

  get saveButtonText(): string {
    return this.isEditando ? 'Atualizar Modelo' : 'Salvar Modelo';
  }
  carregarModelo(id: number): void {
    this.isLoading = true;
    this.modeloService.obterPorId(id).subscribe({
      next: modelo => {
        if (!modelo) return;
        this.dadosIniciais = {
          nome: modelo.nome,
          idMarca: modelo.idMarca,
        };
        this.dataUltimaModificacaoOriginal = modelo.dataModificacao;
        this.isLoading = false;
      },
      error: err => {
        this.toastService.error(err.message || 'Erro ao carregar modelo.');
        this.isLoading = false;
      }
    });
  }

  config: FormularioDinamicoConfig = {
      titulo: this.isEditando ? 'Editar Modelo' : 'Cadastrar Modelo',
      iconeTitulo: 'bi-phone',
      botoes: {
        salvarTexto: this.isEditando ? 'Atualizar' : 'Salvar',
        cancelarTexto: 'Cancelar',
        excluirTexto: 'Excluir',
        cancelar: true,
        excluir: this.isEditando
      },
      abas: [
        {
          titulo: '',
          campos: [
            {
              nome: 'nome',
              tipo: 'texto',
              rotulo: 'Nome do Modelo',
              placeholder: 'Digite o nome do modelo',
              obrigatorio: true,
              col: 'col-md-6',
              mensagensErro: {
                required: 'Nome é obrigatório.',
                minlength: 'Nome deve ter pelo menos 2 caracteres.'
              }
            },
            {
              nome: 'idMarca',
              tipo: 'select',
              rotulo: 'Marca',
              placeholder: 'Selecione a marca',
              obrigatorio: true,
              col: 'col-md-6',
              opcoes: this.marcas,
              mensagensErro: {
                required: 'A marca é obrigatória.'
              }
            }
          ]
        }
      ]
    };

  onSubmit(dados: any): void {
    if (!dados.nome || dados.nome.trim().length < 2) {
      this.toastService.warning('Nome do modelo inválido.');
      return;
    }
    this.isLoading = true;

    if (this.isEditando && this.idModelo) {
      const payload = { ...dados, id: this.idModelo, dataUltimaModificacao: this.dataUltimaModificacaoOriginal };
      this.modeloService.atualizar(this.idModelo, payload).subscribe({
        next: () => {
          this.toastService.success('Modelo atualizado com sucesso!');
          this.router.navigate(['/modelo']);
        },
        error: err => {
          this.toastService.error(err.message || 'Erro ao atualizar modelo.');
          this.isLoading = false;
        }
      });
    } else {
      const payload = { nome: dados.nome, idMarca: dados.idMarca, dataUltimaModificacao: dados.dataUltimaModificacao };
      this.modeloService.criar(payload).subscribe({
        next: () => {
          this.toastService.success('Modelo criado com sucesso!');
          this.router.navigate(['/modelo']);
        },
        error: err => {
          this.toastService.error(err.message || 'Erro ao criar modelo.');
          this.isLoading = false;
        }
      });
    }
  }

  onCancelar(): void {
    this.router.navigate(['/modelo']);
  }

  onExcluir(): void {
    if (!this.idModelo) return;
    this.isLoading = true;
    this.modeloService.remover(this.idModelo).subscribe({
      next: () => {
        this.toastService.success('Modelo excluído com sucesso!');
        this.router.navigate(['/modelo']);
      },
      error: err => {
        this.toastService.error(err.message || 'Erro ao excluir modelo.');
        this.isLoading = false;
      }
    });
  }
}
