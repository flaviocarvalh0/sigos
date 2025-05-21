import { CommonModule, NgIf } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Marca } from '../../../../Models/marca.model';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MarcaService } from '../../../../services/marca.service';
import { ActivatedRoute, Router } from '@angular/router';

declare const bootstrap: any;

@Component({
    selector: 'app-form-marca',
    imports: [CommonModule, NgIf, FormsModule, ReactiveFormsModule],
    templateUrl: './form-marca.component.html',
    styleUrl: './form-marca.component.css'
})
export class FormMarcaComponent {
  @ViewChild('toast') toastElement!: ElementRef;

  form!: FormGroup;
  id!: number | null;
  isEditando = false;

  constructor(
    private fb: FormBuilder,
    private marcaService: MarcaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.form = this.fb.group({
      nome: ['', Validators.required],
      id_usuario_criador: [1], // pode ser substituído por id do usuário logado futuramente
      id_usuario_modificador: [1]
    });

    if (this.id) {
      this.marcaService.getMarcaById(this.id).subscribe(marca => {
        if (marca) {
          this.form.patchValue(marca);
          this.isEditando = true;
        }
      });
    }
  }

  salvar(): void {
    if (this.form.invalid) return;

    const marca: Marca = { ...this.form.value };

    if (this.id) {
      marca.id = this.id;
      this.marcaService.atualizar(marca).subscribe(() => {
        this.router.navigate(['/marca']);
      });
    } else {
      this.marcaService.salvar(marca).subscribe(() => {
        this.router.navigate(['/marca']);
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/marca']);
  }

  excluir(): void {
    if (confirm('Tem certeza que deseja excluir esta marca?')) {
      this.marcaService.excluir(this.id!).subscribe(() => {
        this.exibirToast();
        this.router.navigate(['/marca']);
      });
    }
  }

  exibirToast(): void {
    const toast = new bootstrap.Toast(this.toastElement.nativeElement);
    toast.show();
  }
}
