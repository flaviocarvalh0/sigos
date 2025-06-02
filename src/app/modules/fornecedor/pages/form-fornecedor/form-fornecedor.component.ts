import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

import { FornecedorService } from '../../../../services/fornecedor.service';
import { Fornecedor, FornecedorCriacaoPayload, FornecedorAtualizacaoPayload } from '../../../../Models/fornecedor.model';
import { ToastService } from '../../../../services/toast.service';
// ConfirmationService não é usado aqui, pois a exclusão está na lista.

@Component({
  selector: 'app-form-fornecedor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxMaskDirective],
  providers: [provideNgxMask()],
  templateUrl: './form-fornecedor.component.html',
  styleUrls: ['./form-fornecedor.component.css']
})
export class FormFornecedorComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isEditMode = false;
  fornecedorId?: number;
  isLoading = false;
  loadingCep = false;
  cepError = '';

  private dataModificacaoFornecedorAtual?: Date;
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private fornecedorService: FornecedorService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastService: ToastService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.form = this.fb.group({
      razaoSocial: ['', [Validators.required, Validators.maxLength(100)]],
      nomeFantasia: ['', [Validators.maxLength(100)]],
      cnpj: ['', [Validators.maxLength(18)]], // Validação de formato de CNPJ pode ser adicionada
      inscricaoEstadual: ['', [Validators.maxLength(30)]],
      telefone: ['', [Validators.maxLength(20)]],
      celular: ['', [Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.maxLength(120)]],
      logradouro: ['', [Validators.maxLength(100)]],
      numero: ['', [Validators.maxLength(10)]],
      complemento: ['', [Validators.maxLength(100)]],
      bairro: ['', [Validators.maxLength(50)]],
      cidade: ['', [Validators.maxLength(50)]],
      estado: ['', [Validators.maxLength(50)]], // No seu DTO API é 'Estado'
      cep: ['', [Validators.maxLength(10)]],
      pais: ['Brasil', [Validators.maxLength(50)]],
      ativo: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.fornecedorId = +idParam;
      if (!isNaN(this.fornecedorId) && this.fornecedorId > 0) {
        this.isEditMode = true;
        this.loadFornecedorParaEdicao();
      } else {
        this.toastService.error('ID de fornecedor inválido na URL.');
        this.router.navigate(['/fornecedor']);
      }
    } else {
      this.isEditMode = false;
    }
  }

  loadFornecedorParaEdicao(): void {
    if (!this.fornecedorId) return;
    this.isLoading = true;
    const sub = this.fornecedorService.obterPorId(this.fornecedorId).subscribe({
      next: (fornecedor) => {
        if (fornecedor) {
          this.form.patchValue({ // Mapear os campos corretamente
            razaoSocial: fornecedor.razaoSocial,
            nomeFantasia: fornecedor.nomeFantasia,
            cnpj: fornecedor.cnpj,
            inscricaoEstadual: fornecedor.inscricaoEstadual,
            telefone: fornecedor.telefone,
            celular: fornecedor.celular,
            email: fornecedor.email,
            logradouro: fornecedor.logradouro,
            numero: fornecedor.numero,
            complemento: fornecedor.complemento,
            bairro: fornecedor.bairro,
            cidade: fornecedor.cidade,
            estado: fornecedor.estado,
            cep: fornecedor.cep,
            pais: fornecedor.pais,
            ativo: fornecedor.ativo
          });
          this.dataModificacaoFornecedorAtual = fornecedor.dataModificacao;
        } else {
          this.toastService.error('Fornecedor não encontrado.');
          this.router.navigate(['/fornecedor']);
        }
        this.isLoading = false;
      },
      error: (err) => this.handleApiError('Erro ao carregar fornecedor.', err)
    });
    this.subscriptions.add(sub);
  }

  onCepBlur(): void {
    const cep = this.form.get('cep')?.value?.replace(/\D/g, '');
    if (cep && cep.length === 8) {
      this.loadingCep = true;
      this.cepError = '';
      const cepSub = this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
        next: (data) => {
          if (data.erro) {
            this.cepError = 'CEP não encontrado.';
            this.toastService.warning(this.cepError, 3000);
            this.limparCamposEndereco(cep);
          } else {
            this.form.patchValue({
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf, // API do ViaCEP retorna 'uf'
              pais: 'Brasil'
            });
            this.cepError = ''; // Limpa erro se o CEP for encontrado
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
        estado: '', // Limpa estado também
        pais: 'Brasil',
        cep: cepMantido || ''
    });
  }


  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toastService.error('Formulário inválido. Verifique os campos destacados.');
      console.log("Erros do formulário:", this.collectFormErrors(this.form));
      return;
    }

    this.isLoading = true;
    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.fornecedorId) {
      const payload: FornecedorAtualizacaoPayload = {
        id: this.fornecedorId,
        razaoSocial: formValue.razaoSocial,
        nomeFantasia: formValue.nomeFantasia,
        cnpj: formValue.cnpj?.replace(/\D/g, ''),
        inscricaoEstadual: formValue.inscricaoEstadual,
        telefone: formValue.telefone?.replace(/\D/g, ''),
        celular: formValue.celular?.replace(/\D/g, ''),
        email: formValue.email,
        logradouro: formValue.logradouro,
        numero: formValue.numero,
        complemento: formValue.complemento,
        bairro: formValue.bairro,
        cidade: formValue.cidade,
        estado: formValue.estado,
        cep: formValue.cep?.replace(/\D/g, ''),
        pais: formValue.pais,
        ativo: formValue.ativo,
        dataUltimaModificacao: this.dataModificacaoFornecedorAtual
      };
      const updateSub = this.fornecedorService.atualizarFornecedor(this.fornecedorId, payload).subscribe({
        next: () => this.handleSuccess('Fornecedor atualizado com sucesso!'),
        error: (err) => this.handleApiError('Erro ao atualizar fornecedor.', err)
      });
      this.subscriptions.add(updateSub);
    } else { // Criação
      const payload: FornecedorCriacaoPayload = {
        razaoSocial: formValue.razaoSocial,
        nomeFantasia: formValue.nomeFantasia,
        cnpj: formValue.cnpj?.replace(/\D/g, ''),
        inscricaoEstadual: formValue.inscricaoEstadual,
        telefone: formValue.telefone?.replace(/\D/g, ''),
        celular: formValue.celular?.replace(/\D/g, ''),
        email: formValue.email,
        logradouro: formValue.logradouro,
        numero: formValue.numero,
        complemento: formValue.complemento,
        bairro: formValue.bairro,
        cidade: formValue.cidade,
        estado: formValue.estado,
        cep: formValue.cep?.replace(/\D/g, ''),
        pais: formValue.pais,
        ativo: formValue.ativo
      };
      const createSub = this.fornecedorService.criarFornecedor(payload).subscribe({
        next: () => this.handleSuccess('Fornecedor criado com sucesso!'),
        error: (err) => this.handleApiError('Erro ao criar fornecedor.', err)
      });
      this.subscriptions.add(createSub);
    }
  }

  private handleSuccess(message: string): void {
    this.toastService.success(message);
    this.isLoading = false;
    this.router.navigate(['/fornecedor']);
  }

  private handleApiError(operationMessage: string, error: any): void {
    const detailErrorMessage = error.message || 'Erro desconhecido.';
    this.toastService.error(`${operationMessage} ${detailErrorMessage}`);
    console.error(operationMessage, error);
    this.isLoading = false;
  }

  onCancelar(): void {
    this.router.navigate(['/fornecedor']);
  }

  // Método de exclusão não está no form, mas na lista.
  // Se precisar, adicione aqui e use o ConfirmationService.

  isInvalidControl(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private collectFormErrors(form: FormGroup): any {
    const errors: any = {};
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key) as AbstractControl;
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }
}