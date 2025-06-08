import { GrupoService } from './../../../../services/grupo.service';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  FormArray,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subscription } from 'rxjs';

import { UsuarioService } from '../../../../services/usuario.service';
import { EmpresaService } from '../../../../services/empresa.service';
import {
  Usuario,
  Grupo,
  UsuarioCriacaoPayload,
  UsuarioAtualizacaoPayload,
} from '../../../../Models/usuario.model';
import { Empresa } from '../../../../Models/empresa.model';

import { ToastService } from '../../../../services/toast.service';
import { ConfirmationService } from '../../../../services/confirmation.service';
import { ConfirmationConfig } from '../../../../Models/confirmation.model';
import { AuthService } from '../../../../services/auth/auth.service';
import { GrupoUsuarioService } from '../../../../services/grupo_usuario.service';
import { GrupoUsuario } from '../../../../Models/grupo_usuario.model';
import { FilterPipe } from '../../../../shared/helpers/filter.pipe';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
    RouterModule,
    FilterPipe,
    FormsModule
  ],
  templateUrl: './form-usuario.component.html',
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

  private veioDeMeuPerfil = false;

  filtroGrupo = '';
  gruposDisponiveis: { id: number; descricao: string; nome: string }[] = [];
  gruposSelecionados: number[] = [];
  gruposVinculados: { idGrupo: number; nomeGrupo: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private empresaService: EmpresaService,
    private route: ActivatedRoute,
    public router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private authService: AuthService,
    private grupoService: GrupoService,
    private grupoUsuarioService: GrupoUsuarioService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.url.subscribe((segments) => {
        const path = segments.map((s) => s.path).join('/');
        this.veioDeMeuPerfil = path.includes('meu-perfil/editar');

        this.loadEmpresas().then(() => {
          if (this.veioDeMeuPerfil) {
            const currentUser = this.authService.currentUserValue;
            if (currentUser && currentUser.id) {
              this.usuarioId = currentUser.id;
              this.isEditMode = true;
              this.loadUsuarioParaEdicao();
            } else {
              this.toastService.error(
                'Usuário não autenticado para editar perfil.'
              );
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

  initForm(usuario?: Usuario): void {
    const senhaValidators = !this.isEditMode
      ? [Validators.required, Validators.minLength(6)]
      : [Validators.minLength(6)];
    const confirmarSenhaValidators = !this.isEditMode
      ? [Validators.required]
      : [];

    this.form = this.fb.group(
      {
        nome: [usuario?.nome || '', Validators.required],
        login: [usuario?.login || '', Validators.required],
        email: [usuario?.email || '', [Validators.required, Validators.email]],
        senha: ['', senhaValidators],
        confirmarSenha: ['', confirmarSenhaValidators],
        idEmpresa: [usuario?.idEmpresa || null],
        ativo: [usuario ? usuario.ativo : true, Validators.required],
      },
      {
        validators: this.senhasCombinamValidator,
      }
    );

    if (this.isEditMode) {
      this.form.get('login')?.disable();
      const senhaCtrl = this.form.get('senha');
      const confirmarSenhaCtrl = this.form.get('confirmarSenha');

      if (senhaCtrl && confirmarSenhaCtrl) {
        this.subscriptions.add(
          senhaCtrl.valueChanges.subscribe((value) => {
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

    if (senha && senha.trim() !== '' && senha !== confirmarSenha) {
      group.get('confirmarSenha')?.setErrors({ senhasNaoCombinam: true });
      return { senhasNaoCombinamGlobal: true };
    }

    return null;
  }

  loadEmpresas(): Promise<void> {
    return new Promise((resolve) => {
      const empresaSub = this.empresaService.obterTodos().subscribe({
        next: (data: Empresa[]) => {
          this.empresas = data;
          resolve();
        },
        error: (err) => {
          this.toastService.error(
            'Erro ao carregar empresas: ' + (err.message || 'Verifique a API.')
          );
          resolve();
        },
      });
      this.subscriptions.add(empresaSub);
    });
  }

  loadUsuarioParaEdicao(): void {
    if (!this.usuarioId) return;
    this.isLoading = true;
    const userSub = this.usuarioService.obterPorId(this.usuarioId).subscribe(
      (usuario) => {
        if (usuario) {
          this.initForm(usuario);
          this.form.patchValue({
            senha: usuario.senha,
            confirmarSenha: usuario.senha
          });

          this.dataModificacaoUsuarioAtual = usuario.dataModificacao;
          this.carregarGruposDoUsuario();
        } else {
          this.toastService.error('Usuário não encontrado.');
          this.router.navigate([
            this.veioDeMeuPerfil ? '/ordem-servico' : '/admin/usuarios',
          ]);
        }
        this.isLoading = false;
      },
      (error) => this.handleApiError('Erro ao carregar usuário.', error)
    );
    this.subscriptions.add(userSub);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toastService.error(
        'Formulário inválido. Verifique os campos destacados.'
      );
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
        senha: formValue.senha,
        idEmpresa: formValue.idEmpresa || null,
        dataUltimaModificacao: this.dataModificacaoUsuarioAtual,
      };
      if (formValue.senha && formValue.senha.trim() !== '') {
        payload.senha = formValue.senha;
      }

      this.usuarioService.atualizarUsuario(this.usuarioId, payload).subscribe({
        next: () => this.handleSuccess('Usuário atualizado com sucesso!'),
        error: (err) => this.handleApiError('Erro ao atualizar usuário.', err),
      });
    } else {
      const payload: UsuarioCriacaoPayload = {
        nome: formValue.nome,
        login: formValue.login,
        email: formValue.email,
        senha: formValue.senha,
        ativo: formValue.ativo,
        idEmpresa: formValue.idEmpresa || null,
      };
     this.usuarioService.criarUsuario(payload).subscribe({
  next: (res) => {
    if (res?.id && this.gruposVinculados.length > 0) {
      const vinculos = this.gruposVinculados.map((grupo) => ({
        idUsuario: res.id,
        idGrupo: grupo.idGrupo,
      }));
      this.grupoUsuarioService.criarMultiplos(vinculos).subscribe(() => {
        this.toastService.success('Usuário e grupos vinculados com sucesso!');
        this.router.navigate(['/admin/usuarios']);
      });
    } else {
      this.handleSuccess('Usuário criado com sucesso!');
    }
  },

        error: (err) => this.handleApiError('Erro ao criar usuário.', err),
      });
    }
  }

  handleSuccess(message: string): void {
    this.toastService.success(message);
    this.isLoading = false;
    this.router.navigate([
      this.veioDeMeuPerfil ? '/ordem-servico' : '/admin/usuarios',
    ]);
  }

  handleApiError(message: string, error: any): void {
    let detailErrorMessage = error.message || 'Erro desconhecido.';
    if (error.error && typeof error.error === 'object') {
      if (error.error.errors) {
        const validationErrors = [];
        for (const key in error.error.errors) {
          if (Array.isArray(error.error.errors[key])) {
            validationErrors.push(
              `${key}: ${error.error.errors[key].join(', ')}`
            );
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

  abrirModalSelecaoGrupos(): void {
    this.grupoService.obterParaSelecao().subscribe({
      next: (grupos) => {
        this.gruposDisponiveis = grupos
          .filter((g) => !this.gruposVinculados.some((v) => v.idGrupo === g.id))
          .map((g) => ({
            id: g.id,
            descricao: g.descricao,
            nome: (g as any).nome ?? g.descricao, // Ajuste conforme o nome correto da propriedade
          }));
        const modal = document.getElementById('modalGrupos');
        if (modal) {
          const bootstrapModal = new (window as any).bootstrap.Modal(modal);
          bootstrapModal.show();
        }
      },
      error: () =>
        this.toastService.error('Erro ao carregar grupos disponíveis.'),
    });
  }

  onSelecionarGrupo(event: Event, idGrupo: number): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      if (!this.gruposSelecionados.includes(idGrupo)) {
        this.gruposSelecionados.push(idGrupo);
      }
    } else {
      this.gruposSelecionados = this.gruposSelecionados.filter(
        (id) => id !== idGrupo
      );
    }
  }

  confirmarGruposSelecionados(): void {
    if (!this.usuarioId) {
      this.gruposSelecionados.forEach((idGrupo) => {
        const grupo = this.gruposDisponiveis.find((g) => g.id === idGrupo);
        if (grupo) {
          this.gruposVinculados.push({ idGrupo, nomeGrupo: grupo.descricao });
        }
      });
    } else {
      const novos = this.gruposSelecionados.filter(
        (id) => !this.gruposVinculados.some((g) => g.idGrupo === id)
      );
      const vinculos = novos.map((idGrupo) => ({
        idGrupo,
        idUsuario: this.usuarioId!,
      }));
      if (vinculos.length) {
        this.grupoUsuarioService.criarMultiplos(vinculos).subscribe(() => {
          this.toastService.success('Grupos vinculados com sucesso!');
          this.carregarGruposDoUsuario();
        });
      }
    }

    this.gruposSelecionados = [];

    const modalEl = document.getElementById('modalGrupos');
    if (modalEl) {
      const instance = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (instance) {
        instance.hide();
      }
    }
  }

  removerGrupo(idGrupo: number): void {
    if (!this.usuarioId) return;
    this.grupoUsuarioService
      .removerVinculos([{ idGrupo: idGrupo, idUsuario: this.usuarioId }])
      .subscribe(() => {
        this.toastService.success('Grupo removido.');
        this.carregarGruposDoUsuario();
      });
  }

  carregarGruposDoUsuario(): void {
    if (!this.usuarioId) return;
    this.grupoUsuarioService.obterTodos().subscribe((res) => {
      if (res.sucesso && res.dados) {
        this.gruposVinculados = res.dados
          .filter((x) => x.idUsuario === this.usuarioId)
          .map((g) => ({
            idGrupo: g.idGrupo,
            nomeGrupo: g.nomeGrupo || 'Grupo ' + g.idGrupo,
          }));
      }
    });
  }

  cancelar(): void {
    const navigateToDefault = () => {
      this.router.navigate([
        this.veioDeMeuPerfil ? '/ordem-servico' : '/admin/usuarios',
      ]);
    };
      navigateToDefault();
  
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
