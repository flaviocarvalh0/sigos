import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {  ClienteService } from '../../../../services/cliente.service';
import { Cliente } from '../../../../Models/cliente.model';

declare const bootstrap: any;

@Component({
  selector: 'app-lista-cliente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-clientes.component.html',
})
export class ListaClienteComponent {
  clientes: Cliente[] = [];

  @ViewChild('toast') toastElement!: ElementRef;

  constructor(private clienteService: ClienteService, private router: Router) {
    this.carregarClientes();
  }

  carregarClientes() {
    this.clienteService.getClientes().subscribe(lista => {
      this.clientes = lista;
    });
  }

  editar(id: number) {
    this.router.navigate(['/cliente/form', id]);
  }

  excluir(id: number) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      this.clienteService.deleteCliente(id).subscribe(() => {
        this.carregarClientes();
        this.exibirToast();
      });
    }
  }


  novoCliente() {
    this.router.navigate(['/cliente/form']);
  }

  exibirToast() {
    const toast = new bootstrap.Toast(this.toastElement.nativeElement);
    toast.show();
  }
}
