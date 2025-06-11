// form-workflow.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ToastService } from '../../../../../../services/toast.service';
import { WorkflowService } from '../../../../../../services/workflow/workflow.service';
import { WorkflowAtualizacaoPayload, WorkflowCriacaoPayload } from '../../../../../../Models/workflow/workflow.model';
import { WorkflowEstadosComponent } from '../workflow-estado/workflow-estado.component';


@Component({
  selector: 'app-form-workflow',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    WorkflowEstadosComponent
  ],
  templateUrl: './form-workflow.component.html',
})
export class FormWorkflowComponent implements OnInit {
  form!: FormGroup;
  workflowId: number | null = null;

  private fb = inject(FormBuilder);
  private service = inject(WorkflowService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      this.workflowId = idParam ? +idParam : null;

      this.buildForm();

      if (this.workflowId) {
        this.service.obterPorId(this.workflowId).subscribe(workflow => {
          if (workflow) {
            this.form.patchValue(workflow);
          }
        });
      }
    });
  }

  buildForm() {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      descricao: ['', [Validators.maxLength(500)]],
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toast.error("Formulário inválido. Verifique os campos.");
      return;
    }

    const formValue = this.form.value;

    if (this.workflowId) {
      // ATUALIZAÇÃO
      const payload: WorkflowAtualizacaoPayload = {
        id: this.workflowId,
        nome: formValue.nome,
        descricao: formValue.descricao
      };
      this.service.atualizar(this.workflowId, payload).subscribe(() => {
        this.toast.success('Workflow atualizado com sucesso!');
        // Não navegamos mais, permanecemos na tela
      });
    } else {
      // CRIAÇÃO
      const payload: WorkflowCriacaoPayload = {
        nome: formValue.nome,
        descricao: formValue.descricao
      };
      this.service.criar(payload).subscribe(novoWorkflow => {
        this.toast.success('Workflow criado com sucesso!');
        // Após criar, navegamos para a rota de edição para habilitar as outras abas
        this.router.navigate(['/admin/workflow/form', novoWorkflow.id]);
      });
    }
  }

  cancelar() {
    this.router.navigate(['/admin/workflows']);
  }
}
