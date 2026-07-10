import { describe, it, expect } from 'vitest';
import {
  calcularComponentesFatura,
  validarIntegridadeDados,
  validarCruzado,
} from '@/lib/billing/faturaCalculations';
import type { FaturaWizardData } from '@/components/wizard/WizardContext';

const fazerData = (overrides: Partial<FaturaWizardData> = {}): FaturaWizardData =>
  ({ ...overrides }) as FaturaWizardData;

describe('calcularComponentesFatura', () => {
  it('fatura Grupo B simples: soma TUSD + TE + tributos + CIP', () => {
    const data = fazerData({
      nao_compensado_tusd_fp_rs: 225,   // 500 kWh x 0,45
      nao_compensado_te_fp_rs: 150,     // 500 kWh x 0,30
      pis_rs: 4.5,
      cofins_rs: 20.5,
      icms_rs: 67.5,
      cip_rs: 15,
    });
    const c = calcularComponentesFatura(data);
    expect(c.tusd.total).toBeCloseTo(225, 6);
    expect(c.te.total).toBeCloseTo(150, 6);
    expect(c.tributos.total).toBeCloseTo(92.5, 6);
    expect(c.outros.total).toBeCloseTo(15, 6);
    expect(c.totalGeral).toBeCloseTo(482.5, 6);
  });

  it('fatura com GD: créditos de injeção SCEE (negativos) abatem o total', () => {
    const data = fazerData({
      nao_compensado_tusd_fp_rs: 100,
      nao_compensado_te_fp_rs: 80,
      scee_consumo_fp_tusd_rs: 40,   // cobrança
      scee_parcela_te_fp_rs: 30,     // cobrança
      scee_injecao_fp_te_rs: -90,    // crédito
      scee_injecao_fp_tusd_rs: -50,  // crédito
      cip_rs: 10,
    });
    const c = calcularComponentesFatura(data);
    expect(c.scee.total).toBeCloseTo(40 + 30 - 90 - 50, 6); // -70
    expect(c.totalGeral).toBeCloseTo(100 + 80 - 70 + 10, 6); // 120
  });

  it('agrega postos (ponta, fora ponta, reservado) e demanda', () => {
    const data = fazerData({
      bandeira_te_p_rs: 5,
      bandeira_te_fp_rs: 10,
      bandeira_te_hr_rs: 2,
      nao_compensado_tusd_p_rs: 50,
      nao_compensado_tusd_fp_rs: 200,
      nao_compensado_tusd_hr_rs: 25,
      valor_demanda_rs: 300,
      valor_demanda_ultrapassagem_rs: 100,
    });
    const c = calcularComponentesFatura(data);
    expect(c.bandeiras.total).toBeCloseTo(17, 6);
    expect(c.tusd.total).toBeCloseTo(275, 6);
    expect(c.demanda.total).toBeCloseTo(400, 6);
    expect(c.totalGeral).toBeCloseTo(17 + 275 + 400, 6);
  });

  it('valores ausentes (undefined/null) são tratados como zero', () => {
    const c = calcularComponentesFatura(fazerData({
      nao_compensado_tusd_fp_rs: null as unknown as number,
    }));
    expect(c.totalGeral).toBe(0);
    expect(c.bandeiras.total).toBe(0);
    expect(c.scee.total).toBe(0);
    expect(Number.isNaN(c.totalGeral)).toBe(false);
  });
});

describe('validarIntegridadeDados', () => {
  it('Grupo A: consumo total consistente com postos => ok', () => {
    const v = validarIntegridadeDados(fazerData({
      grupo_tarifario: 'A',
      consumo_ponta_kwh: 100,
      consumo_fora_ponta_kwh: 850,
      consumo_reservado_kwh: 50,
      consumo_total_kwh: 1000,
    }));
    const check = v.checks.find(c => c.nome === 'Consumo Total vs Postos');
    expect(check?.status).toBe('ok');
    expect(v.isValid).toBe(true);
  });

  it('Grupo A: divergência >= 10 kWh gera erro', () => {
    const v = validarIntegridadeDados(fazerData({
      grupo_tarifario: 'A',
      consumo_ponta_kwh: 100,
      consumo_fora_ponta_kwh: 800,
      consumo_total_kwh: 1000, // soma = 900, diff = 100
    }));
    const check = v.checks.find(c => c.nome === 'Consumo Total vs Postos');
    expect(check?.status).toBe('error');
    expect(v.isValid).toBe(false);
  });

  it('Geração = autoconsumo + injeção validada quando informada', () => {
    const v = validarIntegridadeDados(fazerData({
      grupo_tarifario: 'B',
      geracao_local_total_kwh: 800,
      autoconsumo_total_kwh: 300,
      injecao_total_kwh: 500,
    }));
    const check = v.checks.find(c => c.nome === 'Geração = Auto + Injeção');
    expect(check?.status).toBe('ok');
  });

  it('ultrapassagem de demanda inconsistente gera warning (não invalida)', () => {
    const v = validarIntegridadeDados(fazerData({
      grupo_tarifario: 'B',
      demanda_medida_kw: 120,
      demanda_contratada_kw: 100,
      demanda_ultrapassagem_kw: 5, // esperado 20
    }));
    const check = v.checks.find(c => c.nome === 'Ultrapassagem Demanda');
    expect(check?.status).toBe('warning');
    expect(v.isValid).toBe(true);
  });

  it('dados vazios: nenhum check, válido', () => {
    const v = validarIntegridadeDados(fazerData({}));
    expect(v.checks).toHaveLength(0);
    expect(v.isValid).toBe(true);
  });
});

describe('validarCruzado', () => {
  it('valida quando soma dos componentes bate com o total informado', () => {
    const data = fazerData({
      nao_compensado_tusd_fp_rs: 225,
      nao_compensado_te_fp_rs: 150,
      pis_rs: 10,
      valor_total_pagar: 385,
    });
    const componentes = calcularComponentesFatura(data);
    const v = validarCruzado(data, componentes);
    expect(v.percentualDiferenca).toBeCloseTo(0, 6);
    expect(v.componentesPreenchidos).toBe(3);
    expect(v.isValid).toBe(true);
  });

  it('diferença acima de 0,5% invalida com alerta de erro', () => {
    const data = fazerData({
      nao_compensado_tusd_fp_rs: 225,
      nao_compensado_te_fp_rs: 150,
      valor_total_pagar: 500, // soma = 375, diff 25%
    });
    const componentes = calcularComponentesFatura(data);
    const v = validarCruzado(data, componentes);
    expect(v.percentualDiferenca).toBeCloseTo(25, 6);
    expect(v.isValid).toBe(false);
    expect(v.alertasValidacao.some(a => a.severidade === 'error')).toBe(true);
  });

  it('wizard vazio (totalGeral = 0) é considerado válido', () => {
    const data = fazerData({});
    const v = validarCruzado(data, calcularComponentesFatura(data));
    expect(v.isValid).toBe(true);
  });

  it('menos de 2 componentes preenchidos invalida', () => {
    const data = fazerData({
      nao_compensado_tusd_fp_rs: 225,
      valor_total_pagar: 225,
    });
    const v = validarCruzado(data, calcularComponentesFatura(data));
    expect(v.isValid).toBe(false);
    expect(v.alertasValidacao.some(a => a.mensagem.includes('pelo menos 2'))).toBe(true);
  });

  it('bandeira não verde sem valor lançado gera warning', () => {
    const data = fazerData({
      bandeira: 'vermelha1',
      consumo_total_kwh: 500,
      nao_compensado_tusd_fp_rs: 100,
      nao_compensado_te_fp_rs: 80,
      valor_total_pagar: 180,
    });
    const v = validarCruzado(data, calcularComponentesFatura(data));
    expect(v.componentesVazios).toContain('Bandeiras');
    expect(v.alertasValidacao.some(a => a.campo === 'Bandeiras')).toBe(true);
  });
});
