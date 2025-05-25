// src/app/components/peca-list/peca-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Peca } from '../../../../Models/peca.model';
import { PecaService } from '../../../../services/peca.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-peca-list',
  templateUrl: './list-pecas.component.html',
  styleUrls: ['./list-pecas.component.css'],
  imports: [RouterModule, CommonModule],
  standalone: true,
})
export class ListPecaComponent implements OnInit {
  pecas: Peca[] = [];

  constructor(private pecaService: PecaService, private router: Router) { }

  ngOnInit(): void {
    this.carregarPecas();
  }

  carregarPecas(): void {
    this.pecaService.listar().subscribe({
      next: (data) => this.pecas = data,
      complete: () => console.log('Peças carregadas com sucesso: ', this.pecas),
      error: (err) => console.error('Erro ao carregar peças', err)
    });
  }

  excluirPeca(id: number): void {
    if (confirm('Tem certeza que deseja excluir esta peça?')) {
      this.pecaService.excluir(id).subscribe({
        next: () => this.carregarPecas(),
        error: (err) => console.error('Erro ao excluir peça', err)
      });
    }
  }

  editarPeca(id: number): void {
    this.router.navigate(['/peca/form', id]);
  }

  novaPeca(): void {
    this.router.navigate(['/peca/form']);
  }
}
