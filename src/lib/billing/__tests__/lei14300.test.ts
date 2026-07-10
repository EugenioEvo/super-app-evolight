import { describe, it, expect } from 'vitest';
import {
  classificarGD,
  possuiDireitoAdquirido,
  obterPercentualFioB,
  obterConfiguracaoLei14300,
  estimarDecomposicaoTusd,
  montarComponentesTarifarios,
  calcularEconomiaLei14300,
  gerarProjecaoTransicao,
  calcularImpactoComparativo,
  formatarClassificacaoGD,
  formatarPercentualFioB,
  obterDescricaoAnoTransicao,
  type ComponentesTarifarios,
} from '@/lib/billing/lei14300';

// Tarifas realistas usadas nos cenários:
// TUSD = 0,45 R$/kWh, TE = 0,30 R$/kWh, consumo 1000 kWh
// => valorTusd = 450, valorTe = 300
const componentesRealistas: ComponentesTarifarios = {
  te: 300,          // 1000 kWh x 0,30
  tusdTotal: 450,   // 1000 kWh x 0,45
  tusdFioA: 112.5,  // 25% da TUSD
  tusdFioB: 202.5,  // 45% da TUSD
  tusdEncargos: 135, // 30% da TUSD
  bandeiras: 50,
  tributos: 100,
  cip: 20,
};

describe('classificarGD', () => {
  it('classifica protocolo anterior à lei como GD1', () => {
    expect(classificarGD('2022-06-15')).toBe('gd1');
    expect(classificarGD(new Date('2021-12-31'))).toBe('gd1');
  });

  it('classifica protocolo exatamente em 06/01/2023 como GD1 (data limite inclusiva)', () => {
    expect(classificarGD('2023-01-06')).toBe('gd1');
  });

  it('classifica protocolo após 06/01/2023 como GD2', () => {
    expect(classificarGD('2023-01-07')).toBe('gd2');
    expect(classificarGD('2024-05-01')).toBe('gd2');
  });

  it('trata data nula como GD2 (sem direito adquirido)', () => {
    expect(classificarGD(null)).toBe('gd2');
  });

  it('possuiDireitoAdquirido espelha a classificação', () => {
    expect(possuiDireitoAdquirido('2022-01-01')).toBe(true);
    expect(possuiDireitoAdquirido('2023-06-01')).toBe(false);
    expect(possuiDireitoAdquirido(null)).toBe(false);
  });
});

describe('obterPercentualFioB - escalonamento da Lei 14.300', () => {
  it('retorna 0% antes de 2023 (regras anteriores)', () => {
    expect(obterPercentualFioB(2022)).toBe(0);
    expect(obterPercentualFioB(2010)).toBe(0);
  });

  it.each([
    [2023, 15],
    [2024, 30],
    [2025, 45],
    [2026, 60],
    [2027, 75],
    [2028, 90],
    [2029, 100],
  ])('ano %i => %i%% de Fio B não compensável', (ano, esperado) => {
    expect(obterPercentualFioB(ano)).toBe(esperado);
  });

  it('mantém 100% após o fim da transição', () => {
    expect(obterPercentualFioB(2030)).toBe(100);
    expect(obterPercentualFioB(2045)).toBe(100);
  });
});

describe('obterConfiguracaoLei14300', () => {
  it('GD1: Fio B e encargos sempre 0% (direito adquirido)', () => {
    const cfg = obterConfiguracaoLei14300('2022-06-01', 2026);
    expect(cfg.classificacaoGD).toBe('gd1');
    expect(cfg.percentualFioB).toBe(0);
    expect(cfg.percentualEncargos).toBe(0);
    expect(cfg.possuiDireitoAdquirido).toBe(true);
  });

  it('GD2: aplica escalonamento do ano e 100% de encargos', () => {
    const cfg = obterConfiguracaoLei14300('2023-08-01', 2024);
    expect(cfg.classificacaoGD).toBe('gd2');
    expect(cfg.percentualFioB).toBe(30);
    expect(cfg.percentualEncargos).toBe(100);
    expect(cfg.possuiDireitoAdquirido).toBe(false);
  });
});

describe('estimarDecomposicaoTusd (fallback de proporções fixas)', () => {
  it('divide a TUSD em 25% Fio A, 45% Fio B, 30% encargos', () => {
    const d = estimarDecomposicaoTusd(450); // TUSD 0,45 R$/kWh x 1000 kWh
    expect(d.fioA).toBeCloseTo(112.5, 10);
    expect(d.fioB).toBeCloseTo(202.5, 10);
    expect(d.encargos).toBeCloseTo(135, 10);
    expect(d.fioA + d.fioB + d.encargos).toBeCloseTo(450, 10);
  });

  it('retorna zeros para TUSD zero', () => {
    expect(estimarDecomposicaoTusd(0)).toEqual({ fioA: 0, fioB: 0, encargos: 0 });
  });
});

describe('montarComponentesTarifarios', () => {
  it('usa decomposição informada quando presente', () => {
    const c = montarComponentesTarifarios({
      valorTe: 300,
      valorTusd: 450,
      tusdFioA: 100,
      tusdFioB: 250,
      tusdEncargos: 100,
      bandeiras: 30,
      tributos: 80,
      cip: 15,
    });
    expect(c.tusdFioA).toBe(100);
    expect(c.tusdFioB).toBe(250);
    expect(c.tusdEncargos).toBe(100);
    expect(c.te).toBe(300);
  });

  it('aplica fallback de estimativa quando decomposição ausente', () => {
    const c = montarComponentesTarifarios({ valorTe: 300, valorTusd: 450 });
    expect(c.tusdFioA).toBeCloseTo(112.5, 10);
    expect(c.tusdFioB).toBeCloseTo(202.5, 10);
    expect(c.tusdEncargos).toBeCloseTo(135, 10);
    expect(c.bandeiras).toBe(0);
    expect(c.tributos).toBe(0);
    expect(c.cip).toBe(0);
  });

  it('não estima se ao menos um componente foi informado', () => {
    const c = montarComponentesTarifarios({ valorTe: 300, valorTusd: 450, tusdFioB: 200 });
    expect(c.tusdFioA).toBe(0);
    expect(c.tusdFioB).toBe(200);
    expect(c.tusdEncargos).toBe(0);
  });
});

describe('calcularEconomiaLei14300 - GD1 (compensação integral)', () => {
  it('compensa TE + TUSD + bandeiras + tributos, exceto CIP, na proporção da energia compensada', () => {
    // 500 kWh compensados de 1000 kWh => proporção 0,5
    const r = calcularEconomiaLei14300({
      classificacaoGD: 'gd1',
      anoFatura: 2025,
      energiaSimultaneaKwh: 0,
      energiaCompensadaKwh: 500,
      consumoTotalKwh: 1000,
      componentesTarifarios: componentesRealistas,
      tarifaMediaRsKwh: 0.75,
    });
    // (300 + 112,5 + 202,5 + 50 + 100) x 0,5 = 382,50
    expect(r.economiaCompensacao).toBeCloseTo(382.5, 6);
    // CIP não compensável: 20 x 0,5 = 10
    expect(r.valorNaoCompensavel).toBeCloseTo(10, 6);
    expect(r.percentualFioBVigente).toBe(0);
    expect(r.detalhamento.tusdFioBNaoCompensado).toBe(0);
    expect(r.detalhamento.encargosNaoCompensados).toBe(0);
  });

  it('inclui economia por simultaneidade a tarifa cheia', () => {
    const r = calcularEconomiaLei14300({
      classificacaoGD: 'gd1',
      anoFatura: 2025,
      energiaSimultaneaKwh: 200,
      energiaCompensadaKwh: 0,
      consumoTotalKwh: 1000,
      componentesTarifarios: componentesRealistas,
      tarifaMediaRsKwh: 0.75,
    });
    expect(r.economiaSimultaneidade).toBeCloseTo(150, 6); // 200 x 0,75
    expect(r.economiaCompensacao).toBeCloseTo(0, 6);
    expect(r.economiaTotal).toBeCloseTo(150, 6);
  });

  it('consumo total zero não gera divisão por zero', () => {
    const r = calcularEconomiaLei14300({
      classificacaoGD: 'gd1',
      anoFatura: 2025,
      energiaSimultaneaKwh: 0,
      energiaCompensadaKwh: 0,
      consumoTotalKwh: 0,
      componentesTarifarios: componentesRealistas,
      tarifaMediaRsKwh: 0.75,
    });
    expect(r.economiaTotal).toBe(0);
    expect(r.valorNaoCompensavel).toBe(0);
  });
});

describe('calcularEconomiaLei14300 - GD2 (escalonamento Fio B)', () => {
  // Cenário: ano 2025 (45% do Fio B não compensável), 500/1000 kWh => proporção 0,5
  const params = {
    classificacaoGD: 'gd2' as const,
    anoFatura: 2025,
    energiaSimultaneaKwh: 0,
    energiaCompensadaKwh: 500,
    consumoTotalKwh: 1000,
    componentesTarifarios: componentesRealistas,
    tarifaMediaRsKwh: 0.75,
  };

  it('aplica 45% de Fio B não compensável em 2025', () => {
    const r = calcularEconomiaLei14300(params);
    expect(r.percentualFioBVigente).toBe(45);
    // Fio B proporcional: 202,5 x 0,5 = 101,25
    // Não compensado: 101,25 x 0,45 = 45,5625; compensado: 55,6875
    expect(r.detalhamento.tusdFioBNaoCompensado).toBeCloseTo(45.5625, 6);
    expect(r.detalhamento.tusdFioBCompensado).toBeCloseTo(55.6875, 6);
  });

  it('TE e Fio A são integralmente compensáveis; encargos, bandeiras e CIP não', () => {
    const r = calcularEconomiaLei14300(params);
    expect(r.detalhamento.teCompensado).toBeCloseTo(150, 6);       // 300 x 0,5
    expect(r.detalhamento.tusdFioACompensado).toBeCloseTo(56.25, 6); // 112,5 x 0,5
    expect(r.detalhamento.encargosNaoCompensados).toBeCloseTo(67.5, 6); // 135 x 0,5
    expect(r.detalhamento.bandeirasNaoCompensadas).toBeCloseTo(25, 6);  // 50 x 0,5
    expect(r.detalhamento.cipNaoCompensado).toBeCloseTo(10, 6);         // 20 x 0,5
  });

  it('tributos são rateados pela proporção compensada e totais fecham', () => {
    const r = calcularEconomiaLei14300(params);
    // tributosBase = 100 x 0,5 = 50
    // proporcaoCompensada = (150 + 56,25 + 55,6875) / (300 + 450) = 261,9375 / 750 = 0,34925
    // tributosCompensados = 50 x 0,34925 = 17,4625
    const tributosCompensados = 50 * (261.9375 / 750);
    expect(r.detalhamento.tributosNaoCompensados).toBeCloseTo(50 - tributosCompensados, 6);
    // valorCompensado = 150 + 56,25 + 55,6875 + 17,4625 = 279,40
    expect(r.economiaCompensacao).toBeCloseTo(279.4, 4);
    // valorNaoCompensavel = 45,5625 + 67,5 + 25 + 10 + 32,5375 = 180,60
    expect(r.valorNaoCompensavel).toBeCloseTo(180.6, 4);
  });

  it('em 2029 e após, 100% do Fio B deixa de ser compensável', () => {
    const r = calcularEconomiaLei14300({ ...params, anoFatura: 2029 });
    expect(r.percentualFioBVigente).toBe(100);
    expect(r.detalhamento.tusdFioBCompensado).toBeCloseTo(0, 6);
    expect(r.detalhamento.tusdFioBNaoCompensado).toBeCloseTo(101.25, 6);
  });

  it('antes de 2023 GD2 compensa Fio B integralmente (0%)', () => {
    const r = calcularEconomiaLei14300({ ...params, anoFatura: 2022 });
    expect(r.percentualFioBVigente).toBe(0);
    expect(r.detalhamento.tusdFioBNaoCompensado).toBeCloseTo(0, 6);
  });

  it('GD2 com componentes zerados não produz NaN', () => {
    const zerados: ComponentesTarifarios = {
      te: 0, tusdTotal: 0, tusdFioA: 0, tusdFioB: 0,
      tusdEncargos: 0, bandeiras: 0, tributos: 0, cip: 0,
    };
    const r = calcularEconomiaLei14300({ ...params, componentesTarifarios: zerados });
    expect(r.economiaCompensacao).toBe(0);
    expect(r.valorNaoCompensavel).toBe(0);
    expect(Number.isNaN(r.economiaTotal)).toBe(false);
  });
});

describe('gerarProjecaoTransicao', () => {
  it('GD1: nenhuma perda, economia integral em todos os anos', () => {
    const p = gerarProjecaoTransicao('gd1', 100, 50, 2025);
    expect(p).toHaveLength(5); // 2025..2029
    for (const ano of p) {
      expect(ano.percentualFioB).toBe(0);
      expect(ano.valorNaoCompensavelEstimado).toBe(0);
      expect(ano.economiaEstimada).toBeCloseTo(1800, 6); // (100+50) x 12
    }
  });

  it('GD2: progressão anual correta do custo não compensável', () => {
    const p = gerarProjecaoTransicao('gd2', 100, 50, 2025);
    expect(p.map(x => x.ano)).toEqual([2025, 2026, 2027, 2028, 2029]);
    // 2025: fioB NC = 100 x 0,45 = 45 => (45 + 50) x 12 = 1140; economia = 55 x 12 = 660
    expect(p[0].valorNaoCompensavelEstimado).toBeCloseTo(1140, 6);
    expect(p[0].economiaEstimada).toBeCloseTo(660, 6);
    // 2029: (100 + 50) x 12 = 1800; economia 0
    expect(p[4].valorNaoCompensavelEstimado).toBeCloseTo(1800, 6);
    expect(p[4].economiaEstimada).toBeCloseTo(0, 6);
  });
});

describe('calcularImpactoComparativo', () => {
  it('compara GD1 vs GD2 para 2024 (30%)', () => {
    const r = calcularImpactoComparativo(2024, 100, 50, 30);
    expect(r.economiaGD1).toBeCloseTo(180, 6);      // 100 + 50 + 30
    expect(r.economiaGD2).toBeCloseTo(70, 6);       // 100 x (1 - 0,30)
    expect(r.perdaPorGD2).toBeCloseTo(110, 6);
    expect(r.percentualPerda).toBeCloseTo((110 / 180) * 100, 6);
  });

  it('sem valores, percentual de perda é 0 (sem divisão por zero)', () => {
    const r = calcularImpactoComparativo(2024, 0, 0, 0);
    expect(r.percentualPerda).toBe(0);
  });
});

describe('formatadores', () => {
  it('formatarClassificacaoGD', () => {
    expect(formatarClassificacaoGD('gd1')).toContain('Direito Adquirido');
    expect(formatarClassificacaoGD('gd2')).toContain('Nova Regra');
  });

  it('formatarPercentualFioB', () => {
    expect(formatarPercentualFioB(2022)).toBe('0% (regras anteriores)');
    expect(formatarPercentualFioB(2025)).toBe('45% (ano 2025 da transição)');
    expect(formatarPercentualFioB(2029)).toBe('100% (fim da transição)');
    expect(formatarPercentualFioB(2035)).toBe('100% (fim da transição)');
  });

  it('obterDescricaoAnoTransicao', () => {
    expect(obterDescricaoAnoTransicao(2022)).toBe('Anterior à Lei 14.300');
    expect(obterDescricaoAnoTransicao(2023)).toBe('1º ano da transição');
    expect(obterDescricaoAnoTransicao(2029)).toBe('7º ano da transição');
    expect(obterDescricaoAnoTransicao(2030)).toBe('Após período de transição');
  });
});
