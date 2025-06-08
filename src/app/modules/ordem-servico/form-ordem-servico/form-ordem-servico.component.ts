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
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select'; // Necessário se o HTML final usar ng-select
import { forkJoin, Observable, of, Subscription, throwError } from 'rxjs';
import { switchMap, catchError, tap, map, startWith } from 'rxjs/operators';

import { Cliente } from '../../../Models/cliente.model';
import { Aparelho } from '../../../Models/aparelho.model';
import { Empresa } from '../../../Models/empresa.model';
import { PrazoGarantia } from '../../../Models/prazo_garantia.model';

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

import { OsServico } from '../../../Models/ordem-servico/os-servico.model';
import { OsPeca } from '../../../Models/ordem-servico/os-peca.model';
import {
  OrdemServico,
  OrdemServicoAtualizacaoPayload,
  OrdemServicoCriacaoPayload,
} from '../../../Models/ordem-servico/ordem_servico.model';
import { OsAnexo } from '../../../Models/ordem-servico/os-anexos.model';
import { Mode } from 'fs';
import { ModeloService } from '../../../services/modelo.service';
import { FormClienteComponent } from '../../cliente/pages/form-cliente/form-cliente.component';
import { FormAparelhoComponent } from '../../aparelho/pages/form-aparelho/form-aparelho.component';
import { OrdemServicoService } from '../../../services/ordem-servico/ordem-servico.service';
import { OsServicoService } from '../../../services/ordem-servico/os-servico.service';
import { OsPecaService } from '../../../services/ordem-servico/os-peca.service';
import { OsAnexoService } from '../../../services/ordem-servico/os-anexo.service';
import { ToastService } from '../../../services/toast.service';
import { UsuarioService } from '../../../services/usuario.service';
import { ConfirmationConfig } from '../../../Models/confirmation.model';
import { limparDatasInvalidas } from '../../../shared/helpers/form-helpers.';

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
  prazosGarantia: { id: number; descricao: string; prazoEmDias?: number }[] =
    [];
  servicosDisponiveis: { id: number; descricao: string; valor?: number }[] = [];
  pecasDisponiveis: { id: number; descricao: string; precoVenda?: number }[] =
    [];
  marcas: { id: number; descricao: string }[] = [];
  modelos: { id: number; descricao: string }[] = [];

  private idsServicosParaDeletar: number[] = [];
  private idsPecasParaDeletar: number[] = [];
  private idsAnexosParaDeletar: number[] = [];

  private subscriptions = new Subscription();

  @ViewChild('modalNovoClienteOsRef') modalNovoClienteRef!: ElementRef;
  private modalClienteInstance: any; // Ou bootstrap.Modal se tiver os types e funcionar
  exibirConteudoModalCliente = false; // Para controlar o *ngIf do conteúdo do modal

  @ViewChild('modalNovoAparelhoOsRef') modalNovoAparelhoOsRef!: ElementRef;
  private modalAparelhoOsInstance: any; // Ou bootstrap.Modal
  exibirConteudoModalAparelhoOs = false;
  editandoAparelhoOsId: number | undefined = undefined;

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
    private osServicoService: OsServicoService,
    private osPecaService: OsPecaService,
    private osAnexoService: OsAnexoService,
    private marcaService: MarcaService,
    private modeloService: ModeloService,
    private servicoService: ServicoService,
    private usuarioService: UsuarioService,
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

    const dataConclusaoChangesSub = this.form
      .get('data_conclusao')
      ?.valueChanges.subscribe(() => {
        this.calculateDataExpiracaoGarantia();
      });
    this.subscriptions.add(dataConclusaoChangesSub);

    const servicosChangesSub = this.osServicos.valueChanges.subscribe(() =>
      this.calculateAllTotals()
    );
    const pecasChangesSub = this.osPecas.valueChanges.subscribe(() =>
      this.calculateAllTotals()
    );
    this.subscriptions.add(servicosChangesSub);
    this.subscriptions.add(pecasChangesSub);
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

      // FormArrays
      os_servicos: this.fb.array([]),
      os_pecas: this.fb.array([]),
      os_anexos: this.fb.array([]),
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
    this.editandoAparelhoOsId = aparelhoId; // Define se está editando ou criando novo
    // A flag exibirConteudoModalAparelhoOs será true pelo evento 'show.bs.modal'
    if (isPlatformBrowser(this.platformId)) {
      // Um pequeno timeout pode ajudar se o *ngIf precisar de um ciclo para renderizar o conteúdo
      // antes do Bootstrap JS calcular o tamanho do modal.
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
      // Serviço: Mapeia nome para descricao
      this.servicoService.obterParaSelecao().pipe(
        map((data) =>
          data.map((item) => ({
            id: item.id,
            descricao: item.nome,
            valor: item.valor,
          }))
        ),
        tap((data) => (this.servicosDisponiveis = data))
      ),
      // Peça: Já usa 'descricao'
      this.catalogoPecaService.obterParaSelecao().pipe(
        map((data) =>
          data.map((item) => ({
            id: item.id,
            descricao: item.descricao,
            precoVenda: item.precoVenda,
          }))
        ),
        tap((data) => (this.pecasDisponiveis = data))
      ),
      // Marca: Já usa 'descricao'
      this.marcaService.obterParaSelecao().pipe(
        tap((data) => (this.marcas = data)) // Supondo que o serviço já retorna { id, descricao }
      ),
      // Modelo: Já usa 'descricao'
      this.modeloService.obterParaSelecao().pipe(
        tap((data) => (this.modelos = data)) // Supondo que o serviço já retorna { id, descricao }
      ),
    ];

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

   console.log(`--- INICIANDO carregarOsParaEdicao com ID: ${idOs} ---`);
  this.ordemServicoService.obterPorId(idOs).subscribe({
    next: (ordem) => {

      console.log('DADOS BRUTOS RECEBIDOS DA API:', ordem);
      limparDatasInvalidas(ordem, [
        'dataEntrada',
        'dataRetirada',
        'dataExecucao',
        'dataConclusao',
        'dataSaida',
        'dataExpiracaoGarantia',
        'dataInicioGarantia', // <--- ESTE CAMPO PRECISA ESTAR AQUI
        'dataFimGarantia' 
      ]);

      console.log('DADOS APÓS LIMPAR DATAS INVÁLIDAS:', ordem);

          this.form.patchValue({
        id: ordem?.id,
        codigo: ordem?.codigo,
        pagamento_realizado: ordem?.pagamentoRealizado,
        forma_pagamento: ordem?.formaPagamento,
        observacoes_gerais: ordem?.observacoes,
        id_empresa: ordem?.idEmpresa,
        id_cliente: ordem?.idCliente,
        id_aparelho: ordem?.idAparelho,
        id_atendente: ordem?.idAtendente,
        id_tecnico: ordem?.idTecnico,
        id_prazo_garantia: ordem?.idPrazoGarantia,
        id_status_os: ordem?.idEstado,
        defeito_relatado_cliente: ordem?.descricaoProblema,
        defeito_constatado_tecnico: ordem?.diagnosticoTecnico,

        // Formata as datas válidas e mantém as nulas
        data_entrada: ordem?.dataCriacao ? new Date(ordem.dataCriacao).toISOString().substring(0, 10) : null,
        data_execucao: ordem?.dataExecucao ? new Date(ordem.dataExecucao).toISOString().substring(0, 10) : null,
        data_conclusao: ordem?.dataConclusao ? new Date(ordem.dataConclusao).toISOString().substring(0, 10) : null,
        data_saida: ordem?.dataRetirada ? new Date(ordem.dataRetirada).toISOString().substring(0, 10) : null,
        data_expiracao_garantia: ordem?.dataFimGarantia ? new Date(ordem.dataFimGarantia).toISOString().substring(0, 10) : null,
      });

      this.dataUltimaModificacaoOriginal = ordem!.dataModificacao;
      this.idEstadoOs = ordem!.idEstado;
      this.idWorkflowOs = ordem!.idWorkflow;
    },
    error: (err) =>
      this.toastService.error(`Erro ao carregar OS: ${err.error?.message}`),
  });
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
    const dataConclusaoStr = this.form.get('data_conclusao')?.value;

    if (prazoId && dataConclusaoStr) {
      const dataConclusao = new Date(dataConclusaoStr);

      if (!isNaN(dataConclusao.getTime())) {
        this.prazoGarantiaService
          .obterPorId(prazoId)
          .subscribe((prazoSelecionado) => {
            if (prazoSelecionado?.prazoEmDias) {
              const dataExpiracao = new Date(dataConclusao);
              dataExpiracao.setDate(
                dataConclusao.getDate() + prazoSelecionado.prazoEmDias
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
          });

          if (os.idCliente) this.onClienteChange(os.idCliente);
          this.applyEmpresaRule();
        }),
        switchMap((os) => {
          if (!os || !this.ordemServicoId)
            return throwError(() => new Error('ID da OS principal inválido.'));
          return forkJoin({
            osPrincipal: of(os),
            loadedOsServicos: this.osServicoService
              .getServicosByOsId(this.ordemServicoId)
              .pipe(catchError(() => of([] as OsServico[]))),
            loadedOsPecas: this.osPecaService
              .getPecasByOsId(this.ordemServicoId)
              .pipe(catchError(() => of([] as OsPeca[]))),
            // loadedOsAnexos: this.osAnexoService
            //   .getAnexosByOsId(this.ordemServicoId)
            //   .pipe(catchError(() => of([] as OsAnexoMetadata[]))),
          });
        })
      )
      .subscribe({
        next: ({
          osPrincipal,
          loadedOsServicos,
          loadedOsPecas,
          //loadedOsAnexos,
        }) => {
          this.osServicos.clear();
          this.idsServicosParaDeletar = [];
          loadedOsServicos.forEach((s) =>
            this.addServico(
              {
                id: s.id,
                id_servico: s.id_servico,
                quantidade: s.quantidade,
                valor_unitario: s.valor_unitario,
              },
              false
            )
          );

          this.osPecas.clear();
          this.idsPecasParaDeletar = [];
          loadedOsPecas.forEach((p) =>
            this.addPeca(
              {
                id: p.id,
                id_peca: p.id_peca,
                quantidade: p.quantidade,
                valor_unitario: p.valor_unitario,
              },
              false
            )
          );

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
          this.calculateAllTotals();
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

  addServico(servicoData?: OsServico, markAsDirty = true): void {
    const servicoForm = this.fb.group({
      id: [servicoData?.id || null],
      id_servico_catalogo: [
        servicoData?.id_servico || null,
        Validators.required,
      ],
      quantidade: [
        servicoData?.quantidade || 1,
        [Validators.required, Validators.min(1)],
      ],
      valor_unitario: [
        servicoData?.valor_unitario || 0,
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

  // --- FormArray de Peças ---
  get osPecas(): FormArray {
    return this.form.get('os_pecas') as FormArray;
  }

  addPeca(pecaData?: OsPeca, markAsDirty = true): void {
    const pecaForm = this.fb.group({
      id: [pecaData?.id || null],
      id_peca_catalogo: [pecaData?.id_peca || null, Validators.required],
      quantidade: [
        pecaData?.quantidade || 1,
        [Validators.required, Validators.min(1)],
      ],
      valor_unitario: [
        pecaData?.valor_unitario || 0,
        [Validators.required, Validators.min(0)],
      ],
      valor_total_calculado: [{ value: 0, disabled: true }],
    });

    const subId = pecaForm
      .get('id_peca_catalogo')
      ?.valueChanges.pipe(startWith(pecaForm.get('id_peca_catalogo')?.value))
      .subscribe((pecaId) => {
        if (pecaId) {
          const catPeca = this.pecasDisponiveis.find((p) => p.id === pecaId);
          if (catPeca && typeof catPeca.precoVenda === 'number') {
            pecaForm.get('valor_unitario')?.setValue(catPeca.precoVenda);
          }
        }
        this.updateSubtotalItem(
          pecaForm,
          'quantidade',
          'valor_unitario',
          'valor_total_calculado'
        );
      });
    this.subscriptions.add(subId);

    const subQty = pecaForm
      .get('quantidade')
      ?.valueChanges.subscribe(() =>
        this.updateSubtotalItem(
          pecaForm,
          'quantidade',
          'valor_unitario',
          'valor_total_calculado'
        )
      );
    const subVal = pecaForm
      .get('valor_unitario')
      ?.valueChanges.subscribe(() =>
        this.updateSubtotalItem(
          pecaForm,
          'quantidade',
          'valor_unitario',
          'valor_total_calculado'
        )
      );
    this.subscriptions.add(subQty);
    this.subscriptions.add(subVal);

    if (pecaData)
      this.updateSubtotalItem(
        pecaForm,
        'quantidade',
        'valor_unitario',
        'valor_total_calculado'
      );

    this.osPecas.push(pecaForm);
    if (markAsDirty) this.form.markAsDirty();
  }

  removePeca(index: number): void {
    const itemId = (this.osPecas.at(index) as FormGroup).get('id')?.value;
    if (this.isEditMode && itemId) this.idsPecasParaDeletar.push(itemId);
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

  addAnexo(anexoData?: OsAnexo, markAsDirty = true): void {
    const anexoForm = this.fb.group({
      id: [anexoData?.id || null],
      nome_arquivo: [anexoData?.nome_arquivo || '', Validators.required],
      data_upload: [anexoData?.data_upload || null],
    });
    if (anexoData && anexoData.id && !anexoData.stream_anexo) {
      // Existente
      anexoForm.get('arquivo')?.clearValidators();
    } else {
      // Novo
      anexoForm.get('arquivo')?.setValidators(Validators.required);
    }
    anexoForm.get('arquivo')?.updateValueAndValidity();
    this.osAnexos.push(anexoForm);
    if (markAsDirty) this.form.markAsDirty();
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

  downloadAnexo(anexoIndex: number): void {
    // Implementação de download (como na resposta anterior)
    const anexoFormGroup = this.osAnexos.at(anexoIndex) as FormGroup;
    const anexoId = anexoFormGroup.get('id')?.value;
    const nomeArquivo = anexoFormGroup.get('nome_arquivo')?.value;
    const localFile = anexoFormGroup.get('arquivo')?.value as File | null;

    if (anexoId && nomeArquivo && !localFile) {
      // Anexo existente no servidor
      this.isLoading = true;
      this.osAnexoService.getOsAnexoConteudo(anexoId).subscribe({
        next: (blob) => {
          if (blob) this.triggerDownload(blob, nomeArquivo);
          else console.error('Download falhou: blob nulo.');
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Erro ao baixar anexo:', err);
        },
      });
    } else if (localFile) {
      // Arquivo novo, local
      this.triggerDownload(localFile, localFile.name);
    } else {
      console.warn('Não é possível baixar: anexo sem ID ou arquivo local.');
    }
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  calculateAllTotals(): void {
    let totalServicos = 0;
    this.osServicos.controls.forEach((ctrl) => {
      const formGroup = ctrl as FormGroup;
      totalServicos +=
        (formGroup.get('quantidade')?.value || 0) *
        (formGroup.get('valor_unitario')?.value || 0);
    });
    this.form.get('valor_total_servicos')?.setValue(totalServicos.toFixed(2));

    let totalPecas = 0;
    this.osPecas.controls.forEach((ctrl) => {
      const formGroup = ctrl as FormGroup;
      totalPecas +=
        (formGroup.get('quantidade')?.value || 0) *
        (formGroup.get('valor_unitario')?.value || 0);
    });
    this.form.get('valor_total_pecas')?.setValue(totalPecas.toFixed(2));

    const valorTotalOrcamento = totalServicos + totalPecas;
    this.form
      .get('valor_total_orcamento')
      ?.setValue(valorTotalOrcamento.toFixed(2));
    // Atualiza o valor_total principal da OS, que é o que vai para o backend.
    this.form.get('valor_total')?.setValue(valorTotalOrcamento);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error(
        `Formulário inválido. Verifique os campos destacados: \n${
          this.form.errors
        } \n ${this.collectFormErrors(this.form)}`
      );
      return;
    }
    this.isLoading = true;
    const formValue = this.form.getRawValue();

    // Mapear dados do formulário para o modelo OrdemServico
    const osPayload: OrdemServicoCriacaoPayload = {
      codigo: formValue.codigo || undefined,
      valorTotal: parseFloat(formValue.valor_total_orcamento) || 0,
      dataRetirada: formValue.data_saida
        ? formValue.data_saida
        : null,
      dataExecucao: formValue.data_execucao
        ? new Date(formValue.data_execucao)
        : null,
      dataConclusao: formValue.data_conclusao
        ? formValue.data_conclusao
        : null,
      descricaoProblema: formValue.defeito_relatado_cliente,
      diagnosticoTecnico: formValue.defeito_constatado_tecnico || undefined,
      observacoes: formValue.observacoes_gerais || undefined,
      dataInicioGarantia: formValue.data_conclusao
        ? formValue.data_conclusao
        : null,
      dataFimGarantia: formValue.data_expiracao_garantia
        ? formValue.data_expiracao_garantia
        : null,
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
    };

    if (this.isEditMode && this.ordemServicoId) {
      const osUpdatePayload: OrdemServicoAtualizacaoPayload = {
        ...osPayload,
        id: this.ordemServicoId!,
        dataUltimaModificacao: this.dataUltimaModificacaoOriginal!,
        idEstado: this.idEstadoOs, // ou this.dataModificacaoOriginal
        idWorkflow: this.idWorkflowOs,
      };

      limparDatasInvalidas(this.isEditMode ? osPayload : osUpdatePayload, [
          'dataConclusao',
          'dataRetirada',
          'dataExecucao',
          'dataInicioGarantia',
          'dataFimGarantia',
          'data_saida',
          'data_entrada',
          'data_expiracao_garantia',
      ]);

      this.ordemServicoService
        .atualizar(this.ordemServicoId, osUpdatePayload)
        .pipe(switchMap(() => this.processarItensDaOs(this.ordemServicoId!)))
        .subscribe({
          next: () => {
            this.handleSuccess('Ordem de Serviço e itens atualizados.');
          },
          error: (err) => {
            this.handleError('Erro ao atualizar OS:', err);
          },
        });
    } else {
      this.ordemServicoService;
      this.ordemServicoService
        .criar(osPayload)
        .pipe(
          switchMap((osCriada) => {
            if (!osCriada || !osCriada.id)
              return throwError(
                () => new Error('Falha ao criar OS ou ID não retornado.')
              );

            // Atualiza o formulário com o retorno do backend
            this.form.patchValue({
              id: osCriada.id,
              codigo: osCriada.codigo,
              dataUltimaModificacao: osCriada.dataModificacao, // ou outro nome conforme retorno
            });

            this.ordemServicoId = osCriada.id;
            this.isEditMode = true; // Agora é modo edição

            return this.processarItensDaOs(osCriada.id, true);
          })
        )
        .subscribe({
          next: () => {
            this.toastService.success(
              'Ordem de Serviço e itens criados com sucesso.'
            );
          },
          error: (err) => {
            this.handleError('Erro ao criar OS:', err);
          },
          complete: () => {
            this.isLoading = false; // Garanta que o loading pare aqui também
          },
        });
    }
  }

  private processarItensDaOs(
    osId: number,
    isCriacaoTotal: boolean = false
  ): Observable<any[]> {
    const operacoesItens: Observable<any>[] = [];

    // Serviços
    this.osServicos.controls.forEach((ctrl) => {
      const formGroup = ctrl as FormGroup;
      if (isCriacaoTotal || !formGroup.value.id || formGroup.dirty) {
        const servicoItem: OsServico = {
          id: formGroup.value.id || undefined,
          id_os: osId,
          id_servico: formGroup.value.id_servico_catalogo, // FK para o catálogo
          quantidade: formGroup.value.quantidade,
          valor_unitario: formGroup.value.valor_unitario,
          valor_total:
            (formGroup.value.quantidade || 0) *
            (formGroup.value.valor_unitario || 0),
        };
        if (!servicoItem.id)
          operacoesItens.push(
            this.osServicoService.createOsServico(servicoItem)
          );
        else if (formGroup.dirty)
          operacoesItens.push(
            this.osServicoService.updateOsServico(servicoItem.id!, servicoItem)
          );
      }
    });
    this.idsServicosParaDeletar.forEach((id) =>
      operacoesItens.push(this.osServicoService.deleteOsServico(id))
    );

    // Peças
    this.osPecas.controls.forEach((ctrl) => {
      const formGroup = ctrl as FormGroup;
      if (isCriacaoTotal || !formGroup.value.id || formGroup.dirty) {
        const pecaItem: OsPeca = {
          id: formGroup.value.id || undefined,
          id_os: osId,
          id_peca: formGroup.value.id_peca_catalogo, // FK para o catálogo
          quantidade: formGroup.value.quantidade,
          valor_unitario: formGroup.value.valor_unitario,
          valor_total:
            (formGroup.value.quantidade || 0) *
            (formGroup.value.valor_unitario || 0),
        };
        if (!pecaItem.id)
          operacoesItens.push(this.osPecaService.createOsPeca(pecaItem));
        else if (formGroup.dirty)
          operacoesItens.push(
            this.osPecaService.updateOsPeca(pecaItem.id!, pecaItem)
          );
      }
    });
    this.idsPecasParaDeletar.forEach((id) =>
      operacoesItens.push(this.osPecaService.deleteOsPeca(id))
    );

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
        operacoesItens.push(
          this.osAnexoService.createOsAnexo(
            osId,
            anexoFile,
            formGroup.value.nome_arquivo
          )
        );
      }
      // Não há lógica para atualizar metadados de anexos existentes sem mudar o arquivo.
    });
    this.idsAnexosParaDeletar.forEach((id) =>
      operacoesItens.push(this.osAnexoService.deleteOsAnexo(id))
    );

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
}
