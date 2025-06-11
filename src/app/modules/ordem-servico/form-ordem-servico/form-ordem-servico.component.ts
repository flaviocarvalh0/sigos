import { ConfirmationService } from './../../../services/confirmation.service';
import { Modelo } from './../../../Models/modelo.model';
import { MarcaService } from './../../../services/marca.service';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  NgZone,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  ReactiveFormsModule,
  AbstractControl,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select'; // Necessário se o HTML final usar ng-select
import { forkJoin, Observable, of, Subscription, throwError } from 'rxjs';
import { switchMap, catchError, tap, map, startWith, take } from 'rxjs/operators';

import { Cliente } from '../../../Models/cliente.model';
import { Aparelho } from '../../../Models/aparelho.model';
import { Empresa } from '../../../Models/empresa.model';
import { PrazoGarantia } from '../../../Models/prazo-garantia.model';

import { Servico as CatalogoServico } from '../../../Models/servico.mode';
import { Peca as CatalogoPeca } from '../../../Models/peca.model';

import { ClienteService } from '../../../services/cliente.service';
import { AparelhoService } from '../../../services/aparelho.service';
import { EmpresaService } from '../../../services/empresa.service';
import { PrazoGarantiaService } from '../../../services/prazo_garantia.service';
import {
  ServicoService as CatalogoServicoService,
  ServicoService,
} from '../../../services/servico.service';
import { PecaService as CatalogoPecaService } from '../../../services/peca.service';

import {
  OrdemServico,
  OrdemServicoAtualizacaoPayload,
  OrdemServicoCriacaoPayload,
} from '../../../Models/ordem-servico/ordem-servico.model';
import { Mode } from 'fs';
import { ModeloService } from '../../../services/modelo.service';
import { FormClienteComponent } from '../../cliente/pages/form-cliente/form-cliente.component';
import { FormAparelhoComponent } from '../../aparelho/pages/form-aparelho/form-aparelho.component';
import { OrdemServicoService } from '../../../services/ordem-servico/ordem-servico.service';
import { ToastService } from '../../../services/toast.service';
import { UsuarioService } from '../../../services/usuario.service';
import { ConfirmationConfig } from '../../../Models/confirmation.model';
import { limparDatasInvalidas } from '../../../helpers/form-helpers.';
import {
  OrdemServicoPeca,
  OrdemServicoPecaAtualizacaoPayload,
  OrdemServicoPecaCriacaoPayload,
} from '../../../Models/ordem-servico/ordem-servico-peca.model';
import { OrdemServicoPecaService } from '../../../services/ordem-servico/ordem-servico-peca.service';
import { PecasOrdemServicoComponent } from '../pecas-ordem-servico/pecas-ordem-servico.component';
import { OrdemServicoServicoService } from '../../../services/ordem-servico/ordem-servico-servico.service';
import { OrdemServicoServico } from '../../../Models/ordem-servico/ordem-servico-servico';
import { ServicosOrdemServicoComponent } from '../servicos-ordem-servico/servicos-ordem-servico.component';
import { AnexosEntidadeComponent } from '../../../shared/anexos-entidade/anexos-entidade.component';
import { WorkflowService } from '../../../services/workflow/workflow.service';
import { TransicaoDisponivel } from '../../../Models/workflow/workflow-transicao.model';
import { WorkflowtTransacaoService } from '../../../services/workflow/workflow-transicao.service';
import { markAllAsTouchedAndDirty } from '../../../helpers/form-validation.helper';

declare const bootstrap: any;

@Component({
  selector: 'app-form-ordem-servico',
  templateUrl: './form-ordem-servico.component.html',
  styleUrls: ['./form-ordem-servico.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
    FormClienteComponent,
    FormAparelhoComponent,
    FormsModule,
    PecasOrdemServicoComponent,
    ServicosOrdemServicoComponent,
    AnexosEntidadeComponent,
  ],
})
export class FormOrdemServicoComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  ordemServicoId?: number;
  isEditMode = false;
  isLoading = false;
  private idEstadoOs?: number;
  private idWorkflowOs?: number;
  private dataUltimaModificacaoOriginal?: Date;
  empresas: { id: number; descricao: string }[] = [];
  clientes: { id: number; nome: string }[] = [];
  usuarios: { id: number; nome: string }[] = [];
  aparelhosDoCliente: Aparelho[] = [];
  pecasAdicionadas: OrdemServicoPeca[] = [];
  prazosGarantia: { id: number; descricao: string; prazoEmDias?: number }[] =
    [];
  servicosDisponiveis: {
    id: number;
    descricao: string;
    valor?: number;
    tempo?: number;
  }[] = [];
  pecasDisponiveis: { id: number; descricao: string; precoVenda?: number }[] =
    [];
  marcas: { id: number; descricao: string }[] = [];
  modelos: { id: number; descricao: string }[] = [];

  dataCriacaoDisplay: string = '';
  criadorNome: string = '';
  dataModificacaoDisplay: string = '';
  modificadorNome: string = '';

  abaAtiva: string = 'dados-principais';

  private idsServicosParaDeletar: number[] = [];
  private idsPecasParaDeletar: number[] = [];
  private idsAnexosParaDeletar: number[] = [];

  transicoesDisponiveis: TransicaoDisponivel[] = [];
  isTransicoesLoading = false;

  private subscriptions = new Subscription();

  @ViewChild('modalNovoClienteOsRef') modalNovoClienteRef!: ElementRef;
  private modalClienteInstance: any; // Ou bootstrap.Modal se tiver os types e funcionar
  exibirConteudoModalCliente = false; // Para controlar o *ngIf do conteúdo do modal

  @ViewChild('modalNovoAparelhoOsRef') modalNovoAparelhoOsRef!: ElementRef;
  private modalAparelhoOsInstance: any; // Ou bootstrap.Modal
  exibirConteudoModalAparelhoOs = false;
  editandoAparelhoOsId: number | undefined = undefined;

  novaPeca: OrdemServicoPecaCriacaoPayload = {
    idOrdemServico: 0, // será setado no salvar
    idPeca: null!,
    quantidade: 1,
    valorUnitario: 0,
    valorMaoObra: 0,
    valorTotal: 0,
    observacao: '',
  };

  statusBadgeClass: string = 'bg-secondary';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private ordemServicoService: OrdemServicoService,
    private empresaService: EmpresaService,
    private clienteService: ClienteService,
    private aparelhoService: AparelhoService,
    private prazoGarantiaService: PrazoGarantiaService,
    private catalogoServicoService: CatalogoServicoService,
    private catalogoPecaService: CatalogoPecaService,
    private ordemServicoServicoService: OrdemServicoServicoService,
    private ordemServicoPecaService: OrdemServicoPecaService,
    private marcaService: MarcaService,
    private modeloService: ModeloService,
    private servicoService: ServicoService,
    private usuarioService: UsuarioService,
    private workflowService: WorkflowtTransacaoService,
    private route: ActivatedRoute,
    private router: Router,
    private confirmationService: ConfirmationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.carregarEmpresaParaSelecao();
    this.initForm();
    this.loadInitialSelectData();
    this.carregarClientesParaSelecao();
    this.carregarUsuarioParaSelecao();

    const routeParamsSub = this.route.params.subscribe((params) => {
      this.isLoading = true;
      if (params['id']) {
        this.ordemServicoId = +params['id'];
        this.carregarOsParaEdicao(this.ordemServicoId);
        this.isEditMode = true;
        this.loadOrdemServicoAndRelatedItems();
      } else {
        this.form.patchValue({
          data_entrada: new Date().toISOString().substring(0, 10),
        });
        this.isEditMode = false; // Chama o método para gerar o código
        this.form.patchValue({
          data_criacao: new Date().toISOString().substring(0, 10),
        });
        this.applyEmpresaRule();
        this.isLoading = false;
      }
    });
    this.subscriptions.add(routeParamsSub);

    const clienteChangesSub = this.form
      .get('id_cliente')
      ?.valueChanges.subscribe((clienteId) => {
        this.onClienteChange(clienteId);
      });
    this.subscriptions.add(clienteChangesSub);

    const prazoGarantiaChangesSub = this.form
      .get('id_prazo_garantia')
      ?.valueChanges.subscribe(() => {
        this.calculateDataExpiracaoGarantia();
      });
    this.subscriptions.add(prazoGarantiaChangesSub);

    const dataInicioGarantiaSub = this.form
      .get('data_inicio_garantia')
      ?.valueChanges.subscribe(() => {
        this.calculateDataExpiracaoGarantia();
      });

    this.subscriptions.add(dataInicioGarantiaSub);

    const servicosChangesSub = this.osServicos.valueChanges.subscribe(() =>
      this.recalcularValores()
    );
    const pecasChangesSub = this.osPecas.valueChanges.subscribe(() =>
      this.recalcularValores()
    );
    const descontoChangesSub = this.form
      .get('desconto')
      ?.valueChanges.subscribe(() => this.recalcularValores());

    this.subscriptions.add(servicosChangesSub);
    this.subscriptions.add(pecasChangesSub);
    this.subscriptions.add(descontoChangesSub);
  }
  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Modal Cliente (como antes)
      const modalClienteEl = this.modalNovoClienteRef?.nativeElement;
      if (modalClienteEl) {
        this.modalClienteInstance = new bootstrap.Modal(modalClienteEl);
        modalClienteEl.addEventListener('show.bs.modal', () =>
          this.zone.run(() => {
            this.exibirConteudoModalCliente = true;
            this.cdr.detectChanges();
          })
        );
        modalClienteEl.addEventListener('hidden.bs.modal', () =>
          this.zone.run(() => {
            this.exibirConteudoModalCliente = false;
            this.cdr.detectChanges();
          })
        );

         setTimeout(() => {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl);
        });
      }, 500);
    }

      // Novo Modal Aparelho (controlado pela OS)
      const modalAparelhoOsEl = this.modalNovoAparelhoOsRef?.nativeElement;
      if (modalAparelhoOsEl) {
        this.modalAparelhoOsInstance = new bootstrap.Modal(modalAparelhoOsEl);
        modalAparelhoOsEl.addEventListener('show.bs.modal', () =>
          this.zone.run(() => {
            this.exibirConteudoModalAparelhoOs = true;
            this.cdr.detectChanges();
          })
        );
        modalAparelhoOsEl.addEventListener('hidden.bs.modal', () =>
          this.zone.run(() => {
            this.exibirConteudoModalAparelhoOs = false;
            this.editandoAparelhoOsId = undefined; // Limpa ID de edição
            // Recarrega aparelhos do cliente selecionado na OS, se houver um
            const clienteIdNaOs = this.form.get('id_cliente')?.value;
            if (clienteIdNaOs) {
              this.onClienteChange(clienteIdNaOs); // Reutiliza para recarregar aparelhos
            }
            this.cdr.detectChanges();
          })
        );
      }
    }

    console.log('servicos' + this.servicosDisponiveis);
  }

  get osPecas(): FormArray {
    return this.form.get('os_pecas') as FormArray;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (isPlatformBrowser(this.platformId)) {
      this.modalClienteInstance?.dispose();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      // Campos da OS Principal (alinhados com o modelo OrdemServico e o HTML)
      id: [null],
      codigo: { value: '', disabled: true }, // Do modelo OrdemServico
      id_empresa: [null, Validators.required],
      id_cliente: [null, Validators.required],
      id_aparelho: [{ value: null, disabled: true }, Validators.required],
      data_entrada: [null, Validators.required], // Mapeia para data_criacao
      data_execucao: [null], // Do modelo OrdemServico
      data_conclusao: [null], // Do modelo OrdemServico
      id_prazo_garantia: [null, Validators.required], // Do modelo OrdemServico
      data_expiracao_garantia: [{ value: null, disabled: true }], // Do modelo OrdemServico
      data_saida: [null],
      desconto: [0, [Validators.required, Validators.min(0)]],
      data_inicio_garantia: [null],

      // Descrições e Observações
      defeito_relatado_cliente: ['', Validators.required], // No HTML, mapeia para relato_do_problema
      defeito_constatado_tecnico: [''], // No HTML, mapeia para relato_tecnico
      observacoes_gerais: [''], // No HTML, mapeia para observacoes

      forma_pagamento: [''],
      pagamento_realizado: [false],
      id_atendente: [null, Validators.required],
      id_tecnico: [null, Validators.required],
      data_modificacao: [null],

      data_previsao_entrega: [null],
      id_status_os: [null],

      valor_total_servicos: [{ value: 0, disabled: true }],
      valor_total_pecas: [{ value: 0, disabled: true }],
      valor_total_orcamento: [{ value: 0, disabled: true }],
      nome_estado_display: [{ value: 'Nova', disabled: true }],
      os_anexos: this.fb.array([]),
      os_servicos: this.fb.array([]),
    });
  }

  abrirModalNovoAparelhoParaOS(aparelhoId?: number): void {
    const clienteIdSelecionado = this.form.get('id_cliente')?.value;
    if (!clienteIdSelecionado) {
      this.showToast(
        'Selecione um cliente primeiro para adicionar um aparelho.',
        'warning'
      );
      return;
    }
    this.editandoAparelhoOsId = aparelhoId;
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.modalAparelhoOsInstance?.show();
      }, 0);
    }
  }

  handleAparelhoCriadoNaOS(aparelho?: Aparelho): void {
    if (isPlatformBrowser(this.platformId)) {
      this.modalAparelhoOsInstance?.hide(); // O listener 'hidden.bs.modal' recarregará a lista
    }
    if (aparelho && aparelho.id) {
      // this.showToast(`Aparelho "${this.getNomeMarca(aparelho.id_marca)} ${this.getNomeModelo(aparelho.id_modelo)}" salvo com sucesso!`, 'success');
      // // A lista de aparelhosDoCliente será atualizada pelo listener 'hidden.bs.modal'.
      // // Seleciona o aparelho recém-criado/editado no select da OS.
      // this.form.get('id_aparelho')?.setValue(aparelho.id);
    }
  }

  handleAparelhoCanceladoNaOS(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.modalAparelhoOsInstance?.hide();
    }
  }

  loadInitialSelectData(): void {
    this.isLoading = true;

    const requests = [
      this.prazoGarantiaService.obterParaSelecao().pipe(
        map((data) =>
          data.map((item) => ({
            id: item.id,
            descricao: item.descricao,
            prazoEmDias: item.prazoEmDias,
          }))
        ),
        tap((data) => (this.prazosGarantia = data))
      ),
      this.servicoService.obterTodos().pipe(
        map((data) =>
          data.map((item) => ({
            id: item.id,
            descricao: item.nome,
            valor: item.precoPadrao ?? undefined,
            tempo: item.tempoEstimadoMinutos ?? undefined,
          }))
        ),
        tap((data) => (this.servicosDisponiveis = data))
      ),
      this.catalogoPecaService.obterTodos().pipe(
        map((data) =>
          data.map((item) => ({
            id: item.id,
            descricao: item.nome,
            precoVenda: item.precoVenda,
          }))
        ),
        tap((data) => (this.pecasDisponiveis = data))
      ),
      this.marcaService
        .obterParaSelecao()
        .pipe(tap((data) => (this.marcas = data))),
      this.modeloService
        .obterParaSelecao()
        .pipe(tap((data) => (this.modelos = data))),
    ];

    this.subscriptions.add(
      forkJoin(requests).subscribe({
        complete: () => {
          console.log('Serviços carregados:', this.servicosDisponiveis); // <-- aqui é seguro
          if (!this.isEditMode) this.isLoading = false;
        },
        error: (err) => {
          this.toastService.error(
            'Erro ao carregar dados iniciais para selects:',
            err
          );
          this.isLoading = false;
        },
      })
    );

    const loadSub = this.subscriptions.add(
      forkJoin(requests).subscribe({
        complete: () => {
          if (!this.isEditMode) {
            this.isLoading = false;
          }
        },
        error: (err) => {
          this.toastService.error(
            'Erro ao carregar dados iniciais para selects:',
            err
          );
          this.isLoading = false;
        },
      })
    );
  }

  carregarClientesParaSelecao(): void {
    this.clienteService.obterParaSelecao().subscribe({
      next: (clientes) => {
        this.clientes = clientes.map((c) => ({ id: c.id, nome: c.descricao }));
      },
      error: (err) =>
        this.toastService.error(err.message || 'Erro ao carregar clientes.'),
    });
  }

  carregarUsuarioParaSelecao(): void {
    this.usuarioService.obterParaSelecao().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
      },
      error: (err) => {
        this.toastService.error('Erro ao carregar usuários: ' + err.message);
      },
    });
  }

  carregarEmpresaParaSelecao(): void {
    this.empresaService.obterParaSelecao().subscribe({
      next: (empresas) => {
        console.log('Empresas carregadas:', empresas);
        this.empresas = empresas;

        if (empresas.length > 0) {
          this.form.get('id_empresa')?.setValue(empresas[0].id);

          if (empresas.length > 1) {
            this.form.get('id_empresa')?.enable();
          } else {
            this.form.get('id_empresa')?.disable(); // fica visível, mas não editável
          }
        }
      },
      error: (err) => {
        this.toastService.error('Erro ao carregar empresas: ' + err.message);
      },
    });
  }

  carregarOsParaEdicao(idOs: number): void {
    console.log(`--- RECARREGANDO DADOS DA OS ID: ${idOs} ---`);
    this.ordemServicoService.obterPorId(idOs).subscribe({
      next: (ordem) => {
        if (!ordem) {
          this.toastService.error(
            `Ordem de serviço com ID ${idOs} não encontrada.`
          );
          this.isLoading = false;
          return;
        }
        console.log(`--- RECARREGANDO DADOS DA OS ID: ${ordem.valorPecas} ---`);
        limparDatasInvalidas(ordem, [
          /* ... suas datas ... */
        ]);

        // PATCHVALUE CORRIGIDO
        this.form.patchValue({
          id: ordem.id,
          codigo: ordem.codigo,
          pagamento_realizado: ordem.pagamentoRealizado,
          forma_pagamento: ordem.formaPagamento,
          observacoes_gerais: ordem.observacoes,
          id_empresa: ordem.idEmpresa,
          id_cliente: ordem.idCliente,
          id_aparelho: ordem.idAparelho,
          id_atendente: ordem.idAtendente,
          id_tecnico: ordem.idTecnico,
          id_prazo_garantia: ordem.idPrazoGarantia,
          id_status_os: ordem.idEstado,
          defeito_relatado_cliente: ordem.descricaoProblema,
          defeito_constatado_tecnico: ordem.diagnosticoTecnico,

          // --- CORREÇÃO E MELHORIA AQUI ---
          // Garante que TODOS os campos de totais sejam atualizados
          valor_total_servicos: ordem.valorServicos?.toFixed(2),
          valor_total_pecas: ordem.valorPecas?.toFixed(2),
          desconto: ordem.desconto?.toFixed(2) || 0,
          // CORRIGIDO: de 'valor_orcamento_total' para 'valor_total_orcamento'
          valor_total_orcamento: ordem.valorTotal?.toFixed(2) ?? '0.00',

          // Formata as datas válidas e mantém as nulas
          data_entrada: ordem.dataCriacao
            ? new Date(ordem.dataCriacao).toISOString().substring(0, 10)
            : null,
          data_execucao: ordem.dataExecucao
            ? new Date(ordem.dataExecucao).toISOString().substring(0, 10)
            : null,
          data_conclusao: ordem.dataConclusao
            ? new Date(ordem.dataConclusao).toISOString().substring(0, 10)
            : null,
          data_saida: ordem.dataRetirada
            ? new Date(ordem.dataRetirada).toISOString().substring(0, 10)
            : null,
          data_inicio_garantia: ordem.dataInicioGarantia
            ? new Date(ordem.dataInicioGarantia).toISOString().substring(0, 10)
            : null,
          data_expiracao_garantia: ordem.dataFimGarantia
            ? new Date(ordem.dataFimGarantia).toISOString().substring(0, 10)
            : null,

          nome_estado_display: ordem.nomeEstado || 'Não definido',
        });

        const classeDoBadge = this.definirClasseBadgeStatus(ordem.nomeEstado);
        this.statusBadgeClass = classeDoBadge;

        // Atualiza as propriedades de controle e auditoria
        this.dataUltimaModificacaoOriginal = ordem.dataModificacao;
        this.idEstadoOs = ordem.idEstado;
        this.idWorkflowOs = ordem.idWorkflow;
        this.dataCriacaoDisplay = this.formatarDataParaDisplay(
          ordem.dataCriacao
        );
        this.dataModificacaoDisplay = this.formatarDataParaDisplay(
          ordem.dataModificacao
        );
        this.criadorNome = ordem.criadoPor || 'Não disponível';
        this.modificadorNome = ordem.modificadoPor || 'Não disponível';

        this.formatarCampoDesconto();


        if (this.idWorkflowOs && this.idEstadoOs) {
          this.carregarTransicoesDisponiveis(
            this.idWorkflowOs,
            this.idEstadoOs
          );
        }
      },
      error: (err) =>
        this.toastService.error(`Erro ao carregar OS: ${err.error?.message}`),
    });
  }

  private formatarDataParaDisplay(
    data: Date | string | null | undefined
  ): string {
    if (!data) {
      return 'N/A';
    }
    try {
      // Formata a data para o padrão brasileiro com horário
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(data));
    } catch {
      return 'Data inválida';
    }
  }

  getNomeMarca(idMarca: number): string {
    const marca = this.marcas.find((m) => m.id === idMarca);
    return marca ? marca.descricao : 'Desconhecida';
  }

  getNomeModelo(idModelo: number): string {
    const modelo = this.modelos.find((m) => m.id === idModelo);
    return modelo ? modelo.descricao : 'Desconhecido';
  }
  applyEmpresaRule(): void {
    if (
      this.empresas &&
      this.empresas.length === 1 &&
      !this.form.get('id_empresa')?.value
    ) {
      this.form.get('id_empresa')?.setValue(this.empresas[0].id);
      this.form.get('id_empresa')?.disable();
    } else if (this.empresas && this.empresas.length > 1) {
      this.form.get('id_empresa')?.enable();
    } else if (!this.empresas || this.empresas.length === 0) {
      // this.form.get('id_empresa')?.disable();
    }
    // Se já houver um valor (modo de edição), não sobrescrever, apenas ajustar o estado enabled/disabled.
    if (this.form.get('id_empresa')?.value && this.empresas.length === 1) {
      //this.form.get('id_empresa')?.disable();
    }
  }

  onClienteChange(clienteId: number | null): void {
    if (clienteId) {
      this.aparelhoService.buscarPorCliente(clienteId).subscribe((data) => {
        this.aparelhosDoCliente = data;
        this.form.get('id_aparelho')?.enable();
        const currentAparelhoId = this.form.get('id_aparelho')?.value;
        if (
          currentAparelhoId &&
          !this.aparelhosDoCliente.find((ap) => ap.id === currentAparelhoId)
        ) {
          this.form.get('id_aparelho')?.reset();
        }
      });
    } else {
      this.aparelhosDoCliente = [];
      this.form.get('id_aparelho')?.reset();
      this.form.get('id_aparelho')?.disable();
    }
  }

  calculateDataExpiracaoGarantia(): void {
    const prazoId = this.form.get('id_prazo_garantia')?.value;
    const dataInicioGarantiaStr = this.form.get('data_inicio_garantia')?.value;

    if (prazoId && dataInicioGarantiaStr) {
      const dataInicioGarantiaStr = this.form.get(
        'data_inicio_garantia'
      )?.value;

      const dataInicio = new Date(dataInicioGarantiaStr);
      if (!isNaN(dataInicio.getTime())) {
        this.prazoGarantiaService
          .obterPorId(prazoId)
          .subscribe((prazoSelecionado) => {
            if (prazoSelecionado?.prazoEmDias) {
              const dataExpiracao = new Date(dataInicioGarantiaStr);
              dataExpiracao.setDate(
                dataInicio.getDate() + prazoSelecionado.prazoEmDias
              );

              this.form
                .get('data_expiracao_garantia')
                ?.setValue(dataExpiracao.toISOString().substring(0, 10));
            } else {
              this.form.get('data_expiracao_garantia')?.setValue(null);
            }
          });
      }
    } else {
      this.form.get('data_expiracao_garantia')?.setValue(null);
    }
  }

  loadOrdemServicoAndRelatedItems(): void {
    if (!this.ordemServicoId) {
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    this.ordemServicoService
      .obterPorId(this.ordemServicoId)
      .pipe(
        tap((os) => {
          if (!os)
            throw new Error('Ordem de Serviço principal não encontrada.');
          // Mapear os campos da OS para os FormControls
          this.form.patchValue({
            id: os.id,
            codigo: os.codigo,
            id_empresa: os.idEmpresa,
            id_cliente: os.idCliente,
            // id_aparelho será setado após os aparelhos do cliente serem carregados
            data_entrada: os.dataCriacao
              ? new Date(os.dataCriacao).toISOString().substring(0, 10)
              : null,
            // data_previsao_entrega: os.data_previsao_entrega, // Se este campo existir no DTO 'os'
            data_saida: os.dataRetirada
              ? new Date(os.dataRetirada).toISOString().substring(0, 10)
              : null,
            data_execucao: os.dataExecucao
              ? new Date(os.dataExecucao).toISOString().substring(0, 10)
              : null,
            data_conclusao: os.dataConclusao
              ? new Date(os.dataConclusao).toISOString().substring(0, 10)
              : null,
            id_prazo_garantia: os.idPrazoGarantia,
            // data_expiracao_garantia será recalculada ou pega da OS
            data_expiracao_garantia: os.dataFimGarantia
              ? new Date(os.dataFimGarantia).toISOString().substring(0, 10)
              : null,
            defeito_relatado_cliente: os.descricaoProblema,
            defeito_constatado_tecnico: os.diagnosticoTecnico,
            observacoes_gerais: os.observacoes,
            forma_pagamento: os.formaPagamento || '',
            pagamento_realizado: os.pagamentoRealizado ?? false,
            id_atendente: os.idAtendente,
            id_tecnico: os.idTecnico,
            valor_total_servicos: os.valorServicos,
            valor_total_pecas: os.valorPecas,
            valor_total_orcamento: (os.valorTotal ?? 0).toFixed(2),
          });

          if (os.idCliente) this.onClienteChange(os.idCliente);
          this.applyEmpresaRule();
        }),
        switchMap((os) => {
          if (!os || !this.ordemServicoId)
            return throwError(() => new Error('ID da OS principal inválido.'));
          return forkJoin({
            osPrincipal: of(os),
            loadedOsServicos: this.ordemServicoServicoService
              .obterPorOrdemServico(this.ordemServicoId)
              .pipe(catchError(() => of([] as OrdemServicoServico[]))),
          });
        })
      )
      .subscribe({
        next: ({
          osPrincipal,
          //loadedOsAnexos,
        }) => {
          this.osAnexos.clear();
          this.idsAnexosParaDeletar = [];
          // loadedOsAnexos.forEach((a) =>
          //   this.addAnexo(
          //     {
          //       id: a.id,
          //       nome_arquivo: a.nome_arquivo,
          //       stream_anexo: null,
          //       data_upload: a.data_upload,
          //     },
          //     false
          //   )
          // );

          if (osPrincipal.idAparelho) {
            setTimeout(
              () =>
                this.form.get('id_aparelho')?.setValue(osPrincipal.idAparelho),
              300
            );
          }

          this.form.markAsPristine();
          this.isLoading = false;
        },
        error: (err) => {
          this.toastService.error('Erro ao carregar OS e itens:', err);
          this.router.navigate(['/ordem-servico']);
          this.isLoading = false;
        },
      });
  }

  // --- FormArray de Serviços ---
  get osServicos(): FormArray {
    return this.form.get('os_servicos') as FormArray;
  }

  addServico(servicoData?: OrdemServicoServico, markAsDirty = true): void {
    const servicoForm = this.fb.group({
      id: [servicoData?.id || null],
      id_servico_catalogo: [
        servicoData?.idServico || null,
        Validators.required,
      ],
      valor_unitario: [
        servicoData?.precoPraticado || 0,
        [Validators.required, Validators.min(0)],
      ],
      valor_total_calculado: [{ value: 0, disabled: true }],
    });

    const subId = servicoForm
      .get('id_servico_catalogo')
      ?.valueChanges.pipe(
        startWith(servicoForm.get('id_servico_catalogo')?.value)
      )
      .subscribe((servicoId) => {
        if (servicoId) {
          const catServico = this.servicosDisponiveis.find(
            (s) => s.id === servicoId
          );
          // if (catServico && typeof catServico.valor === 'number') {
          //   servicoForm.get('valor_unitario')?.setValue(catServico.valor);
          // }
        }
        this.updateSubtotalItem(
          servicoForm,
          'quantidade',
          'valor_unitario',
          'valor_total_calculado'
        );
      });
    this.subscriptions.add(subId);

    const subQty = servicoForm
      .get('quantidade')
      ?.valueChanges.subscribe(() =>
        this.updateSubtotalItem(
          servicoForm,
          'quantidade',
          'valor_unitario',
          'valor_total_calculado'
        )
      );
    const subVal = servicoForm
      .get('valor_unitario')
      ?.valueChanges.subscribe(() =>
        this.updateSubtotalItem(
          servicoForm,
          'quantidade',
          'valor_unitario',
          'valor_total_calculado'
        )
      );
    this.subscriptions.add(subQty);
    this.subscriptions.add(subVal);

    if (servicoData)
      this.updateSubtotalItem(
        servicoForm,
        'quantidade',
        'valor_unitario',
        'valor_total_calculado'
      );

    this.osServicos.push(servicoForm);
    if (markAsDirty) this.form.markAsDirty();
  }

  removeServico(index: number): void {
    const itemId = (this.osServicos.at(index) as FormGroup).get('id')?.value;
    if (this.isEditMode && itemId) this.idsServicosParaDeletar.push(itemId);
    this.osServicos.removeAt(index);
    this.form.markAsDirty();
  }

  addPeca(): void {
    const novaPecaForm = this.fb.group({
      idPeca: [null, Validators.required],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      valorUnitario: [{ value: 0, disabled: false }, Validators.required],
      valorTotalCalculado: [{ value: 0, disabled: true }],
    });
  }

  recalcularTotal(form: FormGroup): void {
    const quantidade = Number(form.get('quantidade')?.value || 0);
    const valor = Number(form.get('valorUnitario')?.value || 0);
    form.get('valorTotalCalculado')?.setValue(quantidade * valor);
  }

  removePeca(index: number): void {
    const itemId = (this.osPecas.at(index) as FormGroup).get('id')?.value;
    if (this.isEditMode && itemId) {
      this.idsPecasParaDeletar.push(itemId);
    }
    this.osPecas.removeAt(index);
    this.form.markAsDirty();
  }

  updateSubtotalItem(
    itemForm: AbstractControl | null,
    qtyCtrlName: string,
    valCtrlName: string,
    totalCtrlName: string
  ): void {
    if (itemForm instanceof FormGroup) {
      const qty = itemForm.get(qtyCtrlName)?.value || 0;
      const val = itemForm.get(valCtrlName)?.value || 0;
      itemForm.get(totalCtrlName)?.setValue(qty * val);
    }
  }

  // --- FormArray de Anexos ---
  get osAnexos(): FormArray {
    return this.form.get('os_anexos') as FormArray;
  }

  removeAnexo(index: number): void {
    const itemId = (this.osAnexos.at(index) as FormGroup).get('id')?.value;
    if (this.isEditMode && itemId) this.idsAnexosParaDeletar.push(itemId);
    this.osAnexos.removeAt(index);
    this.form.markAsDirty();
  }

  onFileSelected(event: Event, anexoIndex: number): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];
      const anexoFormGroup = this.osAnexos.at(anexoIndex) as FormGroup;
      anexoFormGroup.patchValue({
        arquivo: file,
        nome_arquivo: file.name,
        tipo_anexo: file.type,
        tamanho_arquivo: file.size,
        id: null, // Selecionar novo arquivo para um item o torna "novo" para upload
      });
      anexoFormGroup.get('arquivo')?.setValidators(Validators.required);
      anexoFormGroup.get('arquivo')?.updateValueAndValidity();
      anexoFormGroup.markAsDirty();
      inputElement.value = '';
    }
  }

  // Método calculateAllTotals() completo
 // Remova os métodos antigos e adicione este:
private recalcularValores(): void {
  const totalServicos = this.osServicos.controls.reduce((acc, ctrl) => {
    const formGroup = ctrl as FormGroup;
    return acc + ((formGroup.get('quantidade')?.value || 0) * (formGroup.get('valor_unitario')?.value || 0));
  }, 0);

  const totalPecas = this.osPecas.controls.reduce((acc, ctrl) => {
    const formGroup = ctrl as FormGroup;
    return acc + ((formGroup.get('quantidade')?.value || 0) * (formGroup.get('valor_unitario')?.value || 0));
  }, 0);

  const subTotal = totalServicos + totalPecas;
  let desconto = this.form.get('desconto')?.value || 0;

  // *** LÓGICA PRINCIPAL DA VALIDAÇÃO ***
  // Se o desconto for maior que o subtotal, ajusta o desconto e avisa o usuário.
  if (desconto > subTotal) {
    desconto = subTotal;
    this.toastService.warning('O desconto não pode ser maior que o valor total. Ele foi ajustado automaticamente.');
    // Usamos { emitEvent: false } para não disparar um loop infinito de atualizações.
    this.form.get('desconto')?.setValue(desconto, { emitEvent: false });
  }

  const valorTotalOrcamento = subTotal - desconto;

  // Atualiza os valores no formulário
  this.form.patchValue({
    valor_total_servicos: totalServicos.toFixed(2),
    valor_total_pecas: totalPecas.toFixed(2),
    valor_total_orcamento: valorTotalOrcamento.toFixed(2)
  }, { emitEvent: false }); // Usar aqui também para evitar re-gatilhos desnecessários
}

  onSubmit(): void {
    if (this.form.invalid) {
      markAllAsTouchedAndDirty(this.form); // Marca todos os campos para exibir os erros
      this.toastService.error('Existem campos obrigatórios não preenchidos. Por favor, verifique.');
      console.error('Erros do formulário:', this.collectFormErrors(this.form));
      return;
    }

    this.isLoading = true;
    const formValue = this.form.getRawValue();

    const osPayload: OrdemServicoCriacaoPayload = {
      codigo: formValue.codigo || undefined,
      valorTotal: parseFloat(formValue.valor_total_orcamento) || 0,
      descricaoProblema: formValue.defeito_relatado_cliente,
      diagnosticoTecnico: formValue.defeito_constatado_tecnico || undefined,
      observacoes: formValue.observacoes_gerais || undefined,
      idPrazoGarantia: formValue.id_prazo_garantia || undefined,
      idCliente: formValue.id_cliente,
      idAparelho: formValue.id_aparelho,
      idEmpresa: formValue.id_empresa ?? this.empresas[0]?.id,
      pagamentoRealizado: formValue.pagamento_realizado || false,
      formaPagamento: formValue.forma_pagamento || undefined,
      valorServicos: parseFloat(formValue.valor_total_servicos) || 0,
      valorPecas: parseFloat(formValue.valor_total_pecas) || 0,
      idAtendente: formValue.id_atendente,
      idTecnico: formValue.id_tecnico,
      desconto: parseFloat(formValue.desconto) || 0,

      dataRetirada: this.toLocalDate(formValue.data_saida),
      dataExecucao: this.toLocalDate(formValue.data_execucao),
      dataConclusao: this.toLocalDate(formValue.data_conclusao),
      dataInicioGarantia: this.toLocalDate(formValue.data_inicio_garantia) ?? undefined,
      dataFimGarantia: this.toLocalDate(formValue.data_expiracao_garantia) ?? undefined
    };

    limparDatasInvalidas(osPayload, [
      'dataRetirada',
      'dataExecucao',
      'dataConclusao',
      'dataInicioGarantia',
      'dataFimGarantia',
    ]);
    if (this.isEditMode && this.ordemServicoId) {
      const osUpdatePayload: OrdemServicoAtualizacaoPayload = {
        ...osPayload,
        id: this.ordemServicoId,
        dataUltimaModificacao: this.dataUltimaModificacaoOriginal!,
        idEstado: this.idEstadoOs,
        idWorkflow: this.idWorkflowOs,
      };
      this.ordemServicoService
        .atualizar(this.ordemServicoId, osUpdatePayload)
        .pipe(
          switchMap((dadosDaOsAtualizada) =>
            this.processarItensDaOs(this.ordemServicoId!).pipe(
              map((resultadoDosItens) => ({
                os: dadosDaOsAtualizada,
                itens: resultadoDosItens,
              }))
            )
          )
        )
        .subscribe({
          next: (resultado) => {
            this.dataUltimaModificacaoOriginal = resultado.os.dataModificacao;
            this.form.patchValue({
              valor_total_servicos: resultado.os.valorServicos?.toFixed(2),
              valor_total_pecas: resultado.os.valorPecas?.toFixed(2),
              valor_total_orcamento: resultado.os.valorTotal?.toFixed(2),
            });
            this.form.markAsPristine();
            this.handleSuccess('Ordem de Serviço');
          },
          error: (err) => {
            this.handleError('Erro ao atualizar OS:', err);
          },
        });
    }
    else {
      this.ordemServicoService.criar(osPayload).subscribe({
        next: (osCriada) => {
          if (!osCriada || !osCriada.id) {
            this.handleError(
              'Erro ao criar OS:',
              'A API não retornou uma resposta válida.'
            );
            return;
          }
          this.toastService.success('Ordem de Serviço criada com sucesso!');

          this.isEditMode = true;
          this.ordemServicoId = osCriada.id;

          this.dataUltimaModificacaoOriginal = osCriada.dataModificacao;
          this.idEstadoOs = osCriada.idEstado;
          this.idWorkflowOs = osCriada.idWorkflow;

          this.form.patchValue({
            id: osCriada.id,
            codigo: osCriada.codigo,
          });

          this.form.patchValue({ nome_estado_display: osCriada.nomeEstado });
          this.statusBadgeClass = this.definirClasseBadgeStatus(osCriada.nomeEstado);

          this.criadorNome = osCriada.criadoPor || 'Não disponível';
          this.dataCriacaoDisplay = this.formatarDataParaDisplay(osCriada.dataCriacao);
          this.modificadorNome = osCriada.modificadoPor || 'Não disponível';
          this.dataModificacaoDisplay = this.formatarDataParaDisplay(osCriada.dataModificacao);

          if (this.idWorkflowOs && this.idEstadoOs) {
            this.carregarTransicoesDisponiveis(
              this.idWorkflowOs,
              this.idEstadoOs
            );
          }

          this.form.markAsPristine();

          this.isLoading = false;
        },
        error: (err) => {
          this.handleError('Erro ao criar Ordem de Serviço:', err);
        },
      });
    }
  }

  private processarItensDaOs(
    osId: number,
    isCriacaoTotal: boolean = false
  ): Observable<any[]> {
    const operacoesItens: Observable<any>[] = [];

    // Anexos
    this.osAnexos.controls.forEach((ctrl) => {
      const formGroup = ctrl as FormGroup;
      const anexoFile = formGroup.value.arquivo as File | null;
      const anexoIdExistente = formGroup.value.id;

      if (anexoFile) {
        // Há um arquivo novo selecionado
        if (
          this.isEditMode &&
          anexoIdExistente &&
          !this.idsAnexosParaDeletar.includes(anexoIdExistente)
        ) {
          // Se está editando, o anexo original (com anexoIdExistente) tinha um arquivo.
          // Como um novo foi selecionado, o antigo precisa ser marcado para deleção.
          this.idsAnexosParaDeletar.push(anexoIdExistente);
        }
        // Cria o novo anexo com o novo arquivo.
      }
      // Não há lógica para atualizar metadados de anexos existentes sem mudar o arquivo.
    });

    this.limparListasDeDelecaoAposAdicionarOperacoes();
    return operacoesItens.length > 0 ? forkJoin(operacoesItens) : of([]);
  }

  private limparListasDeDelecaoAposAdicionarOperacoes(): void {
    this.idsServicosParaDeletar = [];
    this.idsPecasParaDeletar = [];
    this.idsAnexosParaDeletar = [];
  }

  private handleSuccess(message: string): void {
    console.log(message);
    //this.router.navigate(['/ordem-servico']); // Ajuste conforme sua rota de lista/dashboard
    this.isLoading = false;
    // Adicionar notificação visual de sucesso (ex: Toastr)
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.isLoading = false;
    // Adicionar notificação visual de erro
    this.toastService.error(
      `${message} Detalhes: ${error.message || error}`,
      8000
    );
  }

  goBack(): void {
    this.router.navigate(['/ordem-servico']);
    this.resetForm;
  }

  // Helpers para validação no template
  isInvalid(controlName: string, formGroup: FormGroup = this.form): boolean {
    const control = formGroup.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  isFormArrayControlInvalid(
    formArrayName: string,
    index: number,
    controlName: string
  ): boolean {
    const fa = this.form.get(formArrayName) as FormArray;
    if (fa && fa.controls[index]) {
      const control = fa.controls[index].get(controlName);
      return !!control && control.invalid && (control.dirty || control.touched);
    }
    return false;
  }

  // Para depuração de erros de formulário
  private collectFormErrors(form: FormGroup | FormArray): any {
    const errors: any = {};
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        const nestedErrors = this.collectFormErrors(control);
        if (Object.keys(nestedErrors).length > 0) {
          errors[key] = nestedErrors;
        }
      } else if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  // Exemplo de método showToast (adapte ao seu serviço de notificação)
  private showToast(
    message: string,
    type: 'success' | 'error' | 'warning' = 'success'
  ): void {
    console.log(`Toast: ${message} (type: ${type})`);
    // Implemente seu toast real aqui
  }

  // --- Lógica para Modal Novo Cliente (já implementada na resposta anterior) ---
  // --- Lógica para Modal Novo Cliente ---
  abrirModalNovoCliente(): void {
    if (isPlatformBrowser(this.platformId)) {
      // A flag `exibirConteudoModalCliente` será definida como true pelo evento 'show.bs.modal'
      this.modalClienteInstance?.show();
    } else {
      console.log(
        '[SSR] Tentativa de abrir modal de cliente no servidor (ignorado).'
      );
    }
  }

  fecharModalNovoClienteManual(): void {
    // Se o btn-close do modal não estiver funcionando via data-bs-dismiss
    if (isPlatformBrowser(this.platformId)) {
      this.modalClienteInstance?.hide();
    }
  }

  handleClienteCriado(clienteCriado?: Cliente): void {
    if (isPlatformBrowser(this.platformId)) {
      this.modalClienteInstance?.hide();
    }

    if (clienteCriado && clienteCriado.id) {
      this.showToast(`Cliente salvo com sucesso!`, 'success');
      this.form.get('id_cliente')?.setValue(clienteCriado.id);
    }
  }

  excluir(): void {
    const nome = this.form.get('codigo')?.value || 'esta OS';

    const config: ConfirmationConfig = {
      title: 'Confirmar Exclusão de Ordem de Serviço',
      message: `Tem certeza que deseja excluir a ordem de serviço "${nome}"?`,
      acceptButtonText: 'Sim, Excluir',
      acceptButtonClass: 'btn-danger',
      cancelButtonText: 'Não, Cancelar',
    };

    const sub = this.confirmationService
      .confirm(config)
      .subscribe((confirmado) => {
        if (confirmado && this.ordemServicoId) {
          this.isLoading = true;
          this.ordemServicoService.remover(this.ordemServicoId).subscribe({
            next: () => {
              this.toastService.success(
                `Ordem de Serviço "${nome}" excluída com sucesso.`
              );
              this.ordemServicoService.remover(this.ordemServicoId!);
              this.goBack();
              this.resetForm();
            },
            error: (err) => {
              this.toastService.error(
                err.message || 'Erro ao excluir Ordem de Serviço.'
              );
              this.isLoading = false;
            },
          });
        }
      });
  }

  resetForm(): void {
    this.form.reset();
    this.ordemServicoId = undefined;
    this.isEditMode = false;
  }

  isDataValida(data: string | Date | null | undefined): boolean {
    if (!data) return false;
    const dataObj = new Date(data);
    return dataObj.getFullYear() > 1900; // Evita 0001, 0000 etc.
  }

  salvarPeca(): void {
    if (!this.isEditMode || !this.ordemServicoId) return;

    if (!this.novaPeca.idPeca || this.novaPeca.quantidade <= 0) {
      this.toastService.warning(
        'Preencha todos os campos obrigatórios da peça.'
      );
      return;
    }

    this.novaPeca.idOrdemServico = this.ordemServicoId;
    this.novaPeca.valorTotal =
      this.novaPeca.quantidade * this.novaPeca.valorUnitario;
    this.novaPeca.valorMaoObra = 0;
  }

  resetarNovaPeca(): void {
    this.novaPeca = {
      idOrdemServico: this.ordemServicoId!,
      idPeca: null!,
      quantidade: 1,
      valorUnitario: 0,
      valorMaoObra: 0,
      valorTotal: 0,
      observacao: '',
    };
  }

  carregarPecasDaOs(): void {
    this.ordemServicoPecaService
      .obterPorOrdemServico(this.ordemServicoId!)
      .subscribe({
        next: (res) => {
          this.pecasAdicionadas = res.dados || [];
          this.recalcularValores(); // já existente no seu código
        },
        error: (err) =>
          this.toastService.error('Erro ao carregar peças: ' + err.message),
      });
  }

  calcularTotalPecas(): number {
    return this.pecasAdicionadas.reduce(
      (acc, p) => acc + (p.valorTotal || 0),
      0
    );
  }

  atualizarDataModificacao(data: Date): void {
    this.form.patchValue({ data_ultima_modificacao: data });
  }

  handleOsAtualizadaPeloFilho(osVindaDoFilho: OrdemServico): void {
    this.atualizarFormularioComDadosDaApi(osVindaDoFilho);
    this.ativarAba(this.abaAtiva);
  }

  // Certifique-se que este método também existe no seu componente
  private atualizarFormularioComDadosDaApi(os: OrdemServico): void {
    if (!os) return;

    // 1. Atualiza os totais e desconto no formulário
    this.form.patchValue({
      valor_total_servicos: os.valorServicos?.toFixed(2),
      valor_total_pecas: os.valorPecas?.toFixed(2),
      desconto: os.desconto?.toFixed(2) || 0,
      valor_total_orcamento: os.valorTotal?.toFixed(2),
    });

    // 2. ATUALIZA O CONTROLE DE CONCORRÊNCIA (CRÍTICO!)
    this.dataUltimaModificacaoOriginal = os.dataModificacao;

    // 3. ATUALIZA OS CAMPOS DE AUDITORIA NA TELA
    this.modificadorNome = os.modificadoPor || 'Não disponível';
    this.dataModificacaoDisplay = this.formatarDataParaDisplay(
      os.dataModificacao
    );

    // 4. Finaliza e notifica o usuário
    this.form.markAsPristine();
    this.toastService.success('Valores da OS sincronizados.');
  }

  setAbaAtiva(nomeAba: string): void {
    this.abaAtiva = nomeAba;
    console.log('Aba ativa agora é:', this.abaAtiva); // Ótimo para depuração
  }

  private ativarAba(nomeAba: string): void {
    setTimeout(() => {
      // Constrói o ID do botão dinamicamente. Ex: 'pecas' -> 'pecas-tab'
      const tabButtonId = `${nomeAba}-tab`;
      const tabButtonElement = document.getElementById(tabButtonId);

      if (tabButtonElement) {
        try {
          const tab = new bootstrap.Tab(tabButtonElement);
          tab.show();
        } catch (e) {
          console.error(`Erro ao tentar reativar a aba '${nomeAba}'.`, e);
        }
      } else {
        console.warn(
          `Botão da aba com ID '${tabButtonId}' não foi encontrado.`
        );
      }
    }, 0);
  }

  onOrdemAtualizada(ordem: OrdemServico): void {
    this.carregarOsParaEdicao(ordem.id!);
  }
  onDescontoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value || '';

    const numero = Number(rawValue.replace(/[^\d,-]/g, '').replace(',', '.'));

    this.form.get('desconto')?.setValue(isNaN(numero) ? 0 : numero);
  }

  recarregarDadosOs(): void {
    if (this.ordemServicoId) {
      this.toastService.info('Atualizando dados da OS...', undefined);
      this.carregarOsParaEdicao(this.ordemServicoId);
    }
  }

  carregarTransicoesDisponiveis(
    idWorkflow: number,
    idEstadoOrigem: number
  ): void {
    this.isTransicoesLoading = true;
    this.transicoesDisponiveis = []; // Limpa as ações antigas
    this.workflowService
      .obterTransicoesPossiveis(idWorkflow, idEstadoOrigem)
      .subscribe({
        next: (transicoes) => {
          this.transicoesDisponiveis = transicoes;
          console.log(transicoes);
          this.isTransicoesLoading = false;
        },
        error: () => {
          this.toastService.error(
            'Não foi possível carregar as ações disponíveis.'
          );
          this.isTransicoesLoading = false;
        },
      });
  }

  executarTransicao(transicao: TransicaoDisponivel): void {
    this.confirmationService
      .confirm({
        title: 'Confirmar Ação',
        message: `Tem certeza que deseja executar a ação "${transicao.nomeAcao}" e mover a OS para o estado "${transicao.nomeEstadoDestino}"?`,
      })
      .pipe(
        take(1)
      )
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isLoading = true;
          const formValue = this.form.getRawValue();

          // Pega o payload atual do formulário, mas sobrescreve o estado
          const osUpdatePayload: OrdemServicoAtualizacaoPayload = {
            codigo: formValue.codigo || undefined,
            valorTotal: parseFloat(formValue.valor_total_orcamento) || 0,
            dataRetirada: formValue.data_saida || null,
            dataExecucao: formValue.data_execucao || null,
            dataConclusao: formValue.data_conclusao || null,
            descricaoProblema: formValue.defeito_relatado_cliente,
            diagnosticoTecnico:
              formValue.defeito_constatado_tecnico || undefined,
            observacoes: formValue.observacoes_gerais || undefined,
            dataInicioGarantia: formValue.data_inicio_garantia || null,
            dataFimGarantia: formValue.data_expiracao_garantia || null,
            idPrazoGarantia: formValue.id_prazo_garantia || undefined,
            idCliente: formValue.id_cliente,
            idAparelho: formValue.id_aparelho,
            idEmpresa: formValue.id_empresa ?? this.empresas[0]?.id,
            pagamentoRealizado: formValue.pagamento_realizado || false,
            formaPagamento: formValue.forma_pagamento || undefined,
            valorServicos: parseFloat(formValue.valor_total_servicos) || 0,
            valorPecas: parseFloat(formValue.valor_total_pecas) || 0,
            idAtendente: formValue.id_atendente,
            idTecnico: formValue.id_tecnico,
            desconto: parseFloat(formValue.desconto) || 0,
            id: this.ordemServicoId!,
            idEstado: transicao.idEstadoDestino, // <-- O NOVO ESTADO!
            dataUltimaModificacao: this.dataUltimaModificacaoOriginal!,
            idWorkflow: this.idWorkflowOs!,
            // ... resto dos campos
          };

          this.ordemServicoService
            .atualizar(this.ordemServicoId!, osUpdatePayload)
            .subscribe({
              next: () => {
                this.toastService.success(
                  `OS movida para "${transicao.nomeEstadoDestino}" com sucesso!`
                );

                this.carregarOsParaEdicao(this.ordemServicoId!);
                this.isLoading = false;

              },
              error: (err) => {
                this.handleError('Erro ao executar transição:', err);
              },
            });
        }
      });
  }

  private definirClasseBadgeStatus(statusNome?: string): string {
    if (!statusNome) {
      return 'bg-secondary'; // Cor padrão para casos inesperados
    }

    switch (statusNome) {
      case 'Recebida':
      case 'Em Análise':
      case 'Em Execução':
        return 'bg-info'; // Estados de progresso ativo

      case 'Aguardando Aprovação':
        return 'bg-warning text-dark'; // Estado de atenção que requer ação

      case 'Aprovada':
        return 'bg-primary'; // Um marco positivo

      case 'Finalizada':
      case 'Entregue':
        return 'bg-success'; // Estados de sucesso/conclusão

      case 'Cancelada':
        return 'bg-danger'; // Estado de falha/cancelamento

      case 'Pausada':
      case 'Reaberta':
        return 'bg-dark'; // Estados especiais ou neutros

      default:
        return 'bg-secondary'; // Cor padrão para qualquer outro estado
    }
  }

  atualizarDesconto(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let valorString = inputElement.value;

    // Converte a string do formato brasileiro para um número válido em JS
    // Remove pontos de milhar e substitui a vírgula decimal por ponto
    valorString = valorString.replace(/\./g, '').replace(',', '.');

    const valorNumerico = parseFloat(valorString);

    // Atualiza o formControl com o número, ou 0 se for inválido
    if (!isNaN(valorNumerico)) {
      this.form.get('desconto')?.setValue(valorNumerico);
    } else {
      this.form.get('desconto')?.setValue(0);
    }
  }

  formatarCampoDesconto(): void {
    const controleDesconto = this.form.get('desconto');
    if (controleDesconto) {
      // Para evitar um loop infinito, só formatamos se o valor não for uma string já formatada
      let valor = controleDesconto.value;
      if (typeof valor !== 'string') {
        // A formatação aqui é apenas para consistência, mas o input[type=number] lida com isso.
        // O importante é que a lógica de cálculo use o valor numérico correto.
        // Esta função se torna mais um placeholder para futuras lógicas de máscara se necessário.
      }
    }
  }

  getAsteriskClass(controlName: string): any {
    const control = this.form.get(controlName);
    // Se o campo for inválido E já foi tocado/modificado, o asterisco fica vermelho.
    // Caso contrário, fica com a cor padrão de texto.
    if (control && control.errors && (control.dirty || control.touched)) {
      return { 'text-danger': true };
    }
    return {};
  }

    private toLocalDate(dateString: string | null | undefined): Date | null {
    if (!dateString) {
      return null;
    }
    // Adicionar 'T00:00:00' força o JavaScript a interpretar a data na hora local,
    // em vez do padrão UTC, o que resolve o problema de conversão de fuso horário.
    return new Date(`${dateString}T00:00:00`);
  }


}
