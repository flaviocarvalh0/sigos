// form-prazo-garantia.component.ts
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { PrazoGarantiaService } from '../../../services/prazo_garantia.service';
import { PrazoGarantia } from '../../../Models/prazo_garantia.model';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';

@Component({
  selector: 'app-form-prazo_garantia',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './form-prazo-garantia.component.html',
  styleUrls: ['./form-prazo-garantia.component.css'],
})
export class FormPrazoGarantiaComponent implements OnInit {
  form: FormGroup;
  isEditando = false;
  prazoId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private prazoGarantiaService: PrazoGarantiaService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      prazoEmDias: [0, [Validators.required, Validators.min(1)]],
      descricao: ['', [Validators.required, Validators.maxLength(100)]],
      ativo: [true],
      dataUltimaModificacao: [null],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.prazoId = +id;
      this.isEditando = true;
      this.carregarPrazoGarantia();
    }

    this.setadescricaoPrazoGarantia();
  }

  setadescricaoPrazoGarantia(): void {
    this.form.get('prazoEmDias')?.valueChanges.subscribe((dias: number) => {
      const descricao = dias && dias > 0 ? `${dias} Dias` : '';
      this.form.get('descricao')?.setValue(descricao, { emitEvent: false });
    });
  }

  carregarPrazoGarantia(): void {
    if (this.prazoId) {
      this.prazoGarantiaService.obterPorId(this.prazoId).subscribe({
        next: (prazo) => {
          if (prazo) {
            this.form.patchValue({
              prazoEmDias: prazo.prazoEmDias,
              descricao: prazo.descricao,
              ativo: prazo.ativo,
              dataUltimaModificacao: prazo.dataModificacao,
            });
          }
        },
        error: () =>
          this.toastService.error('Erro ao carregar prazo de garantia'),
      });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const prazo: PrazoGarantia = {
        ...this.form.value,
        id: this.prazoId ?? 0,
      };

      const operacao =
        this.isEditando && this.prazoId
          ? this.prazoGarantiaService.atualizar(this.prazoId, prazo)
          : this.prazoGarantiaService.criar(prazo);

      operacao.subscribe({
        next: () => {
          this.toastService.success(
            this.isEditando
              ? 'Prazo de garantia atualizado com sucesso!'
              : 'Prazo de garantia cadastrado com sucesso!'
          );
          this.router.navigate(['/prazo_garantia']);
        },
        error: () => {
          this.toastService.error(
            this.isEditando
              ? 'Erro ao atualizar prazo de garantia'
              : 'Erro ao cadastrar prazo de garantia'
          );
        },
      });
    }
  }

  onCancelar(): void {
    this.router.navigate(['/prazo_garantia']);
  }

  onExcluir(): void {
    if (this.prazoId) {
      this.confirmationService
        .confirm({
          title: 'Confirmação',
          message: 'Tem certeza que deseja excluir este prazo de garantia?',
          acceptButtonText: 'Sim',
          cancelButtonText: 'Não',
          acceptButtonClass: 'btn btn-danger',
          cancelButtonClass: 'btn btn-secondary',
        })
        .subscribe((confirmed: boolean) => {
          if (confirmed) {
            this.prazoGarantiaService.remover(this.prazoId!).subscribe({
              next: () => {
                this.toastService.success(
                  'Prazo de garantia excluído com sucesso!'
                );
                this.router.navigate(['/prazo_garantia']);
              },
              error: () => {
                this.toastService.error('Erro ao excluir prazo de garantia');
              },
            });
          }
        });
    }
  }
}
