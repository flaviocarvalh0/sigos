import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subscription } from 'rxjs';

import { UsuarioService } from '../../../../services/usuario.service';
import { EmpresaService } from '../../../../services/empresa.service';
import { Usuario, Grupo, UsuarioCriacaoPayload, UsuarioAtualizacaoPayload } from '../../../../Models/usuario.model';
import { Empresa } from '../../../../Models/empresa.model';

// Serviços de Toast e Confirmação
import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';

// NgZone pode não ser mais necessária aqui se ToastService e ConfirmationService lidam com isPlatformBrowser internamente.
// No entanto, se eles usam o bootstrap JS global diretamente, a proteção ainda é boa.
// Vamos assumir que os serviços encapsulam isso.

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, RouterModule],
  templateUrl: './form-usuario.component.html',
  // styleUrls: ['./form-usuario.component.css']
})
export class FormUsuarioComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  isEditMode = false;
  usuarioId?: number;
  isLoading = false;
  senhaVisivel = false;
  confirmaSenhaVisivel = false;

  empresas: Empresa[] = [];
  // gruposDisponiveis: Grupo[] = []; // Removido, pois não há campo de grupo no form

  private dataModificacaoUsuarioAtual?: Date; // Ajustado para Date ou string
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private empresaService: EmpresaService,
    private route: ActivatedRoute,
    public router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService, // Injetado mas não usado neste form, ListaUsuario usará
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadEmpresas();
    // this.loadGruposDisponiveis(); // Removido

    const routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.usuarioId = +id;
        this.isEditMode = true;
        this.loadUsuarioParaEdicao();
      } else {
        this.isEditMode = false;
        // Valores default são definidos em initForm
      }
    });
    this.subscriptions.add(routeSub);
  }

  initForm(usuario?: Usuario): void {
    // Na criação (isEditMode é false), senha é obrigatória.
    // Na edição, senha é opcional (só valida minLength se preenchida).
    const senhaValidators = !this.isEditMode ? [Validators.required, Validators.minLength(6)] : [Validators.minLength(6)];
    // Confirmação é obrigatória apenas se a senha principal for obrigatória (ou seja, na criação)
    // ou se a senha estiver sendo alterada na edição.
    const confirmarSenhaValidators = !this.isEditMode ? [Validators.required] : [];


    this.form = this.fb.group({
      nome: [usuario?.nome || '', Validators.required],
      login: [usuario?.login || '', Validators.required],
      email: [usuario?.email || '', [Validators.required, Validators.email]],
      senha: ['', senhaValidators], // Validador é condicional
      confirmarSenha: ['', confirmarSenhaValidators], // Validador é condicional
      id_empresa: [usuario?.idEmpresa || null],
      ativo: [usuario ? usuario.ativo : true, Validators.required],
      // id_grupos: [usuario?.grupos?.map(g => g.id) || []], // Removido
    }, {
      validators: this.senhasCombinamValidator // Aplica o validador de grupo
    });

    // Lógica para tornar 'confirmarSenha' obrigatório na edição APENAS se 'senha' for preenchida
    if (this.isEditMode) {
      const senhaCtrl = this.form.get('senha');
      const confirmarSenhaCtrl = this.form.get('confirmarSenha');

      if (senhaCtrl && confirmarSenhaCtrl) {
        this.subscriptions.add(
          senhaCtrl.valueChanges.subscribe(value => {
            if (value && value.trim() !== '') { // Se o campo senha tem algo
              confirmarSenhaCtrl.setValidators([Validators.required]);
            } else { // Se senha for limpa
              confirmarSenhaCtrl.clearValidators();
              confirmarSenhaCtrl.setValue(''); // Limpa confirmação
              confirmarSenhaCtrl.markAsUntouched(); // Para não mostrar erro de 'required' se senha estiver vazia
            }
            confirmarSenhaCtrl.updateValueAndValidity();
            // Não precisa chamar this.form.updateValueAndValidity() aqui,
            // pois o validador de grupo senhasCombinamValidator cuidará da lógica de combinação.
          })
        );
      }
    }
  }

  senhasCombinamValidator(group: FormGroup): { [key: string]: boolean } | null {
    const senha = group.get('senha')?.value;
    const confirmarSenha = group.get('confirmarSenha')?.value;

    // Se o campo senha está preenchido, então o campo confirmarSenha deve ser igual
    if (senha && senha.trim() !== '') {
        if (senha !== confirmarSenha) {
            group.get('confirmarSenha')?.setErrors({ senhasNaoCombinam: true });
            return { senhasNaoCombinamGlobal: true }; // Erro a nível de grupo para o form.invalid
        }
    } else if (confirmarSenha && confirmarSenha.trim() !== '' && (!senha || senha.trim() === '')) {
        // Se a senha está vazia mas a confirmação não, isso também é um erro (ou a senha se torna required)
        group.get('senha')?.setErrors({ required: true }); // Força erro de required na senha
        return { senhasNaoCombinamGlobal: true }; // Indica erro no grupo
    }

    // Limpa o erro específico do campo 'confirmarSenha' se as condições de erro não forem mais verdadeiras
    if (senha === confirmarSenha && group.get('confirmarSenha')?.hasError('senhasNaoCombinam')) {
        group.get('confirmarSenha')?.setErrors(null);
    }
    // Se o campo 'senha' limpou o erro 'required' por outra lógica, mas ainda está vazio e 'confirmarSenha' não,
    // o erro 'required' em 'senha' deve ser mantido pelo validador do próprio campo.
    return null; // Nenhuma falha de validação a nível de grupo se tudo estiver ok ou se senha estiver vazia.
  }

  loadEmpresas(): void {
    const empresaSub = this.empresaService.getEmpresas().subscribe(
      data => this.empresas = data,
      err => this.toastService.error('Erro ao carregar empresas. ' + (err.message || ''))
    );
    this.subscriptions.add(empresaSub);
  }

  // loadGruposDisponiveis(): void { /* Removido */ }

  loadUsuarioParaEdicao(): void {
    if (!this.usuarioId) return;
    this.isLoading = true;
    const userSub = this.usuarioService.obterPorId(this.usuarioId).subscribe(
      usuario => {
        if (usuario) {
          this.initForm(usuario); // Popula com os dados do usuário
          this.dataModificacaoUsuarioAtual = usuario.dataModificacao; // Armazena para controle de concorrência
        } else {
          this.toastService.error('Usuário não encontrado.');
          this.router.navigate(['/admin/usuarios']);
        }
        this.isLoading = false;
      },
      error => this.handleApiError('Erro ao carregar usuário.', error)
    );
    this.subscriptions.add(userSub);
  }

  onSubmit(): void {
    this.form.markAllAsTouched(); // Marca tudo para exibir todos os erros de validação pendentes
    if (this.form.invalid) {
      this.toastService.error('Formulário inválido. Verifique os campos destacados.');
      console.log("Erros do formulário:", this.collectFormErrors(this.form));
      return;
    }
    this.isLoading = true;
    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.usuarioId) {
      const payload: UsuarioAtualizacaoPayload = {
        id: this.usuarioId,
        nome: formValue.nome,
        login: formValue.login,
        email: formValue.email,
        ativo: formValue.ativo,
        idEmpresa: formValue.id_empresa || null,
        // matricula: formValue.matricula || null, // Adicionar se matricula fizer parte do DTO de atualização
        dataUltimaModificacao: this.dataModificacaoUsuarioAtual, // Enviando o valor original para concorrência
      };
      if (formValue.senha && formValue.senha.trim() !== '') { // Só envia senha se foi preenchida
        payload.senha = formValue.senha;
      }

      const updateSub = this.usuarioService.atualizarUsuario(this.usuarioId, payload).subscribe({

        next: () => this.handleSuccess('Usuário atualizado com sucesso!'),
        error: (err) => this.handleApiError('Erro ao atualizar usuário.', err)
      });
      this.subscriptions.add(updateSub);
    } else { // Criação
      const payload: UsuarioCriacaoPayload = {
        nome: formValue.nome,
        login: formValue.login,
        email: formValue.email,
        senha: formValue.senha, // Senha é obrigatória e validada
        ativo: formValue.ativo,
        idEmpresa: formValue.id_empresa || null,
        // matricula: formValue.matricula || null,
      };
      const createSub = this.usuarioService.criarUsuario(payload).subscribe({
        next: () => this.handleSuccess('Usuário criado com sucesso!'),
        error: (err) => this.handleApiError('Erro ao criar usuário.', err)
      });
      this.subscriptions.add(createSub);
    }
  }

 // Exemplo no FormUsuarioComponent
private handleSuccess(message: string): void {
  console.log('[FormUsuario] Chamando toastService.success com:', message); // LOG
  this.toastService.success(message);
  this.isLoading = false;
  this.router.navigate(['/admin/usuarios']);
}

  private handleApiError(message: string, error: any): void {
    let detailErrorMessage = error.message || 'Erro desconhecido.';
    if (error.error && typeof error.error === 'object') {
        if (error.error.errors) { // Erros de validação do ModelState .NET Core
            const validationErrors = [];
            for (const key in error.error.errors) {
                if (error.error.errors.hasOwnProperty(key) && Array.isArray(error.error.errors[key])) {
                    validationErrors.push(`${key}: ${error.error.errors[key].join(', ')}`);
                }
            }
            if (validationErrors.length > 0) {
              detailErrorMessage = validationErrors.join('; ');
            } else if (error.error.mensagem) { // Se a API RespostaApi<T> tem 'mensagem'
                detailErrorMessage = error.error.mensagem;
            }
        } else if (error.error.mensagem) {
             detailErrorMessage = error.error.mensagem;
        } else if (error.error.title) { // Estrutura de erro padrão do ASP.NET Core para 400
            detailErrorMessage = error.error.title;
        }
    }
    this.toastService.error(`${message} ${detailErrorMessage}`);
    console.error(message, error);
    this.isLoading = false;
  }

  toggleSenhaVisivel(): void {
    this.senhaVisivel = !this.senhaVisivel;
  }
  toggleConfirmaSenhaVisivel(): void {
    this.confirmaSenhaVisivel = !this.confirmaSenhaVisivel;
  }

  isInvalidControl(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // showToast já foi removido, usamos this.toastService.

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
