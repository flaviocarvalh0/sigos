import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, NgModel, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ClienteService } from '../../../../services/cliente.service';
import { Cliente } from '../../../../Models/cliente.model';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { FormAparelhoComponent } from '../../../aparelho/pages/form-aparelho/form-aparelho.component';
import { AparelhoService } from '../../../../services/aparelho.service';
import { Aparelho } from '../../../../Models/aparelho.model';
import { MarcaService } from '../../../../services/marca.service';
import { ModeloService } from '../../../../services/modelo.service';


declare const bootstrap: any;

@Component({
    selector: 'app-form-cliente',
    imports: [ [NgIf], CommonModule, ReactiveFormsModule, HttpClientModule, FormAparelhoComponent],
    standalone: true,
    templateUrl: './form-cliente.component.html',
    styleUrls: ['./form-cliente.component.css']
})
export class FormClienteComponent implements OnInit {
  private fb = inject(FormBuilder);
  isEditando = false;
  clienteId: number | undefined;
  editingClienteId: number | null = null;
  form!: FormGroup;
  loadingCep = false;
  cepError = '';
  aparelhoService: AparelhoService = inject(AparelhoService); 
  aparelhos: Aparelho[] = [];
  marcas: { id: number; nome: string }[] = [];
  modelos: { id: number; nome: string }[] = [];
  private carregouMarcas = false;
  private carregouModelos = false;
  private carregando = false;
  abaSelecionada = 'aparelhos'; // ou 'aparelhos'

  showAparelhoForm = false;

  abrirFormularioAparelho() {
    this.showAparelhoForm = true;
  }

  private verificarCarregamento(): void {
    if (
      this.carregouMarcas &&
      this.carregouModelos
    ) {
      this.carregando = false;
    }
  }


  carregarMarcas(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data: { id: number; nome: string; }[]) => {
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
  }

  carregarModelos(): void {
    this.modeloService.getModelos().subscribe({
      next: (data: { id: number; nome: string; }[]) => {
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
  }

carregarAparelhosDoCliente(clienteId: number): void {
  this.aparelhoService.buscarPorCliente(clienteId).subscribe({
    next: (aparelho) => {
      this.aparelhos = aparelho;
    },
    error: (err) => {
      console.error('Erro ao carregar aparelho:', err);
      this.showToast('Erro ao carregar aparelho do cliente');
    }
  });  
}

getNomeMarca(idMarca: number): string {
  const marca = this.marcas.find(m => m.id == idMarca);
  return marca ? marca.nome : 'Desconhecida';
}

getNomeModelo(idModelo: number): string {
  const modelo = this.modelos.find(m => m.id == idModelo);
  return modelo ? modelo.nome : 'Desconhecido';
}

excluir(id: number) {
    if (confirm('Tem certeza que deseja excluir este aparelho?')) {
      this.aparelhoService.excluir(id).subscribe(() => {
        this.carregarAparelhosDoCliente(this.clienteId!);
        this.showToast("Aparelho excluído com sucesso!");
      });
    }
  }

  editarParalho(id: number) {
    this.router.navigate(['/aparelho/form', id]);
  }
  constructor(
    private http: HttpClient,
    private clienteService: ClienteService,
    private route: ActivatedRoute,
    private router: Router,
    private marcaService: MarcaService,
    private modeloService: ModeloService
  ) {
    this.form = this.fb.group({
      nome_completo: ['', [Validators.required, Validators.minLength(3)]],
      cpf: [''],
      apelido: [''],
      cep: [''],
      cidade: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      uf: [''],
      pais: [''],
      telefone: [''],
      celular: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      tipo_de_pessoa: [''],
      ativo: [true]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.clienteId = +idParam;
        this.carregarCliente(this.clienteId);
        this.carregarAparelhosDoCliente(this.clienteId);
        this.carregarMarcas();
        this.carregarModelos();
      }else {
        this.form.patchValue({ ativo: true });
      }
    });
  }

  aoSalvarOuCancelarAparelho(): void {
  this.showAparelhoForm = false;
  this.carregarAparelhosDoCliente(this.clienteId!); 
}


  carregarCliente(id: number) {
    this.clienteService.getClienteById(id).subscribe(cliente => {
      if (cliente) {
        if (cliente.id !== undefined) {
          this.editingClienteId = cliente.id;
          this.isEditando = true;
        }

        this.form.patchValue({
          nome_completo: cliente.nome_completo,
          apelido: cliente.apelido,
          cpf: cliente.cpf,
          cep: cliente.cep,
          cidade: cliente.cidade,
          logradouro: cliente.logradouro,
          numero: cliente.numero,
          complemento: cliente.complemento,
          bairro: cliente.bairro,
          uf: cliente.uf,
          pais: cliente.pais,
          telefone: cliente.telefone,
          celular: cliente.celular,
          email: cliente.email,
          tipo_de_pessoa: cliente.tipo_de_pessoa,
          ativo: cliente.ativo,
        });
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Formulário válido, enviando dados:', this.form.value);
      // Pega todos os valores (mesmo os disabled)
      const clienteData = this.form.getRawValue();

      if (this.editingClienteId === null) {
        this.clienteService.addCliente(clienteData).subscribe(() => {
          this.showToast('Cliente salvo com sucesso!');
          this.router.navigate(['/clientes']); // Redireciona após salvar
        }, error => {
          this.showToast('Erro ao salvar cliente.');
          console.error(error);
        });
      } else {
        this.clienteService.updateCliente(this.editingClienteId, clienteData).subscribe(() => {
          this.showToast('Cliente atualizado com sucesso!');
          this.router.navigate(['/clientes']); // Redireciona após atualizar
          this.editingClienteId = null;
        }, error => {
          this.showToast('Erro ao atualizar cliente.');
          console.error(error);
        });
      }
    } else {
      console.log('Formulário inválido');
      this.form.markAllAsTouched();
    }
  }

  editCliente(cliente: Cliente) {
    if (cliente.id !== undefined) {
      this.editingClienteId = cliente.id;
    }

    this.form.patchValue({
      nome_completo: cliente.nome_completo,
      apelido: cliente.apelido,
      cep: cliente.cep,
      cidade: cliente.cidade,
      logradouro: cliente.logradouro,
      numero: cliente.numero,
      complemento: cliente.complemento,
      bairro: cliente.bairro,
      uf: cliente.uf,
      pais: cliente.pais,
      telefone: cliente.telefone,
      celular: cliente.celular,
      email: cliente.email,
      tipo_de_pessoa: cliente.tipo_de_pessoa,
      ativo: cliente.ativo
    });
  }

  onCancelar() {
    this.form.reset();
    this.isEditando = false;
    this.router.navigate(['/clientes']);
  }

  onExcluir() {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      this.clienteService.deleteCliente(this.editingClienteId!).subscribe(() => {
        this.showToast('Cliente excluído com sucesso!');
        this.router.navigate(['/clientes']);
      }, error => {
        this.showToast('Erro ao excluir cliente.');
        console.error(error);
      });
      console.log('Excluir cliente');
      this.form.reset();
      this.isEditando = false;
    }
  }

  onCepBlur() {
    const cep = this.form.value.cep?.replace(/\D/g, ''); // remove qualquer caractere não numérico
    if (!cep || cep.length !== 8) return; // CEP tem 8 dígitos

    this.loadingCep = true;
    this.cepError = '';

    this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (data) => {
        if (data.erro) {
          this.cepError = 'CEP não encontrado.';
          this.form.patchValue({cidade:'', logradouro: '', bairro: '', uf: '', pais: 'Brasil' });
        } else {
          this.form.patchValue({
            cidade: data.localidade || '',
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            uf: data.uf || '',
            pais: data.pais || 'Brasil',
          });
        }
        this.loadingCep = false;
      },
      error: (err) => {
        console.error('Erro ao consultar CEP:', err);
        this.cepError = 'Erro ao consultar CEP.';
        this.form.patchValue({cidade: '', logradouro: '', bairro: '', uf: '', pais: 'Brasil' });
        this.loadingCep = false;
      }
    });
  }

  showToast(message: string) {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const toastBody = toastEl.querySelector('.toast-body');
      if (toastBody) toastBody.textContent = message;

      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }
}
