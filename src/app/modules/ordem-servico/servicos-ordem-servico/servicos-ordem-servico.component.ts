import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { OrdemServicoServicoService } from '../../../services/ordem-servico/ordem-servico-servico.service';
import { ToastService } from '../../../services/toast.service';
import {
  OrdemServicoServico,
  OrdemServicoServicoCriacaoPayload
} from '../../../Models/ordem-servico/ordem-servico-servico';
import { OrdemServico } from '../../../Models/ordem-servico/ordem-servico.model';
import { OrdemServicoService } from '../../../services/ordem-servico/ordem-servico.service';

@Component({
  selector: 'app-servicos-ordem-servico',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './servicos-ordem-servico.component.html',
  styleUrls: ['./servicos-ordem-servico.component.css']
})
export class ServicosOrdemServicoComponent implements OnInit, OnChanges {
  @Input() ordemServicoId!: number;
  @Input() servicosDisponiveis: any[] = [];
  @Input() ordemServico!: OrdemServico;
  @Output() itemAlterado = new EventEmitter<void>();

  servicosAdicionados: OrdemServicoServico[] = [];
  novoServico: OrdemServicoServicoCriacaoPayload = this.criarNovoServico();

  constructor(
    private toast: ToastService,
    private servicoOsService: OrdemServicoServicoService,
    private ordemServicoService: OrdemServicoService
  ) {}

  ngOnInit(): void {
    if (this.ordemServicoId) {
      this.carregarServicos();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['ordemServicoId'] &&
      changes['ordemServicoId'].currentValue &&
      changes['ordemServicoId'].currentValue !== changes['ordemServicoId'].previousValue
    ) {
      this.carregarServicos();
    }
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

    this.servicoOsService.criarServico(this.ordemServicoId, this.novoServico).subscribe({
      next: (resposta) => {
        this.toast.success('Serviço adicionado.');
        this.ordemServico = resposta.dados;
        this.itemAlterado.emit();
        this.novoServico = this.criarNovoServico();
        this.carregarServicos();
      },
      error: (err) => this.toast.error(err.message),
    });
  }

  removerServico(servicoId: number): void {
    this.servicoOsService.removerServico(this.ordemServicoId, servicoId).subscribe({
      next: (resposta) => {
        this.toast.success('Serviço removido.');
        this.itemAlterado.emit(resposta.ordemServicoAtualizada);
        this.carregarServicos();
      },
      error: (err) => this.toast.error('Erro ao remover serviço: ' + err.message)
    });
  }

  carregarServicos(): void {
    if (!this.ordemServicoId) return;

    this.servicoOsService.obterPorOrdemServico(this.ordemServicoId).subscribe({
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
