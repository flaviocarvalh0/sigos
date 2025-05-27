import { NgSelectModule } from '@ng-select/ng-select';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EstoqueService } from '../../../services/estoque.service';
import { Peca } from '../../../Models/peca.model';
import { PecaService } from '../../../services/peca.service';
declare const bootstrap: any;

@Component({
  selector: 'app-form-estoque',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, NgSelectModule],
  templateUrl: './form-estoque.component.html',
  styleUrls: ['./form-estoque.component.css']
})
export class FormEstoqueComponent implements OnInit {
  form!: FormGroup;
  isEditando = false;
  estoqueId: number | null = null;
  pecas: Peca[] = [];
  pecaJaTemEstoque = false;

  constructor(
    private fb: FormBuilder,
    private estoqueService: EstoqueService,
    private pecaService: PecaService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      id_peca: [null, Validators.required],
      id_usuario_criador: [1],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.estoqueId = +idParam;
        this.carregarEstoque(this.estoqueId);
        this.isEditando = true;
      }
    });
    this.carregarPecas();

    this.form.get('id_peca')?.valueChanges.subscribe(idPeca => {
      if (idPeca) {
        this.estoqueService.buscarPorPeca(idPeca).subscribe(estoque => {
          this.pecaJaTemEstoque = !!estoque;
        });
      } else {
        this.pecaJaTemEstoque = false;
      }
    });
  }

  carregarEstoque(id: number): void {
    this.estoqueService.buscarPorId(id).subscribe((estoque) => {
      if (estoque) {
        this.form.patchValue({
          id_peca: estoque.id_peca,
          id_usuario_criador: estoque.id_usuario_criador,
        });
      }
    });
  }

  carregarPecas(): void {
    this.pecaService.listar().subscribe({
      next: (items) => {
        this.pecas = items;
      },
      error: (error) => {
        console.error('Erro ao carregar estoque:', error);
        this.showToast('Erro ao carregar estoque');
      },
    });
  }

 onSubmit(): void {
  // Marcar todos os campos como tocados para exibir validações
  this.form.markAllAsTouched();

  // Bloqueia envio se o formulário estiver inválido
  if (this.form.invalid) return;

  const data = this.form.getRawValue();

  if (this.isEditando && this.estoqueId) {
    // Edição permitida mesmo que a peça já tenha estoque
    this.estoqueService.atualizarEstoque(this.estoqueId, data).subscribe(() => {
      this.showToast('Estoque atualizado com sucesso!');
      this.router.navigate(['/estoque']);
    });
  } else {
    // Criação só é permitida se a peça ainda não tiver estoque
    if (this.pecaJaTemEstoque) {
      this.showToast('Esta peça já possui estoque cadastrado!');
      return;
    }

    this.estoqueService.criar(data).subscribe(() => {
      this.showToast('Estoque criado com sucesso!');
      this.router.navigate(['/estoque']);
    });
  }
}


  onCancelar(): void {
    this.router.navigate(['/estoque']);
  }

  onExcluir(): void {
    if (this.estoqueId && confirm('Deseja realmente excluir este item de estoque?')) {
      this.estoqueService.excluir(this.estoqueId).subscribe(() => {
        this.showToast('Estoque excluído com sucesso!');
        this.router.navigate(['/estoque']);
      });
    }
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
