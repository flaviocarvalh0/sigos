import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // Para ViaCEP
import { Subscription } from 'rxjs';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask'; // Para máscaras

import { EmpresaService } from '../../../../services/empresa.service';
import { Empresa, EmpresaCriacaoPayload, EmpresaAtualizacaoPayload } from '../../../../Models/empresa.model';
import { ToastService } from '../../../../services/toast.service';
// ConfirmationService não é tipicamente usado diretamente no formulário de edição/criação,
// mas sim na lista para a ação de excluir. Se houver um botão de excluir aqui, ele seria necessário.

// declare const bootstrap: any; // Não mais necessário se ToastService encapsula
// import { NgZone } from '@angular/core'; // Não mais necessário se ToastService encapsula

@Component({
  selector: 'app-form-empresa',
  templateUrl: './form-empresa.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule, // Se houver routerLink no template
    NgxMaskDirective // Para máscara de CNPJ e CEP
  ],
  providers: [provideNgxMask()], // Prover ngx-mask
  styleUrls: ['./form-empresa.component.css']
})
export class FormEmpresaComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isEditMode = false; // Renomeado de isEditando
  empresaId?: number;
  isLoading = false;
  loadingCep = false;
  cepError = '';

  private dataModificacaoEmpresaAtual?: Date;
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private empresaService: EmpresaService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient, // Para ViaCEP
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Inicialização do form movida para o construtor para garantir que 'form' seja definido antes do template tentar acessá-lo.
    // Os valores serão preenchidos no ngOnInit ou loadEmpresaParaEdicao.
    this.form = this.fb.group({
      razaoSocial: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      nomeFantasia: ['', [Validators.required, Validators.maxLength(150)]], // Corrigido de nome_empresa
      cnpj: ['', [Validators.required, Validators.maxLength(20)]], // Adicionado Validators.required
      email: ['', [Validators.email, Validators.maxLength(120)]], // Email não é obrigatório no DTO, mas pode ser no form
      celular: ['', [Validators.maxLength(20)]], // Corrigido de telefone
      cep: ['', [Validators.maxLength(10)]],
      logradouro: ['', [Validators.maxLength(100)]],
      numero: ['', [Validators.maxLength(10)]],
      complemento: ['', [Validators.maxLength(100)]],
      bairro: ['', [Validators.maxLength(50)]],
      cidade: ['', [Validators.maxLength(50)]],
      uf: ['', [Validators.maxLength(2)]], // Ajustado para UF
      pais: ['Brasil', [Validators.maxLength(50)]], // Default 'Brasil'
      ativo: [true, Validators.required]
      // logotipo não está no form, mas pode ser adicionado se necessário (ex: input file)
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id'); // Usar paramMap para ser mais robusto
    if (idParam) {
      this.empresaId = +idParam; // O '+' converte string para number
      if (!isNaN(this.empresaId) && this.empresaId > 0) {
        this.isEditMode = true;
        this.loadEmpresaParaEdicao();
      } else {
        this.toastService.error('ID de empresa inválido na URL.');
        this.router.navigate(['/empresa']); // Redireciona se o ID for inválido
      }
    } else {
      this.isEditMode = false;
      // O formulário já foi inicializado com valores padrão no construtor
    }
  }

  loadEmpresaParaEdicao(): void {
    if (!this.empresaId) return;
    this.isLoading = true;
    const sub = this.empresaService.obterPorId(this.empresaId).subscribe({
      next: (empresa) => {
        if (empresa) {
          // Mapear os nomes corretos do modelo Empresa para os formControlNames
          this.form.patchValue({
            razaoSocial: empresa.razaoSocial,
            nomeFantasia: empresa.nomeFantasia,
            cnpj: empresa.cnpj,
            email: empresa.email,
            celular: empresa.celular,
            cep: empresa.cep,
            logradouro: empresa.logradouro,
            numero: empresa.numero,
            complemento: empresa.complemento,
            bairro: empresa.bairro,
            cidade: empresa.cidade,
            //uf: empresa.uf, // Assumindo que seu modelo Empresa tem 'uf'
            pais: empresa.pais,
            ativo: empresa.ativo
          });
          this.dataModificacaoEmpresaAtual = empresa.dataModificacao
        } else {
          this.toastService.error('Empresa não encontrada.');
          this.router.navigate(['/empresa']);
        }
        this.isLoading = false;
      },
      error: (err) => this.handleApiError('Erro ao carregar empresa.', err)
    });
    this.subscriptions.add(sub);
  }

  onCepBlur(): void {
    const cep = this.form.get('cep')?.value?.replace(/\D/g, ''); // Remove não numéricos
    if (cep && cep.length === 8) {
      this.loadingCep = true;
      this.cepError = '';
      const cepSub = this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
        next: (data) => {
          if (data.erro) {
            this.cepError = 'CEP não encontrado.';
            this.toastService.warning('CEP não encontrado.', 3000);
            this.limparCamposEndereco(cep);
          } else {
            this.form.patchValue({
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              uf: data.uf,
              pais: 'Brasil' // ViaCEP é para o Brasil
            });
          }
          this.loadingCep = false;
        },
        error: (err) => {
          this.cepError = 'Erro ao buscar o CEP.';
          this.toastService.error(this.cepError);
          this.loadingCep = false;
          this.limparCamposEndereco(cep);
        }
      });
      this.subscriptions.add(cepSub);
    } else if (cep && cep.length > 0) {
        this.cepError = 'CEP inválido.';
        this.limparCamposEndereco(cep);
    } else {
        this.limparCamposEndereco();
    }
  }

  private limparCamposEndereco(cepMantido?: string): void {
    this.form.patchValue({
        logradouro: '',
        bairro: '',
        cidade: '',
        uf: '',
        pais: 'Brasil',
        cep: cepMantido || '' // Mantém o CEP se fornecido
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched(); // Mostra erros de validação antes de checar
    if (this.form.invalid) {
      this.toastService.error('Formulário inválido. Verifique os campos destacados.');
      console.log("Erros do formulário:", this.collectFormErrors(this.form));
      return;
    }

    this.isLoading = true;
    const formValue = this.form.getRawValue(); // Pega todos os valores, incluindo desabilitados (se houver)

    if (this.isEditMode && this.empresaId) {
      const payload: EmpresaAtualizacaoPayload = {
        id: this.empresaId,
        razaoSocial: formValue.razaoSocial,
        nomeFantasia: formValue.nomeFantasia,
        cnpj: formValue.cnpj.replace(/\D/g, ''), // Remove máscara do CNPJ
        email: formValue.email,
        celular: formValue.celular?.replace(/\D/g, ''), // Remove máscara
        ativo: formValue.ativo,
        // logotipo: formValue.logotipo, // Se tiver campo de logotipo
        cep: formValue.cep?.replace(/\D/g, ''), // Remove máscara
        cidade: formValue.cidade,
        logradouro: formValue.logradouro,
        complemento: formValue.complemento,
        numero: formValue.numero,
        bairro: formValue.bairro,
        pais: formValue.pais,
        // uf é parte do endereço, já incluído
        dataUltimaModificacao: this.dataModificacaoEmpresaAtual
      };
      const updateSub = this.empresaService.atualizarEmpresa(this.empresaId, payload).subscribe({
        next: () => this.handleSuccess('Empresa atualizada com sucesso!'),
        error: (err) => this.handleApiError('Erro ao atualizar empresa.', err)
      });
      this.subscriptions.add(updateSub);
    } else { // Criação
      const payload: EmpresaCriacaoPayload = {
        razaoSocial: formValue.razaoSocial,
        nomeFantasia: formValue.nomeFantasia,
        cnpj: formValue.cnpj.replace(/\D/g, ''),
        email: formValue.email,
        celular: formValue.celular?.replace(/\D/g, ''),
        ativo: formValue.ativo,
        // logotipo: formValue.logotipo,
        cep: formValue.cep?.replace(/\D/g, ''),
        cidade: formValue.cidade,
        logradouro: formValue.logradouro,
        complemento: formValue.complemento,
        numero: formValue.numero,
        bairro: formValue.bairro,
        pais: formValue.pais,
        // uf é parte do endereço
      };
      const createSub = this.empresaService.criarEmpresa(payload).subscribe({
        next: () => this.handleSuccess('Empresa criada com sucesso!'),
        error: (err) => this.handleApiError('Erro ao criar empresa.', err)
      });
      this.subscriptions.add(createSub);
    }
  }

  private handleSuccess(message: string): void {
    this.toastService.success(message);
    this.isLoading = false;
    this.router.navigate(['/empresa']); // Navega para a lista de empresas
  }

  private handleApiError(message: string, error: any): void {
    // A lógica de extração de mensagem do CrudService.handleError já é boa.
    // O throwError(() => new Error(errorMessage)) no CrudService fará com que
    // error.message aqui contenha a mensagem formatada.
    this.toastService.error(error.message || message);
    console.error(message, error);
    this.isLoading = false;
  }

  onCancelar(): void {
    this.router.navigate(['/empresa']);
  }

  // onExcluir não está no seu HTML de form-empresa, mas se estivesse:
  // onExcluir(): void {
  //   if (this.empresaId) {
  //     const config: ConfirmationConfig = { /* ... */ };
  //     this.confirmationService.confirm(config).subscribe(confirmed => {
  //       if (confirmed) {
  //         this.isLoading = true;
  //         this.empresaService.remover(this.empresaId!).subscribe({
  //           next: () => this.handleSuccess('Empresa excluída com sucesso!'),
  //           error: (err) => this.handleApiError('Erro ao excluir empresa.', err)
  //         });
  //       }
  //     });
  //   }
  // }

  // Helper para validação no template
  isInvalidControl(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Para depuração de erros de formulário (opcional, mas útil)
  private collectFormErrors(form: FormGroup | FormArray): any {
    const errors: any = {};
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key) as AbstractControl;
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
}
