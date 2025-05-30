import { Component, EventEmitter, inject, Input, OnInit, Output, OnDestroy, Inject, PLATFORM_ID } from '@angular/core'; // Adicionado OnDestroy
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // FormsModule e NgModel não são necessários com ReactiveForms
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ClienteService } from '../../../../services/cliente.service';
import { Cliente } from '../../../../Models/cliente.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // Adicionado RouterModule se houver routerLink no template
import { CommonModule } from '@angular/common'; // NgIf vem do CommonModule
import { FormAparelhoComponent } from '../../../aparelho/pages/form-aparelho/form-aparelho.component';
import { AparelhoService } from '../../../../services/aparelho.service';
import { Aparelho } from '../../../../Models/aparelho.model';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';
import { Marca } from '../../../../Models/marca.model';
import { Modelo } from '../../../../Models/modelo.model';
import { Subscription } from 'rxjs'; // Adicionado Subscription
import bootstrap from 'bootstrap';



@Component({
    selector: 'app-form-cliente',
    // Corrigido imports: [NgIf] estava em um array aninhado desnecessário.
    // HttpClientModule é geralmente importado no app.config ou AppModule principal.
    // Se FormAparelhoComponent for usado no template de FormClienteComponent, ele deve estar aqui.
    imports: [CommonModule, ReactiveFormsModule, FormAparelhoComponent, RouterModule, HttpClientModule],
    standalone: true,
    templateUrl: './form-cliente.component.html',
    styleUrls: ['./form-cliente.component.css']
})
export class FormClienteComponent implements OnInit, OnDestroy {

  @Input() isModal: boolean = false;
  @Output() clienteSalvo = new EventEmitter<Cliente | undefined>(); // Pode emitir undefined ao cancelar

  private fb = inject(FormBuilder); // fb já estava no seu código original
  isEditando = false; // Renomeado de isEditMode para consistência com seu código
  clienteId: number | undefined; // Mantido do seu código original
  // editingClienteId: number | null = null; // Redundante se clienteId for usado para o mesmo propósito
  form!: FormGroup;
  isLoading = false; // Adicionado para feedback de carregamento
  loadingCep = false;
  cepError = '';
  aparelhoService: AparelhoService = inject(AparelhoService); // Já estava no seu código
  aparelhos: Aparelho[] = [];
  marcas: Marca[] = []; // Tipado corretamente
  modelos: Modelo[] = []; // Tipado corretamente
  private carregouMarcas = false;
  private carregouModelos = false;
  // private carregando = false; // Substituído por isLoading global

  abaSelecionada = 'dados'; // Inicializa com dados, pode ser 'aparelhos'
  showAparelhoForm = false;

  private subscriptions = new Subscription(); // Para gerenciar subscriptions

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient, // Para ViaCEP
    private clienteService: ClienteService,
    private route: ActivatedRoute,
    private router: Router,
    private marcaService: MarcaService,
    private modeloService: ModeloService
  ) {
    // A inicialização do form foi movida para initForm() para consistência
  }

  ngOnInit(): void {

    this.initForm(); // Inicializa o formulário
    // Se não estiver em modo modal E houver um ID na rota, carrega para edição.
    // Se estiver em modo modal para CRIAÇÃO, não haverá ID na rota, então ele começa limpo.
    if (!this.isModal) {
      const routeSub = this.route.paramMap.subscribe(params => {
        const idParam = params.get('id');
        if (idParam) {
          this.clienteId = +idParam;
          this.isEditando = true;
          this.carregarCliente(this.clienteId);
          // Carregar dados relacionados apenas se estiver editando e não for modal
          this.carregarAparelhosDoCliente(this.clienteId);
          this.carregarMarcas();
          this.carregarModelos();
        } else {
          this.isEditando = false;
          this.form.patchValue({ ativo: true }); // Default para novo cliente
        }
      });
      this.subscriptions.add(routeSub);
    } else {
      // Em modo modal, se for para criação, o formulário já está limpo.
      // Se fosse para edição em modal, precisaria de um @Input() clienteParaEditar.
      // Por agora, assumimos que o modal é sempre para NOVO cliente.
      this.isEditando = false; // Garante que não está em modo de edição
      this.clienteId = undefined;
      this.form.patchValue({ ativo: true });
    }
  }

  initForm(cliente?: Cliente): void { // Método para (re)inicializar o formulário
    this.form = this.fb.group({
      // Usando os campos do seu FormGroup original
      nome_completo: [cliente?.nome_completo || '', [Validators.required, Validators.minLength(3)]],
      apelido: [cliente?.apelido || ''],
      cep: [cliente?.cep || ''],
      cidade: [cliente?.cidade || ''],
      logradouro: [cliente?.logradouro || ''],
      numero: [cliente?.numero || ''],
      complemento: [cliente?.complemento || ''],
      bairro: [cliente?.bairro || ''],
      uf: [cliente?.uf || ''],
      pais: [cliente?.pais || 'Brasil'], // Default 'Brasil'
      telefone_principal: [cliente?.telefone || ''], // Renomeado de 'telefone'
      celular: [cliente?.celular || '', Validators.required],
      email: [cliente?.email || '', [Validators.required, Validators.email]],
      tipo_de_pessoa: [cliente?.tipo_de_pessoa || 'F'], // Default 'F' (Física)
      ativo: [cliente ? cliente.ativo : true]
    });
  }


  // Seus métodos carregarMarcas, carregarModelos, carregarAparelhosDoCliente,
  // getNomeMarca, getNomeModelo, excluir, editarAparelho permanecem os mesmos.

  abrirFormularioAparelho() {
    if (!this.clienteId && !this.isModal) {
        this.showToast('Salve o cliente antes de adicionar aparelhos.', 'error');
        return;
    }
    this.showAparelhoForm = true;
  }

  aoSalvarOuCancelarAparelho(): void {
    this.showAparelhoForm = false;
    if (this.clienteId) {
        this.carregarAparelhosDoCliente(this.clienteId);
    }
  }

  carregarCliente(id: number): void {
    this.isLoading = true;
    const clienteSub = this.clienteService.getClienteById(id).subscribe(cliente => {
      if (cliente) {
        this.initForm(cliente); // Popula o formulário
      } else {
        this.showToast('Cliente não encontrado.', 'error');
        if (!this.isModal) this.router.navigate(['/cliente']);
      }
      this.isLoading = false;
    }, error => {
      this.showToast('Erro ao carregar cliente.', 'error');
      console.error(error);
      this.isLoading = false;
      if (!this.isModal) this.router.navigate(['/cliente']);
    });
    this.subscriptions.add(clienteSub);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showToast('Formulário inválido. Verifique os campos.', 'error');
      return;
    }

    this.isLoading = true;
    const clienteData = this.form.getRawValue() as Cliente;

    // Ajuste para usar 'this.clienteId' para edição, que é populado em ngOnInit ou carregarCliente
    if (this.isEditando && this.clienteId) {
      const updateSub = this.clienteService.updateCliente(this.clienteId, clienteData).subscribe({
        next: (clienteAtualizado) => {
          this.showToast('Cliente atualizado com sucesso!');
          this.isLoading = false;
          if (this.isModal) {
            this.clienteSalvo.emit(clienteAtualizado);
          } else {
            this.router.navigate(['/cliente']);
          }
        },
        error: (error) => {
          this.showToast('Erro ao atualizar cliente.', 'error');
          console.error(error);
          this.isLoading = false;
        }
      });
      this.subscriptions.add(updateSub);
    } else { // Criação
      // Certifique-se que o ID não seja enviado na criação
      const { id, ...clienteParaCriar } = clienteData;
      const addSub = this.clienteService.addCliente(clienteParaCriar as Cliente).subscribe({
        next: (clienteCriado) => {
          this.showToast('Cliente salvo com sucesso!');
          this.isLoading = false;
          if (this.isModal) {
            this.clienteSalvo.emit(clienteCriado);
          } else {
            this.form.reset({ ativo: true }); // Limpa o formulário para um novo cadastro
            this.router.navigate(['/cliente']); // Ou para a lista, ou para o form do cliente criado
          }
        },
        error: (error) => {
          this.showToast('Erro ao salvar cliente.', 'error');
          console.error(error);
          this.isLoading = false;
        }
      });
      this.subscriptions.add(addSub);
    }
  }

  onCancelar(): void {
    if (this.isModal) {
      this.clienteSalvo.emit(undefined); // Emite undefined para o FormOrdemServicoComponent fechar o modal
    } else {
      this.form.reset();
      this.isEditando = false;
      this.clienteId = undefined;
      this.router.navigate(['/cliente']);
    }
  }

  onExcluir(): void {
    if (this.clienteId && confirm('Tem certeza que deseja excluir este cliente?')) {
      this.isLoading = true;
      const deleteSub = this.clienteService.deleteCliente(this.clienteId).subscribe({
        next: () => {
          this.showToast('Cliente excluído com sucesso!');
          this.isLoading = false;
          if (this.isModal) {
             this.clienteSalvo.emit(undefined); // Indica que algo aconteceu, talvez precise recarregar a lista na OS
          } else {
            this.router.navigate(['/cliente']);
          }
        },
        error: (error) => {
          this.showToast('Erro ao excluir cliente.', 'error');
          console.error(error);
          this.isLoading = false;
        }
      });
      this.subscriptions.add(deleteSub);
    }
  }

  // onCepBlur e showToast permanecem como no seu código original

  onCepBlur() {
    const cep = this.form.value.cep?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
        this.limparCamposEndereco();
        return;
    }

    this.loadingCep = true;
    this.cepError = '';

    const cepSub = this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
        next: (data) => {
            if (data.erro) {
                this.cepError = 'CEP não encontrado.';
                this.limparCamposEndereco(cep); // Mantém o CEP digitado
            } else {
                this.form.patchValue({
                    cidade: data.localidade || '',
                    logradouro: data.logradouro || '',
                    bairro: data.bairro || '',
                    uf: data.uf || '',
                    pais: 'Brasil', // ViaCEP é para o Brasil
                    complemento: data.complemento || ''
                });
            }
            this.loadingCep = false;
        },
        error: (err) => {
            console.error('Erro ao consultar CEP:', err);
            this.cepError = 'Erro ao consultar CEP.';
            this.limparCamposEndereco(cep);
            this.loadingCep = false;
        }
    });
    this.subscriptions.add(cepSub);
  }

  private limparCamposEndereco(cepMantido?: string): void {
      this.form.patchValue({
          cidade: '',
          logradouro: '',
          bairro: '',
          uf: '',
          pais: 'Brasil',
          complemento: '',
          cep: cepMantido || '' // Mantém o CEP se fornecido, senão limpa
      });
  }

  showToast(message: string, alertType: 'success' | 'error' | 'warning' = 'success') {
    // Adapte para seu sistema de toast real. Este é um placeholder.
    const toastEl = document.getElementById('liveToast'); // Certifique-se que existe um elemento com este ID no seu HTML principal (ex: app.component.html)
    if (toastEl) {
        const toastBody = toastEl.querySelector('.toast-body');
        if (toastBody) {
            toastBody.textContent = message;
        }
        // Remove classes de contexto antigas e adiciona a nova
        toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning');
        if (alertType === 'success') toastEl.classList.add('bg-success', 'text-white');
        else if (alertType === 'error') toastEl.classList.add('bg-danger', 'text-white');
        else if (alertType === 'warning') toastEl.classList.add('bg-warning', 'text-dark');

        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        console.log(`Toast (${alertType}): ${message}`);
    }
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Seus métodos de carregamento de marcas, modelos, aparelhos, getNomeMarca, getNomeModelo, excluir, editarAparelho
  // podem ser mantidos como estão, pois são relevantes quando o FormClienteComponent é usado como uma página completa.
  // No contexto do modal de criação de cliente para a OS, eles não serão diretamente utilizados.
  carregarMarcas(): void {
    this.isLoading = true;
    const marcaSub = this.marcaService.getMarcas().subscribe({
      next: (data: Marca[]) => {
        this.marcas = data;
        this.carregouMarcas = true;
        this.verificarCarregamento();
      },
      error: (err: any) => {
        console.error('Erro ao carregar marcas', err);
        this.carregouMarcas = true;
        this.verificarCarregamento();
      }
    });
    this.subscriptions.add(marcaSub);
  }

  carregarModelos(): void {
    const modeloSub = this.modeloService.getModelos().subscribe({
      next: (data: Modelo[]) => {
        this.modelos = data;
        this.carregouModelos = true;
        this.verificarCarregamento();
      },
      error: (err: any) => {
        console.error('Erro ao carregar modelos', err);
        this.carregouModelos = true;
        this.verificarCarregamento();
      }
    });
    this.subscriptions.add(modeloSub);
  }

  carregarAparelhosDoCliente(clienteId: number): void {
    if(!clienteId) return;
    const aparelhoSub = this.aparelhoService.buscarPorCliente(clienteId).subscribe({
      next: (aparelhos) => {
        this.aparelhos = aparelhos;
      },
      error: (err) => {
        console.error('Erro ao carregar aparelhos do cliente:', err);
        this.showToast('Erro ao carregar aparelhos do cliente', 'error');
      }
    });
    this.subscriptions.add(aparelhoSub);
  }

  private verificarCarregamento(): void {
    if (this.carregouMarcas && this.carregouModelos) {
      this.isLoading = false; // Desativa o loading geral do componente
    }
  }

  getNomeMarca(idMarca: number): string {
    const marca = this.marcas.find(m => m.id == idMarca);
    return marca ? marca.nome : 'Desconhecida';
  }

  getNomeModelo(idModelo: number): string {
    const modelo = this.modelos.find(m => m.id == idModelo);
    return modelo ? modelo.nome : 'Desconhecido';
  }

  excluirAparelho(id: number): void { // Renomeado para evitar conflito
    if (this.clienteId && confirm('Tem certeza que deseja excluir este aparelho?')) {
      const excluirSub = this.aparelhoService.excluir(id).subscribe(() => {
        this.carregarAparelhosDoCliente(this.clienteId!);
        this.showToast("Aparelho excluído com sucesso!");
      }, error => {
        this.showToast("Erro ao excluir aparelho!", 'error');
      });
      this.subscriptions.add(excluirSub);
    }
  }

  editarAparelho(id: number): void { // Renomeado para evitar conflito
    // Quando em modo modal, a edição de aparelho não deve navegar para fora da OS.
    // Se precisar editar aparelho DENTRO do modal de cliente, seria uma lógica mais complexa (outro modal?)
    // Por agora, este botão de editar aparelho pode ser desabilitado ou ocultado no modo modal
    // ou abrir o form de aparelho em um SEGUNDO modal (não recomendado para UX simples).
    if (!this.isModal) {
        this.router.navigate(['/aparelho/form', id, { clienteId: this.clienteId }]);
    } else {
        this.showToast('Edição de aparelho não disponível no modo modal rápido.', 'warning');
        // Ou abrir FormAparelhoComponent em outro modal aqui.
        // Para simplificar, não vamos implementar edição de aparelho dentro do modal de cliente da OS.
    }
  }
}
