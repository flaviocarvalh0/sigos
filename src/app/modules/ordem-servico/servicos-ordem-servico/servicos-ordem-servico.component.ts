import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { OrdemServicoServicoService } from '../../../services/ordem-servico/ordem-servico-servico.service';
import { ToastService } from '../../../services/toast.service';
import { OrdemServicoServico, OrdemServicoServicoCriacaoPayload } from '../../../Models/ordem-servico/ordem-servico-servico';
import { OrdemServico } from '../../../Models/ordem-servico/ordem-servico.model';



@Component({
  selector: 'app-servicos-ordem-servico',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './servicos-ordem-servico.component.html',
  styleUrls: ['./servicos-ordem-servico.component.css']
})
export class ServicosOrdemServicoComponent implements OnInit {
  @Input() ordemServicoId!: number;
  @Input() servicosDisponiveis: any[] = [];
  @Output() osAtualizada = new EventEmitter<OrdemServico>();

  servicosAdicionados: OrdemServicoServico[] = [];

  novoServico: OrdemServicoServicoCriacaoPayload = this.criarNovoServico();

  constructor(
    private servicoService: OrdemServicoServicoService,
    private toast: ToastService,
    private servicoOsService: OrdemServicoServicoService,
  ) {}

  ngOnInit(): void {
    this.carregarServicos();
  }

  criarNovoServico(): OrdemServicoServicoCriacaoPayload {
    return {
      idOrdemServico: this.ordemServicoId,
      idServico: null!,
      precoPraticado: 0,
      tempoEstimadoMinutos: 0,
      observacao: ''
    };
  }

  aoSelecionarServico(): void {
    const servico = this.servicosDisponiveis.find(s => s.id === this.novoServico.idServico);

    if (servico) {
      this.novoServico.precoPraticado = servico.valor || 0;
      this.novoServico.tempoEstimadoMinutos = servico.tempo || 0;
    }
  }

  salvarServico(): void {
    if (!this.novoServico.idServico) {
      this.toast.warning('Selecione um serviço.');
      return;
    }

    this.novoServico.idOrdemServico = this.ordemServicoId;

    console.log(this.novoServico);
    this.servicoService.criarServico(this.ordemServicoId, this.novoServico).subscribe({
      next: (res) => {

        this.toast.success('Serviço adicionado.');
        console.log(res.dados.ordemServicoAtualizada);
        this.osAtualizada.emit(res.dados.ordemServicoAtualizada);
        this.resetarFormulario();
        this.carregarServicos();
      },
      error: (err) => this.toast.error(err.message)
    });
  }

   removerServico(id: number): void {
    this.servicoOsService.removerServico(this.ordemServicoId, id).subscribe({
      next: (resposta) => {
        this.toast.success('Serviço removido com sucesso.');
        // Emite a OS atualizada para o componente pai
        this.osAtualizada.emit(resposta.ordemServicoAtualizada);
        this.resetarFormulario();
        this.carregarServicos(); // Recarrega a lista
      },
      error: (err) => this.toast.error(err.message || 'Erro ao remover serviço'),
    });
  }

  carregarServicos(): void {
    this.servicoService.obterPorOrdemServico(this.ordemServicoId).subscribe({
      next: (res) => this.servicosAdicionados = res.dados || [],
      error: (err) => this.toast.error(err.message)
    });
  }

  calcularTotal(): number {
    return this.servicosAdicionados.reduce((acc, s) => acc + (s.precoPraticado || 0), 0);
  }

  getDescricaoServico(s: OrdemServicoServico): string {
    return s.nomeServico || this.servicosDisponiveis.find(sd => sd.id === s.idServico)?.nome || 'Desconhecido';
  }

  resetarFormulario(): void {
  this.novoServico = this.criarNovoServico();
}

}
