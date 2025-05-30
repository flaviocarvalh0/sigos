import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup , Validators } from '@angular/forms';
import { ReactiveFormsModule} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { Servico } from '../../../../Models/servico.mode';
import { ServicoService } from '../../../../services/service.service';

declare const bootstrap: any;

@Component({
    selector: 'app-form-modelo',
    templateUrl: './form-servico.component.html',
    styleUrls: ['./form-servico.component.css'],
    standalone: true,
    imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule
  ],
})
export class FormServicoComponent implements OnInit {
  private fb = inject(FormBuilder);
  isEditando = false;
  form: FormGroup;
  servicos: Servico[] = [];
  servicoId: number | null = null;

  constructor(
    private servicoService: ServicoService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      descricao: [''],
      valor: [null, [Validators.required, Validators.min(0)]],
      duracao: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.servicoId = +id;
        this.isEditando = true;
        this.carregarServico(this.servicoId);
      }
    });
  }

  carregarServico(id: number): void {
  this.servicoService.buscarPorId(id).subscribe({
    next: (servico: Servico | undefined) => {
      if (servico) {
        this.form.patchValue({
          nome: servico.nome,
          descricao: servico.descricao,
          valor: servico.valor,
          duracao: servico.duracao,
          // Remova id_marca se não existir no modelo Servico
        });
      } else {
        console.error('Serviço não encontrado');
        this.showToast('Serviço não encontrado');
      }
    },
    error: (err) => {
      console.error('Erro ao carregar serviço:', err);
      this.showToast('Erro ao carregar dados do serviço');
    }
  });
}
  carregarServicos(): void {
    this.servicoService.listar().subscribe(marcas => {
      this.servicos = marcas;
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formData = this.form.value;
      const servicoData = {
        ...formData,
        id_marca: Number(formData.id_marca) // Conversão explícita
      };

      if (this.isEditando && this.servicoId) {
        this.servicoService.atualizar(this.servicoId, servicoData).subscribe({
          next: () => {
            this.showToast('Serviço atualizado com sucesso!');
            this.router.navigate(['/servico']);
          },
          error: (err) => {
            console.error('Erro ao serviço serviço:', err);
            this.showToast('Erro ao serviço serviço');
          }
        });
      } else {
        this.servicoService.criar(servicoData).subscribe({
          next: () => {
            this.showToast('Serviço criado com sucesso!');
            this.router.navigate(['/servico']);
          },
          error: (err) => {
            console.error('Erro ao criar serviço:', err);
            this.showToast('Erro ao criar serviço');
          }
        });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancelar(): void {
    this.router.navigate(['/servico']);
  }

  onExcluir(): void {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      if (this.servicoId) {
        this.servicoService.excluir(this.servicoId).subscribe({
          next: () => {
            this.showToast('Serviço excluído com sucesso!');
            this.router.navigate(['/servico']);
          },
          error: (err) => {
            console.error('Erro ao excluir serviço:', err);
            this.showToast('Erro ao excluir serviço');
          }
        });
      }
    }
  }

  private showToast(message: string): void {
    const toastEl = document.getElementById('liveToast');
    if (toastEl) {
      const toastBody = toastEl.querySelector('.toast-body');
      if (toastBody) toastBody.textContent = message;

      const toast = new bootstrap.Toast(toastEl);
      toast.show();
    }
  }
}
