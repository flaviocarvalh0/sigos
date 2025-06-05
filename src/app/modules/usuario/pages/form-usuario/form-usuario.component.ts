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
import { ConfirmationConfig } from '../../../../Models/confirmation.model'; // Ajuste o path se necessário
import { AuthService } from '../../../../services/auth/auth.service';

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
  private dataModificacaoUsuarioAtual?: Date;
  private subscriptions = new Subscription();

  // Usado para determinar a rota de retorno
  private veioDeMeuPerfil = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private empresaService: EmpresaService,
    private route: ActivatedRoute,
    public router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Determinar o contexto de origem para o redirecionamento
    // Usar route.url para verificar o path de forma mais robusta
    this.subscriptions.add(
        this.route.url.subscribe(segments => {
            const path = segments.map(s => s.path).join('/');
            if (path.includes('meu-perfil/editar')) {
                this.veioDeMeuPerfil = true;
            } else {
                this.veioDeMeuPerfil = false;
            }

            // Prosseguir com o carregamento de dados após determinar o contexto
            this.loadEmpresas().then(() => {
                if (this.veioDeMeuPerfil) {
                    const currentUser = this.authService.currentUserValue;
                    if (currentUser && currentUser.id) {
                        this.usuarioId = currentUser.id;
                        this.isEditMode = true;
                        this.loadUsuarioParaEdicao();
                    } else {
                        this.toastService.error('Usuário não autenticado para editar perfil.');
                        this.router.navigate(['/login']);
                    }
                } else {
                    const id = this.route.snapshot.paramMap.get('id');
                    if (id) {
                        this.usuarioId = +id;
                        this.isEditMode = true;
                        this.loadUsuarioParaEdicao();
                    } else {
                        this.isEditMode = false;
                        this.initForm();
                    }
                }
            });
        })
    );
}

  // initForm, senhasCombinamValidator, loadEmpresas, loadUsuarioParaEdicao
  // permanecem como no seu código original ou com os ajustes de validação que você já tem.
  // O importante é que eles não afetam a lógica de redirecionamento que estamos focando.

  initForm(usuario?: Usuario): void {
    const senhaValidators = !this.isEditMode ? [Validators.required, Validators.minLength(6)] : [Validators.minLength(6)];
    const confirmarSenhaValidators = !this.isEditMode ? [Validators.required] : [];

    this.form = this.fb.group({
      nome: [usuario?.nome || '', Validators.required],
      login: [usuario?.login || '', Validators.required],
      email: [usuario?.email || '', [Validators.required, Validators.email]],
      senha: ['', senhaValidators],
      confirmarSenha: ['', confirmarSenhaValidators],
      idEmpresa: [usuario?.idEmpresa || null],
      ativo: [usuario ? usuario.ativo : true, Validators.required],
    }, {
      validators: this.senhasCombinamValidator
    });

    if (this.isEditMode) {
      this.form.get('login')?.disable(); // Login não é editável no modo de edição
      const senhaCtrl = this.form.get('senha');
      const confirmarSenhaCtrl = this.form.get('confirmarSenha');

      if (senhaCtrl && confirmarSenhaCtrl) {
        this.subscriptions.add(
          senhaCtrl.valueChanges.subscribe(value => {
            if (value && value.trim() !== '') {
              confirmarSenhaCtrl.setValidators([Validators.required]);
            } else {
              confirmarSenhaCtrl.clearValidators();
              confirmarSenhaCtrl.setValue('');
              confirmarSenhaCtrl.markAsUntouched();
            }
            confirmarSenhaCtrl.updateValueAndValidity();
          })
        );
      }
    }
  }

  senhasCombinamValidator(group: FormGroup): { [key: string]: boolean } | null {
    const senha = group.get('senha')?.value;
    const confirmarSenha = group.get('confirmarSenha')?.value;

    if (senha && senha.trim() !== '') {
        if (senha !== confirmarSenha) {
            group.get('confirmarSenha')?.setErrors({ senhasNaoCombinam: true });
            return { senhasNaoCombinamGlobal: true };
        }
    } else if (confirmarSenha && confirmarSenha.trim() !== '' && (!senha || senha.trim() === '')) {
        group.get('senha')?.setErrors({ required: true });
        return { senhasNaoCombinamGlobal: true };
    }

    if (senha === confirmarSenha && group.get('confirmarSenha')?.hasError('senhasNaoCombinam')) {
        group.get('confirmarSenha')?.setErrors(null);
    }
    return null;
  }

  loadEmpresas(): Promise<void> {
    return new Promise((resolve) => {
      const empresaSub = this.empresaService.obterTodos().subscribe({
        next: (data: Empresa[]) => {
          this.empresas = data;
            const idEmpresaAtual = this.form?.get('idEmpresa')?.value;
            if (idEmpresaAtual) {
            const empresaExiste = this.empresas.some(e => e.id === idEmpresaAtual);
            if (!empresaExiste) {
                this.form.get('idEmpresa')?.setValue(null);
            }
            }
          resolve();
        },
        error: (err) => {
          this.toastService.error('Erro ao carregar empresas: ' + (err.message || 'Verifique a API.'));
          resolve();
        }
      });
      this.subscriptions.add(empresaSub);
    });
  }

  loadUsuarioParaEdicao(): void {
    if (!this.usuarioId) return;
    this.isLoading = true;
    const userSub = this.usuarioService.obterPorId(this.usuarioId).subscribe(
      usuario => {
        if (usuario) {
          this.initForm(usuario);
          this.dataModificacaoUsuarioAtual = usuario.dataModificacao;
        } else {
          this.toastService.error('Usuário não encontrado.');
          // Ajuste o redirecionamento aqui também, se necessário, baseado em this.veioDeMeuPerfil
          this.router.navigate([this.veioDeMeuPerfil ? '/ordem-servico' : '/admin/usuarios']);
        }
        this.isLoading = false;
      },
      error => this.handleApiError('Erro ao carregar usuário.', error)
    );
    this.subscriptions.add(userSub);
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

    if (this.isEditMode && this.usuarioId) {
      const payload: UsuarioAtualizacaoPayload = {
        id: this.usuarioId,
        nome: formValue.nome,
        login: formValue.login, // Corrigido para pegar do formValue (getRawValue)
        email: formValue.email,
        ativo: formValue.ativo,
        idEmpresa: formValue.idEmpresa || null,
        dataUltimaModificacao: this.dataModificacaoUsuarioAtual,
      };
      if (formValue.senha && formValue.senha.trim() !== '') {
        payload.senha = formValue.senha;
      }

      const updateSub = this.usuarioService.atualizarUsuario(this.usuarioId, payload).subscribe({
        next: () => this.handleSuccess('Usuário atualizado com sucesso!'),
        error: (err) => this.handleApiError('Erro ao atualizar usuário.', err)
      });
      this.subscriptions.add(updateSub);
    } else {
      const payload: UsuarioCriacaoPayload = {
        nome: formValue.nome,
        login: formValue.login,
        email: formValue.email,
        senha: formValue.senha,
        ativo: formValue.ativo,
        idEmpresa: formValue.idEmpresa || null,
      };
      const createSub = this.usuarioService.criarUsuario(payload).subscribe({
        next: () => this.handleSuccess('Usuário criado com sucesso!'),
        error: (err) => this.handleApiError('Erro ao criar usuário.', err)
      });
      this.subscriptions.add(createSub);
    }
  }

  private handleSuccess(message: string): void {
    this.toastService.success(message);
    this.isLoading = false;
    // Redirecionamento baseado no contexto determinado no ngOnInit
    if (this.veioDeMeuPerfil) {
      this.router.navigate(['/ordem-servico']); // Ou para uma página de visualização de perfil, ou de onde veio
    } else {
      this.router.navigate(['/admin/usuarios']);
    }
  }

  private handleApiError(message: string, error: any): void {
    // ... (seu código de handleApiError) ...
    let detailErrorMessage = error.message || 'Erro desconhecido.';
    if (error.error && typeof error.error === 'object') {
        if (error.error.errors) {
            const validationErrors = [];
            for (const key in error.error.errors) {
                if (error.error.errors.hasOwnProperty(key) && Array.isArray(error.error.errors[key])) {
                    validationErrors.push(`${key}: ${error.error.errors[key].join(', ')}`);
                }
            }
            if (validationErrors.length > 0) {
                detailErrorMessage = validationErrors.join('; ');
            } else if (error.error.mensagem) {
                detailErrorMessage = error.error.mensagem;
            }
        } else if (error.error.mensagem) {
            detailErrorMessage = error.error.mensagem;
        } else if (error.error.title) {
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

  cancelar(): void {
    const ROTA_LAYOUT_PRINCIPAL = '/ordem-servico'; // Ou a rota principal da sua aplicação
    const ROTA_ADMIN_USUARIOS = '/admin/usuarios';

    const navigateToDefault = () => {
        if (this.veioDeMeuPerfil) {
            this.router.navigate([ROTA_LAYOUT_PRINCIPAL]);
        } else {
            this.router.navigate([ROTA_ADMIN_USUARIOS]);
        }
    };

    if (this.form.dirty) {
        const config: ConfirmationConfig = { // Agora usando a interface correta
            title: 'Descartar Alterações?',
            message: 'Todas as alterações não salvas serão perdidas. Deseja continuar?',
            acceptButtonText: 'Sim, Descartar', // Opcional, pode usar os padrões do dialog
            cancelButtonText: 'Não', // Opcional
            // acceptButtonClass: 'btn-danger', // Opcional
            // cancelButtonClass: 'btn-secondary' // Opcional
        };

        // A subscrição ao resultado do confirm
        this.confirmationService.confirm(config).subscribe((result: boolean) => {
            if (result) { // Usuário clicou em "Sim"
                navigateToDefault();
            }
            // Se result for false, não faz nada (usuário clicou em "Não")
        });
    } else {
        navigateToDefault();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private collectFormErrors(form: FormGroup | FormArray): any {
    // ... (seu código de collectFormErrors) ...
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
