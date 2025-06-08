import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../../services/toast.service';
import { WorkflowService } from '../../../../../services/workflow/workflow.service';


@Component({
  selector: 'app-form-workflow',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-workflow.component.html',
})
export class FormWorkflowComponent implements OnInit {
  form!: FormGroup;
  workflowId: number | null = null;
  titulo = 'Cadastro de Workflow';

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
        this.service.obterPorId(this.workflowId).subscribe(res => {
          const workflow = res;
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
    if (this.form.invalid) return;

    const payload = this.form.value;

    if (this.workflowId) {
      this.service.atualizar(this.workflowId, { id: this.workflowId, ...payload }).subscribe(() => {
        this.toast.success('Workflow atualizado com sucesso!');
        this.router.navigate(['/admin/workflows']);
      });
    } else {
      this.service.criar(payload).subscribe(() => {
        this.toast.success('Workflow criado com sucesso!');
        this.router.navigate(['/admin/workflows']);
      });
    }
  }

  cancelar() {
    this.router.navigate(['/admin/workflows']);
  }
}
