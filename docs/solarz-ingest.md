# Ingestão de monitoramento SolarZ (JARVIS → super-app-evolight)

O pipeline externo (JARVIS/automação) deixa de escrever direto no banco e passa a
enviar lotes para a edge function **`solarz-ingest`**, autenticada por secret
dedicado. A automação **não** recebe service key do projeto.

## Endpoint

```
POST https://pvmdpbfutlililfbhkqn.supabase.co/functions/v1/solarz-ingest
Content-Type: application/json
X-Ingest-Secret: <SOLARZ_INGEST_SECRET>
```

O valor do secret está em `.solarz-ingest-secret.txt` na raiz do repo local
(fora do git) e configurado nos secrets das edge functions. Para rotacionar:
gerar valor novo e rodar `supabase secrets set SOLARZ_INGEST_SECRET=...`.

## Payload

```json
{
  "metrics": [
    {
      "plant_id": "<uuid de solar_plants — os mesmos ids do sunflow-dev>",
      "timestamp": "2026-10-01T12:00:00Z",
      "geracao_kwh": 1.23,
      "potencia_instantanea_kw": 4.56
    }
  ],
  "alerts": [
    {
      "plant_id": "<uuid>",
      "titulo": "ALERTA_SOLARZ - nome da planta",
      "tipo": "solarz",
      "severidade": "media",
      "descricao": "texto livre",
      "dados_contexto": { "qualquer": "json" }
    }
  ]
}
```

- Campos numéricos opcionais de métrica: `corrente_ac`, `corrente_dc`,
  `eficiencia_percent`, `fator_potencia`, `frequencia_hz`, `irradiacao_wm2`,
  `temperatura_inversor`, `tensao_ac`, `tensao_dc`.
- Máximo de 2000 itens por lote (de cada tipo). Lotes maiores: paginar.
- Métricas fazem **upsert por (plant_id, timestamp)** — reenviar é seguro.
- `plant_id` desconhecido não derruba o lote: o item é rejeitado e listado em
  `rejected` na resposta (HTTP 207 quando há rejeições).
- Alertas entram com `status='aberto'` em `solar_alerts`.
- Cada lote registra uma linha em `sync_logs` (provider `solarz`) e atualiza
  `solar_plants.ultima_sincronizacao` das usinas tocadas.

## Respostas

| HTTP | Significado |
|---|---|
| 200 | tudo inserido |
| 207 | parcial — ver `rejected` |
| 401 | secret ausente/errado |
| 413 | lote acima de 2000 itens |
| 500 | erro de banco — ver `errors` |

## Teste rápido

```bash
curl -s -X POST "https://pvmdpbfutlililfbhkqn.supabase.co/functions/v1/solarz-ingest" \
  -H "Content-Type: application/json" -H "X-Ingest-Secret: $SOLARZ_INGEST_SECRET" \
  -d '{"metrics":[{"plant_id":"<uuid>","timestamp":"2026-10-01T12:00:00Z","geracao_kwh":1}]}'
```

As 130 usinas importadas estão com `monitoring_provider='solarz'`; o
`monitoring-scheduler` (cron 30 min) ignora essas usinas — SolarZ é push,
não pull. SolarEdge/Sungrow seguem pelo caminho de conectores.
