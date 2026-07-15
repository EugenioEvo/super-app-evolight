export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aprovacoes: {
        Row: {
          aprovador_id: string
          created_at: string
          data_aprovacao: string
          id: string
          observacoes: string | null
          status: string
          ticket_id: string
        }
        Insert: {
          aprovador_id: string
          created_at?: string
          data_aprovacao?: string
          id?: string
          observacoes?: string | null
          status: string
          ticket_id: string
        }
        Update: {
          aprovador_id?: string
          created_at?: string
          data_aprovacao?: string
          id?: string
          observacoes?: string | null
          status?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aprovacoes_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprovacoes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas_mensais: {
        Row: {
          created_at: string
          economia_prometida_percent: number
          energia_alocada_kwh: number
          energia_contratada_kwh: number
          id: string
          mes_ref: string
          uc_id: string
          uc_remota: string
          ufv_id: string | null
          updated_at: string
          valor_assinatura: number
          vinculo_id: string | null
        }
        Insert: {
          created_at?: string
          economia_prometida_percent?: number
          energia_alocada_kwh?: number
          energia_contratada_kwh?: number
          id?: string
          mes_ref: string
          uc_id: string
          uc_remota: string
          ufv_id?: string | null
          updated_at?: string
          valor_assinatura?: number
          vinculo_id?: string | null
        }
        Update: {
          created_at?: string
          economia_prometida_percent?: number
          energia_alocada_kwh?: number
          energia_contratada_kwh?: number
          id?: string
          mes_ref?: string
          uc_id?: string
          uc_remota?: string
          ufv_id?: string | null
          updated_at?: string
          valor_assinatura?: number
          vinculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_mensais_uc_id_fkey"
            columns: ["uc_id"]
            isOneToOne: false
            referencedRelation: "unidades_consumidoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_mensais_ufv_id_fkey"
            columns: ["ufv_id"]
            isOneToOne: false
            referencedRelation: "cliente_ufvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_mensais_vinculo_id_fkey"
            columns: ["vinculo_id"]
            isOneToOne: false
            referencedRelation: "cliente_usina_vinculo"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          performed_at: string
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cliente_conta_azul_ids: {
        Row: {
          cliente_id: string
          cnpj_cpf: string | null
          conta_azul_customer_id: string
          created_at: string
          email: string | null
          id: string
          nome_fiscal: string | null
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          cnpj_cpf?: string | null
          conta_azul_customer_id: string
          created_at?: string
          email?: string | null
          id?: string
          nome_fiscal?: string | null
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          cnpj_cpf?: string | null
          conta_azul_customer_id?: string
          created_at?: string
          email?: string | null
          id?: string
          nome_fiscal?: string | null
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_conta_azul_ids_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_ufvs: {
        Row: {
          ativo: boolean
          cep: string | null
          cidade: string | null
          classificacao_gd: string | null
          cliente_id: string
          cnpj_titular: string | null
          created_at: string
          data_conexao: string | null
          data_protocolo_aneel: string | null
          distribuidora: string | null
          endereco: string | null
          estado: string | null
          fonte: Database["public"]["Enums"]["fonte_energia"]
          id: string
          latitude: number | null
          longitude: number | null
          modalidade_gd: Database["public"]["Enums"]["modalidade_gd"]
          nome: string | null
          numero_processo_aneel: string | null
          potencia_kwp: number | null
          solarz_ufv_id: string
          status: string | null
          uc_geradora: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          classificacao_gd?: string | null
          cliente_id: string
          cnpj_titular?: string | null
          created_at?: string
          data_conexao?: string | null
          data_protocolo_aneel?: string | null
          distribuidora?: string | null
          endereco?: string | null
          estado?: string | null
          fonte?: Database["public"]["Enums"]["fonte_energia"]
          id?: string
          latitude?: number | null
          longitude?: number | null
          modalidade_gd?: Database["public"]["Enums"]["modalidade_gd"]
          nome?: string | null
          numero_processo_aneel?: string | null
          potencia_kwp?: number | null
          solarz_ufv_id: string
          status?: string | null
          uc_geradora?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cep?: string | null
          cidade?: string | null
          classificacao_gd?: string | null
          cliente_id?: string
          cnpj_titular?: string | null
          created_at?: string
          data_conexao?: string | null
          data_protocolo_aneel?: string | null
          distribuidora?: string | null
          endereco?: string | null
          estado?: string | null
          fonte?: Database["public"]["Enums"]["fonte_energia"]
          id?: string
          latitude?: number | null
          longitude?: number | null
          modalidade_gd?: Database["public"]["Enums"]["modalidade_gd"]
          nome?: string | null
          numero_processo_aneel?: string | null
          potencia_kwp?: number | null
          solarz_ufv_id?: string
          status?: string | null
          uc_geradora?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_ufvs_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_usina_vinculo: {
        Row: {
          ativo: boolean
          cliente_id: string
          created_at: string
          data_fim_contrato: string | null
          data_inicio_contrato: string | null
          desconto_garantido_percent: number
          energia_contratada_kwh: number
          id: string
          modalidade_economia:
            | Database["public"]["Enums"]["modalidade_economia"]
            | null
          numero_contrato: string | null
          percentual_rateio: number
          referencia_desconto:
            | Database["public"]["Enums"]["referencia_desconto"]
            | null
          tarifa_ppa_rs_kwh: number | null
          uc_beneficiaria_id: string
          ufv_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cliente_id: string
          created_at?: string
          data_fim_contrato?: string | null
          data_inicio_contrato?: string | null
          desconto_garantido_percent?: number
          energia_contratada_kwh?: number
          id?: string
          modalidade_economia?:
            | Database["public"]["Enums"]["modalidade_economia"]
            | null
          numero_contrato?: string | null
          percentual_rateio?: number
          referencia_desconto?:
            | Database["public"]["Enums"]["referencia_desconto"]
            | null
          tarifa_ppa_rs_kwh?: number | null
          uc_beneficiaria_id: string
          ufv_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cliente_id?: string
          created_at?: string
          data_fim_contrato?: string | null
          data_inicio_contrato?: string | null
          desconto_garantido_percent?: number
          energia_contratada_kwh?: number
          id?: string
          modalidade_economia?:
            | Database["public"]["Enums"]["modalidade_economia"]
            | null
          numero_contrato?: string | null
          percentual_rateio?: number
          referencia_desconto?:
            | Database["public"]["Enums"]["referencia_desconto"]
            | null
          tarifa_ppa_rs_kwh?: number | null
          uc_beneficiaria_id?: string
          ufv_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_usina_vinculo_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_usina_vinculo_uc_beneficiaria_id_fkey"
            columns: ["uc_beneficiaria_id"]
            isOneToOne: false
            referencedRelation: "unidades_consumidoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_usina_vinculo_ufv_id_fkey"
            columns: ["ufv_id"]
            isOneToOne: false
            referencedRelation: "cliente_ufvs"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          ativo: boolean
          atrasos_recebimentos: number | null
          cep: string | null
          cidade: string | null
          cnpj_cpf: string | null
          created_at: string
          empresa: string | null
          endereco: string | null
          enderecos_unificados: string | null
          estado: string | null
          geocoded_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          observacoes: string | null
          origem: string | null
          prioridade: number | null
          profile_id: string | null
          sem_solarz: boolean | null
          solarz_customer_id: string | null
          status_financeiro_ca: string | null
          sync_source_updated_at: string | null
          telefones_unificados: string | null
          ufv_solarz: string | null
          ufv_status_resumo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atrasos_recebimentos?: number | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          empresa?: string | null
          endereco?: string | null
          enderecos_unificados?: string | null
          estado?: string | null
          geocoded_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: number | null
          profile_id?: string | null
          sem_solarz?: boolean | null
          solarz_customer_id?: string | null
          status_financeiro_ca?: string | null
          sync_source_updated_at?: string | null
          telefones_unificados?: string | null
          ufv_solarz?: string | null
          ufv_status_resumo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atrasos_recebimentos?: number | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf?: string | null
          created_at?: string
          empresa?: string | null
          endereco?: string | null
          enderecos_unificados?: string | null
          estado?: string | null
          geocoded_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: number | null
          profile_id?: string | null
          sem_solarz?: boolean | null
          solarz_customer_id?: string | null
          status_financeiro_ca?: string | null
          sync_source_updated_at?: string | null
          telefones_unificados?: string | null
          ufv_solarz?: string | null
          ufv_status_resumo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_retry_queue: {
        Row: {
          attempt_count: number
          created_at: string
          email_type: string
          id: string
          last_attempt_at: string | null
          last_error: string | null
          max_attempts: number
          next_retry_at: string
          payload: Json
          recipients: string[]
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          email_type: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number
          next_retry_at: string
          payload: Json
          recipients: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          email_type?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number
          next_retry_at?: string
          payload?: Json
          recipients?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          capacidade: string | null
          cliente_id: string | null
          corrente: string | null
          created_at: string
          data_instalacao: string | null
          fabricante: string | null
          garantia: string | null
          id: string
          localizacao: string | null
          modelo: string | null
          nome: string
          numero_serie: string | null
          observacoes: string | null
          qr_code_data: Json | null
          status: string
          tensao: string | null
          tipo: Database["public"]["Enums"]["equipamento_tipo"]
          updated_at: string
        }
        Insert: {
          capacidade?: string | null
          cliente_id?: string | null
          corrente?: string | null
          created_at?: string
          data_instalacao?: string | null
          fabricante?: string | null
          garantia?: string | null
          id?: string
          localizacao?: string | null
          modelo?: string | null
          nome: string
          numero_serie?: string | null
          observacoes?: string | null
          qr_code_data?: Json | null
          status?: string
          tensao?: string | null
          tipo: Database["public"]["Enums"]["equipamento_tipo"]
          updated_at?: string
        }
        Update: {
          capacidade?: string | null
          cliente_id?: string | null
          corrente?: string | null
          created_at?: string
          data_instalacao?: string | null
          fabricante?: string | null
          garantia?: string | null
          id?: string
          localizacao?: string | null
          modelo?: string | null
          nome?: string
          numero_serie?: string | null
          observacoes?: string | null
          qr_code_data?: Json | null
          status?: string
          tensao?: string | null
          tipo?: Database["public"]["Enums"]["equipamento_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas_mensais: {
        Row: {
          alertas: Json | null
          autoconsumo_fp_kwh: number | null
          autoconsumo_fp_rs: number | null
          autoconsumo_hr_kwh: number | null
          autoconsumo_hr_rs: number | null
          autoconsumo_ponta_kwh: number | null
          autoconsumo_ponta_rs: number | null
          autoconsumo_rs: number | null
          autoconsumo_total_kwh: number | null
          bandeira_te_fp_rs: number | null
          bandeira_te_hr_rs: number | null
          bandeira_te_p_rs: number | null
          bandeiras: string
          base_icms_rs: number | null
          base_pis_cofins_rs: number | null
          cip_rs: number | null
          classificacao_gd_aplicada: string | null
          cofins_aliquota_percent: number | null
          cofins_rs: number | null
          consumo_final_kwh: number | null
          consumo_reservado_kwh: number | null
          consumo_residual_kwh: number | null
          consumo_total_kwh: number
          created_at: string
          credito_assinatura_kwh: number | null
          credito_assinatura_rs: number | null
          credito_remoto_compensado_rs: number | null
          credito_remoto_fp_kwh: number | null
          credito_remoto_fp_rs: number | null
          credito_remoto_hr_kwh: number | null
          credito_remoto_hr_rs: number | null
          credito_remoto_kwh: number | null
          credito_remoto_ponta_kwh: number | null
          credito_remoto_ponta_rs: number | null
          custo_assinatura_rs: number | null
          data_apresentacao: string | null
          data_emissao: string | null
          demanda_contratada_kw: number
          demanda_contratada_rs: number
          demanda_geracao_kw: number
          demanda_geracao_rs: number
          demanda_medida_kw: number
          demanda_ultrapassagem_kw: number | null
          desconto_assinatura_percent: number | null
          dias_faturados: number | null
          economia_compensacao_rs: number | null
          economia_liquida_rs: number | null
          economia_simultaneidade_rs: number | null
          energia_fora_ponta_rs: number
          energia_ponta_rs: number
          energia_simultanea_kwh: number | null
          energia_simultanea_rs: number | null
          fora_ponta_kwh: number
          geracao_local_total_kwh: number | null
          grupo_tarifario: string | null
          icms_aliquota_percent: number | null
          icms_rs: number | null
          id: string
          iluminacao_publica: number
          injecao_fp_kwh: number | null
          injecao_hr_kwh: number | null
          injecao_ponta_kwh: number | null
          injecao_total_kwh: number | null
          leitura_anterior: string | null
          leitura_atual: string | null
          mes_ref: string
          multa_demanda: number
          multa_demanda_ultrapassagem: number
          multa_reativo: number
          multa_ufer_fora_ponta: number
          multa_ufer_ponta: number
          nao_compensado_te_fp_rs: number | null
          nao_compensado_te_hr_rs: number | null
          nao_compensado_te_p_rs: number | null
          nao_compensado_tusd_fp_rs: number | null
          nao_compensado_tusd_hr_rs: number | null
          nao_compensado_tusd_p_rs: number | null
          outros_encargos: number
          percentual_fio_b_aplicado: number | null
          pis_aliquota_percent: number | null
          pis_rs: number | null
          ponta_kwh: number
          proxima_leitura: string | null
          recomendacoes: Json | null
          scee_consumo_fp_tusd_rs: number | null
          scee_credito_recebido_kwh: number | null
          scee_excedente_recebido_kwh: number | null
          scee_geracao_ciclo_fp_kwh: number | null
          scee_geracao_ciclo_hr_kwh: number | null
          scee_geracao_ciclo_ponta_kwh: number | null
          scee_injecao_fp_te_rs: number | null
          scee_injecao_fp_tusd_rs: number | null
          scee_parcela_te_fp_rs: number | null
          scee_rateio_percent: number | null
          scee_saldo_expirar_30d_kwh: number | null
          scee_saldo_expirar_60d_kwh: number | null
          scee_saldo_kwh_fp: number | null
          scee_saldo_kwh_hr: number | null
          scee_saldo_kwh_p: number | null
          status: string
          tusd_encargos_rs: number | null
          tusd_fio_a_rs: number | null
          tusd_fio_b_rs: number | null
          uc_id: string
          ufer_fp_kvarh: number | null
          ufer_fp_rs: number | null
          updated_at: string
          valor_demanda_rs: number | null
          valor_demanda_ultrapassagem_rs: number | null
          valor_nao_compensavel_rs: number | null
          valor_te: number
          valor_total: number
          valor_tusd: number
          vencimento: string | null
        }
        Insert: {
          alertas?: Json | null
          autoconsumo_fp_kwh?: number | null
          autoconsumo_fp_rs?: number | null
          autoconsumo_hr_kwh?: number | null
          autoconsumo_hr_rs?: number | null
          autoconsumo_ponta_kwh?: number | null
          autoconsumo_ponta_rs?: number | null
          autoconsumo_rs?: number | null
          autoconsumo_total_kwh?: number | null
          bandeira_te_fp_rs?: number | null
          bandeira_te_hr_rs?: number | null
          bandeira_te_p_rs?: number | null
          bandeiras: string
          base_icms_rs?: number | null
          base_pis_cofins_rs?: number | null
          cip_rs?: number | null
          classificacao_gd_aplicada?: string | null
          cofins_aliquota_percent?: number | null
          cofins_rs?: number | null
          consumo_final_kwh?: number | null
          consumo_reservado_kwh?: number | null
          consumo_residual_kwh?: number | null
          consumo_total_kwh?: number
          created_at?: string
          credito_assinatura_kwh?: number | null
          credito_assinatura_rs?: number | null
          credito_remoto_compensado_rs?: number | null
          credito_remoto_fp_kwh?: number | null
          credito_remoto_fp_rs?: number | null
          credito_remoto_hr_kwh?: number | null
          credito_remoto_hr_rs?: number | null
          credito_remoto_kwh?: number | null
          credito_remoto_ponta_kwh?: number | null
          credito_remoto_ponta_rs?: number | null
          custo_assinatura_rs?: number | null
          data_apresentacao?: string | null
          data_emissao?: string | null
          demanda_contratada_kw?: number
          demanda_contratada_rs?: number
          demanda_geracao_kw?: number
          demanda_geracao_rs?: number
          demanda_medida_kw?: number
          demanda_ultrapassagem_kw?: number | null
          desconto_assinatura_percent?: number | null
          dias_faturados?: number | null
          economia_compensacao_rs?: number | null
          economia_liquida_rs?: number | null
          economia_simultaneidade_rs?: number | null
          energia_fora_ponta_rs?: number
          energia_ponta_rs?: number
          energia_simultanea_kwh?: number | null
          energia_simultanea_rs?: number | null
          fora_ponta_kwh?: number
          geracao_local_total_kwh?: number | null
          grupo_tarifario?: string | null
          icms_aliquota_percent?: number | null
          icms_rs?: number | null
          id?: string
          iluminacao_publica?: number
          injecao_fp_kwh?: number | null
          injecao_hr_kwh?: number | null
          injecao_ponta_kwh?: number | null
          injecao_total_kwh?: number | null
          leitura_anterior?: string | null
          leitura_atual?: string | null
          mes_ref: string
          multa_demanda?: number
          multa_demanda_ultrapassagem?: number
          multa_reativo?: number
          multa_ufer_fora_ponta?: number
          multa_ufer_ponta?: number
          nao_compensado_te_fp_rs?: number | null
          nao_compensado_te_hr_rs?: number | null
          nao_compensado_te_p_rs?: number | null
          nao_compensado_tusd_fp_rs?: number | null
          nao_compensado_tusd_hr_rs?: number | null
          nao_compensado_tusd_p_rs?: number | null
          outros_encargos?: number
          percentual_fio_b_aplicado?: number | null
          pis_aliquota_percent?: number | null
          pis_rs?: number | null
          ponta_kwh?: number
          proxima_leitura?: string | null
          recomendacoes?: Json | null
          scee_consumo_fp_tusd_rs?: number | null
          scee_credito_recebido_kwh?: number | null
          scee_excedente_recebido_kwh?: number | null
          scee_geracao_ciclo_fp_kwh?: number | null
          scee_geracao_ciclo_hr_kwh?: number | null
          scee_geracao_ciclo_ponta_kwh?: number | null
          scee_injecao_fp_te_rs?: number | null
          scee_injecao_fp_tusd_rs?: number | null
          scee_parcela_te_fp_rs?: number | null
          scee_rateio_percent?: number | null
          scee_saldo_expirar_30d_kwh?: number | null
          scee_saldo_expirar_60d_kwh?: number | null
          scee_saldo_kwh_fp?: number | null
          scee_saldo_kwh_hr?: number | null
          scee_saldo_kwh_p?: number | null
          status?: string
          tusd_encargos_rs?: number | null
          tusd_fio_a_rs?: number | null
          tusd_fio_b_rs?: number | null
          uc_id: string
          ufer_fp_kvarh?: number | null
          ufer_fp_rs?: number | null
          updated_at?: string
          valor_demanda_rs?: number | null
          valor_demanda_ultrapassagem_rs?: number | null
          valor_nao_compensavel_rs?: number | null
          valor_te?: number
          valor_total?: number
          valor_tusd?: number
          vencimento?: string | null
        }
        Update: {
          alertas?: Json | null
          autoconsumo_fp_kwh?: number | null
          autoconsumo_fp_rs?: number | null
          autoconsumo_hr_kwh?: number | null
          autoconsumo_hr_rs?: number | null
          autoconsumo_ponta_kwh?: number | null
          autoconsumo_ponta_rs?: number | null
          autoconsumo_rs?: number | null
          autoconsumo_total_kwh?: number | null
          bandeira_te_fp_rs?: number | null
          bandeira_te_hr_rs?: number | null
          bandeira_te_p_rs?: number | null
          bandeiras?: string
          base_icms_rs?: number | null
          base_pis_cofins_rs?: number | null
          cip_rs?: number | null
          classificacao_gd_aplicada?: string | null
          cofins_aliquota_percent?: number | null
          cofins_rs?: number | null
          consumo_final_kwh?: number | null
          consumo_reservado_kwh?: number | null
          consumo_residual_kwh?: number | null
          consumo_total_kwh?: number
          created_at?: string
          credito_assinatura_kwh?: number | null
          credito_assinatura_rs?: number | null
          credito_remoto_compensado_rs?: number | null
          credito_remoto_fp_kwh?: number | null
          credito_remoto_fp_rs?: number | null
          credito_remoto_hr_kwh?: number | null
          credito_remoto_hr_rs?: number | null
          credito_remoto_kwh?: number | null
          credito_remoto_ponta_kwh?: number | null
          credito_remoto_ponta_rs?: number | null
          custo_assinatura_rs?: number | null
          data_apresentacao?: string | null
          data_emissao?: string | null
          demanda_contratada_kw?: number
          demanda_contratada_rs?: number
          demanda_geracao_kw?: number
          demanda_geracao_rs?: number
          demanda_medida_kw?: number
          demanda_ultrapassagem_kw?: number | null
          desconto_assinatura_percent?: number | null
          dias_faturados?: number | null
          economia_compensacao_rs?: number | null
          economia_liquida_rs?: number | null
          economia_simultaneidade_rs?: number | null
          energia_fora_ponta_rs?: number
          energia_ponta_rs?: number
          energia_simultanea_kwh?: number | null
          energia_simultanea_rs?: number | null
          fora_ponta_kwh?: number
          geracao_local_total_kwh?: number | null
          grupo_tarifario?: string | null
          icms_aliquota_percent?: number | null
          icms_rs?: number | null
          id?: string
          iluminacao_publica?: number
          injecao_fp_kwh?: number | null
          injecao_hr_kwh?: number | null
          injecao_ponta_kwh?: number | null
          injecao_total_kwh?: number | null
          leitura_anterior?: string | null
          leitura_atual?: string | null
          mes_ref?: string
          multa_demanda?: number
          multa_demanda_ultrapassagem?: number
          multa_reativo?: number
          multa_ufer_fora_ponta?: number
          multa_ufer_ponta?: number
          nao_compensado_te_fp_rs?: number | null
          nao_compensado_te_hr_rs?: number | null
          nao_compensado_te_p_rs?: number | null
          nao_compensado_tusd_fp_rs?: number | null
          nao_compensado_tusd_hr_rs?: number | null
          nao_compensado_tusd_p_rs?: number | null
          outros_encargos?: number
          percentual_fio_b_aplicado?: number | null
          pis_aliquota_percent?: number | null
          pis_rs?: number | null
          ponta_kwh?: number
          proxima_leitura?: string | null
          recomendacoes?: Json | null
          scee_consumo_fp_tusd_rs?: number | null
          scee_credito_recebido_kwh?: number | null
          scee_excedente_recebido_kwh?: number | null
          scee_geracao_ciclo_fp_kwh?: number | null
          scee_geracao_ciclo_hr_kwh?: number | null
          scee_geracao_ciclo_ponta_kwh?: number | null
          scee_injecao_fp_te_rs?: number | null
          scee_injecao_fp_tusd_rs?: number | null
          scee_parcela_te_fp_rs?: number | null
          scee_rateio_percent?: number | null
          scee_saldo_expirar_30d_kwh?: number | null
          scee_saldo_expirar_60d_kwh?: number | null
          scee_saldo_kwh_fp?: number | null
          scee_saldo_kwh_hr?: number | null
          scee_saldo_kwh_p?: number | null
          status?: string
          tusd_encargos_rs?: number | null
          tusd_fio_a_rs?: number | null
          tusd_fio_b_rs?: number | null
          uc_id?: string
          ufer_fp_kvarh?: number | null
          ufer_fp_rs?: number | null
          updated_at?: string
          valor_demanda_rs?: number | null
          valor_demanda_ultrapassagem_rs?: number | null
          valor_nao_compensavel_rs?: number | null
          valor_te?: number
          valor_total?: number
          valor_tusd?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faturas_mensais_uc_id_fkey"
            columns: ["uc_id"]
            isOneToOne: false
            referencedRelation: "unidades_consumidoras"
            referencedColumns: ["id"]
          },
        ]
      }
      geocoding_cache: {
        Row: {
          address_normalized: string
          cached_at: string
          created_at: string
          formatted_address: string | null
          hit_count: number | null
          id: string
          latitude: number
          longitude: number
          original_address: string
          updated_at: string
        }
        Insert: {
          address_normalized: string
          cached_at?: string
          created_at?: string
          formatted_address?: string | null
          hit_count?: number | null
          id?: string
          latitude: number
          longitude: number
          original_address: string
          updated_at?: string
        }
        Update: {
          address_normalized?: string
          cached_at?: string
          created_at?: string
          formatted_address?: string | null
          hit_count?: number | null
          id?: string
          latitude?: number
          longitude?: number
          original_address?: string
          updated_at?: string
        }
        Relationships: []
      }
      geocoding_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      geracoes_mensais: {
        Row: {
          autoconsumo_kwh: number
          compensacao_kwh: number
          created_at: string
          disponibilidade_percent: number
          geracao_total_kwh: number
          id: string
          injecao_kwh: number
          mes_ref: string
          perdas_estimadas_kwh: number
          uc_id: string
          updated_at: string
        }
        Insert: {
          autoconsumo_kwh?: number
          compensacao_kwh?: number
          created_at?: string
          disponibilidade_percent?: number
          geracao_total_kwh?: number
          id?: string
          injecao_kwh?: number
          mes_ref: string
          perdas_estimadas_kwh?: number
          uc_id: string
          updated_at?: string
        }
        Update: {
          autoconsumo_kwh?: number
          compensacao_kwh?: number
          created_at?: string
          disponibilidade_percent?: number
          geracao_total_kwh?: number
          id?: string
          injecao_kwh?: number
          mes_ref?: string
          perdas_estimadas_kwh?: number
          uc_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geracoes_mensais_uc_id_fkey"
            columns: ["uc_id"]
            isOneToOne: false
            referencedRelation: "unidades_consumidoras"
            referencedColumns: ["id"]
          },
        ]
      }
      horas_previstas_os: {
        Row: {
          created_at: string
          id: string
          minutos_previstos: number
          ordem_servico_id: string
          tecnico_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutos_previstos?: number
          ordem_servico_id: string
          tecnico_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          minutos_previstos?: number
          ordem_servico_id?: string
          tecnico_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horas_previstas_os_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horas_previstas_os_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      insumo_compras: {
        Row: {
          created_at: string
          fornecedor: string | null
          id: string
          insumo_id: string
          observacoes: string | null
          preco_anterior: number | null
          preco_novo: number | null
          qtd_anterior: number | null
          qtd_nova: number | null
          quantidade: number
          registrado_por: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          fornecedor?: string | null
          id?: string
          insumo_id: string
          observacoes?: string | null
          preco_anterior?: number | null
          preco_novo?: number | null
          qtd_anterior?: number | null
          qtd_nova?: number | null
          quantidade: number
          registrado_por: string
          valor_unitario: number
        }
        Update: {
          created_at?: string
          fornecedor?: string | null
          id?: string
          insumo_id?: string
          observacoes?: string | null
          preco_anterior?: number | null
          preco_novo?: number | null
          qtd_anterior?: number | null
          qtd_nova?: number | null
          quantidade?: number
          registrado_por?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "insumo_compras_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
        ]
      }
      insumo_devolucoes: {
        Row: {
          aprovado_at: string | null
          aprovado_por: string | null
          created_at: string
          evidencias: Json
          id: string
          observacoes: string | null
          quantidade: number
          registrada_por: string
          rejeitado_motivo: string | null
          saida_id: string
          status: string
          updated_at: string
        }
        Insert: {
          aprovado_at?: string | null
          aprovado_por?: string | null
          created_at?: string
          evidencias?: Json
          id?: string
          observacoes?: string | null
          quantidade: number
          registrada_por: string
          rejeitado_motivo?: string | null
          saida_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          aprovado_at?: string | null
          aprovado_por?: string | null
          created_at?: string
          evidencias?: Json
          id?: string
          observacoes?: string | null
          quantidade?: number
          registrada_por?: string
          rejeitado_motivo?: string | null
          saida_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insumo_devolucoes_saida_id_fkey"
            columns: ["saida_id"]
            isOneToOne: false
            referencedRelation: "insumo_saidas"
            referencedColumns: ["id"]
          },
        ]
      }
      insumo_entradas_pendentes: {
        Row: {
          aprovado_at: string | null
          aprovado_por: string | null
          created_at: string
          evidencias: Json
          id: string
          observacoes: string | null
          quantidade: number
          registrada_por: string
          rejeitado_motivo: string | null
          saida_id: string
          status: string
          updated_at: string
        }
        Insert: {
          aprovado_at?: string | null
          aprovado_por?: string | null
          created_at?: string
          evidencias?: Json
          id?: string
          observacoes?: string | null
          quantidade: number
          registrada_por: string
          rejeitado_motivo?: string | null
          saida_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          aprovado_at?: string | null
          aprovado_por?: string | null
          created_at?: string
          evidencias?: Json
          id?: string
          observacoes?: string | null
          quantidade?: number
          registrada_por?: string
          rejeitado_motivo?: string | null
          saida_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      insumo_saidas: {
        Row: {
          aprovado_at: string | null
          aprovado_por: string | null
          created_at: string
          evidencias: Json
          id: string
          insumo_id: string | null
          kit_id: string | null
          lote_id: string
          obra_id: string | null
          observacoes: string | null
          ordem_servico_id: string | null
          quantidade: number
          quantidade_devolvida: number
          registrado_por: string
          rejeitado_motivo: string | null
          retornavel: boolean
          status: string
          tecnico_id: string
          updated_at: string
          uso_interno: boolean
        }
        Insert: {
          aprovado_at?: string | null
          aprovado_por?: string | null
          created_at?: string
          evidencias?: Json
          id?: string
          insumo_id?: string | null
          kit_id?: string | null
          lote_id?: string
          obra_id?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          quantidade: number
          quantidade_devolvida?: number
          registrado_por: string
          rejeitado_motivo?: string | null
          retornavel?: boolean
          status?: string
          tecnico_id: string
          updated_at?: string
          uso_interno?: boolean
        }
        Update: {
          aprovado_at?: string | null
          aprovado_por?: string | null
          created_at?: string
          evidencias?: Json
          id?: string
          insumo_id?: string | null
          kit_id?: string | null
          lote_id?: string
          obra_id?: string | null
          observacoes?: string | null
          ordem_servico_id?: string | null
          quantidade?: number
          quantidade_devolvida?: number
          registrado_por?: string
          rejeitado_motivo?: string | null
          retornavel?: boolean
          status?: string
          tecnico_id?: string
          updated_at?: string
          uso_interno?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "insumo_saidas_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insumo_saidas_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insumo_saidas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insumo_saidas_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insumo_saidas_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      insumos: {
        Row: {
          categoria: string
          created_at: string | null
          estoque_critico: number | null
          estoque_minimo: number | null
          fornecedor: string | null
          id: string
          localizacao: string | null
          midias: Json
          nome: string
          observacoes: string | null
          preco: number | null
          quantidade: number
          retornavel: boolean
          unidade: string
          updated_at: string | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          estoque_critico?: number | null
          estoque_minimo?: number | null
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          midias?: Json
          nome: string
          observacoes?: string | null
          preco?: number | null
          quantidade?: number
          retornavel?: boolean
          unidade?: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          estoque_critico?: number | null
          estoque_minimo?: number | null
          fornecedor?: string | null
          id?: string
          localizacao?: string | null
          midias?: Json
          nome?: string
          observacoes?: string | null
          preco?: number | null
          quantidade?: number
          retornavel?: boolean
          unidade?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kit_itens: {
        Row: {
          created_at: string
          id: string
          insumo_id: string
          kit_id: string
          quantidade: number
        }
        Insert: {
          created_at?: string
          id?: string
          insumo_id: string
          kit_id: string
          quantidade: number
        }
        Update: {
          created_at?: string
          id?: string
          insumo_id?: string
          kit_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "kit_itens_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_itens_kit_id_fkey"
            columns: ["kit_id"]
            isOneToOne: false
            referencedRelation: "kits"
            referencedColumns: ["id"]
          },
        ]
      }
      kits: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      lei_14300_transicao: {
        Row: {
          ano: number
          created_at: string | null
          descricao: string | null
          id: string
          percentual_encargos: number | null
          percentual_fio_b: number
          updated_at: string | null
          vigente: boolean | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          descricao?: string | null
          id?: string
          percentual_encargos?: number | null
          percentual_fio_b: number
          updated_at?: string | null
          vigente?: boolean | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          descricao?: string | null
          id?: string
          percentual_encargos?: number | null
          percentual_fio_b?: number
          updated_at?: string | null
          vigente?: boolean | null
        }
        Relationships: []
      }
      movimentacoes: {
        Row: {
          created_at: string | null
          data_movimentacao: string | null
          id: string
          insumo_id: string
          motivo: string | null
          observacoes: string | null
          quantidade: number
          responsavel_id: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          data_movimentacao?: string | null
          id?: string
          insumo_id: string
          motivo?: string | null
          observacoes?: string | null
          quantidade: number
          responsavel_id: string
          tipo: string
        }
        Update: {
          created_at?: string | null
          data_movimentacao?: string | null
          id?: string
          insumo_id?: string
          motivo?: string | null
          observacoes?: string | null
          quantidade?: number
          responsavel_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_insumo_id_fkey"
            columns: ["insumo_id"]
            isOneToOne: false
            referencedRelation: "insumos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          id: string
          lida: boolean | null
          link: string | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lida?: boolean | null
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      obra_metas_catalogo: {
        Row: {
          catalogo_id: string
          created_at: string
          id: string
          obra_id: string
          observacoes: string | null
          quantidade_meta: number
          unidade: string | null
          updated_at: string
        }
        Insert: {
          catalogo_id: string
          created_at?: string
          id?: string
          obra_id: string
          observacoes?: string | null
          quantidade_meta?: number
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          catalogo_id?: string
          created_at?: string
          id?: string
          obra_id?: string
          observacoes?: string | null
          quantidade_meta?: number
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      obra_share_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          obra_id: string
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          obra_id: string
          revoked_at?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          obra_id?: string
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "obra_share_tokens_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          cep: string | null
          cidade: string | null
          cliente_id: string | null
          created_at: string
          created_by: string | null
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          endereco: string | null
          estado: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          observacoes: string | null
          potencia_kwp: number | null
          responsavel_obra_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          observacoes?: string | null
          potencia_kwp?: number | null
          responsavel_obra_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          observacoes?: string | null
          potencia_kwp?: number | null
          responsavel_obra_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_responsavel_obra_id_fkey"
            columns: ["responsavel_obra_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          aceite_at: string | null
          aceite_tecnico: string
          assinatura_cliente: string | null
          assinatura_tecnico: string | null
          calendar_invite_recipients: string[] | null
          calendar_invite_sent_at: string | null
          created_at: string
          data_assinatura_cliente: string | null
          data_assinatura_tecnico: string | null
          data_emissao: string
          data_programada: string | null
          duracao_estimada_min: number | null
          email_error_log: Json | null
          equipe: string[] | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          inspetor_responsavel: string | null
          motivo_recusa: string | null
          nome_cliente_assinatura: string | null
          notes: string | null
          numero_os: string
          pdf_url: string | null
          presence_confirmed_at: string | null
          presence_confirmed_by: string | null
          qr_code: string | null
          reminder_sent_at: string | null
          servico_solicitado: string | null
          site_name: string | null
          tecnico_id: string | null
          tecnico_responsavel_id: string | null
          ticket_id: string
          tipo_trabalho: string[] | null
          updated_at: string
          work_type: Json | null
        }
        Insert: {
          aceite_at?: string | null
          aceite_tecnico?: string
          assinatura_cliente?: string | null
          assinatura_tecnico?: string | null
          calendar_invite_recipients?: string[] | null
          calendar_invite_sent_at?: string | null
          created_at?: string
          data_assinatura_cliente?: string | null
          data_assinatura_tecnico?: string | null
          data_emissao?: string
          data_programada?: string | null
          duracao_estimada_min?: number | null
          email_error_log?: Json | null
          equipe?: string[] | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          inspetor_responsavel?: string | null
          motivo_recusa?: string | null
          nome_cliente_assinatura?: string | null
          notes?: string | null
          numero_os: string
          pdf_url?: string | null
          presence_confirmed_at?: string | null
          presence_confirmed_by?: string | null
          qr_code?: string | null
          reminder_sent_at?: string | null
          servico_solicitado?: string | null
          site_name?: string | null
          tecnico_id?: string | null
          tecnico_responsavel_id?: string | null
          ticket_id: string
          tipo_trabalho?: string[] | null
          updated_at?: string
          work_type?: Json | null
        }
        Update: {
          aceite_at?: string | null
          aceite_tecnico?: string
          assinatura_cliente?: string | null
          assinatura_tecnico?: string | null
          calendar_invite_recipients?: string[] | null
          calendar_invite_sent_at?: string | null
          created_at?: string
          data_assinatura_cliente?: string | null
          data_assinatura_tecnico?: string | null
          data_emissao?: string
          data_programada?: string | null
          duracao_estimada_min?: number | null
          email_error_log?: Json | null
          equipe?: string[] | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          inspetor_responsavel?: string | null
          motivo_recusa?: string | null
          nome_cliente_assinatura?: string | null
          notes?: string | null
          numero_os?: string
          pdf_url?: string | null
          presence_confirmed_at?: string | null
          presence_confirmed_by?: string | null
          qr_code?: string | null
          reminder_sent_at?: string | null
          servico_solicitado?: string | null
          site_name?: string | null
          tecnico_id?: string | null
          tecnico_responsavel_id?: string | null
          ticket_id?: string
          tipo_trabalho?: string[] | null
          updated_at?: string
          work_type?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      presence_confirmation_attempts: {
        Row: {
          attempted_at: string
          id: string
          ip_address: string
          ordem_servico_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          ip_address: string
          ordem_servico_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          ip_address?: string
          ordem_servico_id?: string
        }
        Relationships: []
      }
      presence_confirmation_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ordem_servico_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ordem_servico_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ordem_servico_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presence_confirmation_tokens_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      prestadores: {
        Row: {
          ativo: boolean
          avaliado_por: string | null
          categoria: string
          cep: string | null
          certificacoes: string[] | null
          cidade: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_avaliacao: string | null
          email: string
          endereco: string | null
          especialidades: string[] | null
          estado: string | null
          experiencia: string | null
          id: string
          motivo_rejeicao: string | null
          nome: string
          observacoes_candidato: string | null
          status_candidatura: string
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          avaliado_por?: string | null
          categoria: string
          cep?: string | null
          certificacoes?: string[] | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_avaliacao?: string | null
          email: string
          endereco?: string | null
          especialidades?: string[] | null
          estado?: string | null
          experiencia?: string | null
          id?: string
          motivo_rejeicao?: string | null
          nome: string
          observacoes_candidato?: string | null
          status_candidatura?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          avaliado_por?: string | null
          categoria?: string
          cep?: string | null
          certificacoes?: string[] | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_avaliacao?: string | null
          email?: string
          endereco?: string | null
          especialidades?: string[] | null
          estado?: string | null
          experiencia?: string | null
          id?: string
          motivo_rejeicao?: string | null
          nome?: string
          observacoes_candidato?: string | null
          status_candidatura?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rdo_atividades: {
        Row: {
          catalogo_id: string | null
          created_at: string
          descricao_livre: string | null
          id: string
          observacoes: string | null
          percentual_avanco: number | null
          quantidade: number
          rdo_id: string
          unidade: string | null
        }
        Insert: {
          catalogo_id?: string | null
          created_at?: string
          descricao_livre?: string | null
          id?: string
          observacoes?: string | null
          percentual_avanco?: number | null
          quantidade?: number
          rdo_id: string
          unidade?: string | null
        }
        Update: {
          catalogo_id?: string | null
          created_at?: string
          descricao_livre?: string | null
          id?: string
          observacoes?: string | null
          percentual_avanco?: number | null
          quantidade?: number
          rdo_id?: string
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rdo_atividades_catalogo_id_fkey"
            columns: ["catalogo_id"]
            isOneToOne: false
            referencedRelation: "rdo_atividades_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_atividades_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdo_relatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_atividades_catalogo: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          id: string
          item_key: string
          label: string
          sort_order: number | null
          tipo: string | null
          unidade: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string
          id?: string
          item_key: string
          label: string
          sort_order?: number | null
          tipo?: string | null
          unidade: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          id?: string
          item_key?: string
          label?: string
          sort_order?: number | null
          tipo?: string | null
          unidade?: string
        }
        Relationships: []
      }
      rdo_equipamentos: {
        Row: {
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          quantidade: number
          rdo_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          quantidade?: number
          rdo_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          quantidade?: number
          rdo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_equipamentos_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdo_relatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_equipe: {
        Row: {
          created_at: string
          funcao: string | null
          horas_extras: number | null
          horas_trabalhadas: number | null
          id: string
          observacoes: string | null
          prestador_id: string
          rdo_id: string
        }
        Insert: {
          created_at?: string
          funcao?: string | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          observacoes?: string | null
          prestador_id: string
          rdo_id: string
        }
        Update: {
          created_at?: string
          funcao?: string | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          observacoes?: string | null
          prestador_id?: string
          rdo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_equipe_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_equipe_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdo_relatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_evidencias: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          rdo_id: string
          storage_path: string
          tipo: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          rdo_id: string
          storage_path: string
          tipo: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          rdo_id?: string
          storage_path?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_evidencias_rdo_id_fkey"
            columns: ["rdo_id"]
            isOneToOne: false
            referencedRelation: "rdo_relatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      rdo_relatorios: {
        Row: {
          aprovado_por: string | null
          assinatura_aprovador: string | null
          assinatura_responsavel: string | null
          atrasos: string | null
          clima: string | null
          condicoes_canteiro: string | null
          created_at: string
          created_by: string | null
          data_aprovacao: string | null
          data_rdo: string
          fotos_geral: string[] | null
          horario_fim: string | null
          horario_inicio: string | null
          horas_paradas_nao_programadas: number | null
          horas_paradas_programadas: number | null
          id: string
          numero_rdo: string
          obra_id: string
          observacoes_aprovacao: string | null
          observacoes_gerais: string | null
          ocorrencias: string | null
          pdf_url: string | null
          responsavel_id: string
          restricoes: string | null
          status: string
          temperatura_c: number | null
          turno: string | null
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          assinatura_aprovador?: string | null
          assinatura_responsavel?: string | null
          atrasos?: string | null
          clima?: string | null
          condicoes_canteiro?: string | null
          created_at?: string
          created_by?: string | null
          data_aprovacao?: string | null
          data_rdo: string
          fotos_geral?: string[] | null
          horario_fim?: string | null
          horario_inicio?: string | null
          horas_paradas_nao_programadas?: number | null
          horas_paradas_programadas?: number | null
          id?: string
          numero_rdo: string
          obra_id: string
          observacoes_aprovacao?: string | null
          observacoes_gerais?: string | null
          ocorrencias?: string | null
          pdf_url?: string | null
          responsavel_id: string
          restricoes?: string | null
          status?: string
          temperatura_c?: number | null
          turno?: string | null
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          assinatura_aprovador?: string | null
          assinatura_responsavel?: string | null
          atrasos?: string | null
          clima?: string | null
          condicoes_canteiro?: string | null
          created_at?: string
          created_by?: string | null
          data_aprovacao?: string | null
          data_rdo?: string
          fotos_geral?: string[] | null
          horario_fim?: string | null
          horario_inicio?: string | null
          horas_paradas_nao_programadas?: number | null
          horas_paradas_programadas?: number | null
          id?: string
          numero_rdo?: string
          obra_id?: string
          observacoes_aprovacao?: string | null
          observacoes_gerais?: string | null
          ocorrencias?: string | null
          pdf_url?: string | null
          responsavel_id?: string
          restricoes?: string | null
          status?: string
          temperatura_c?: number | null
          turno?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rdo_relatorios_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdo_relatorios_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      responsaveis: {
        Row: {
          ativo: boolean | null
          contato: string | null
          created_at: string | null
          id: string
          nome: string
          observacoes: string | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          contato?: string | null
          created_at?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          contato?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rme_checklist_catalog: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_default: boolean | null
          item_key: string
          label: string
          sort_order: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          item_key: string
          label: string
          sort_order?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          item_key?: string
          label?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      rme_checklist_items: {
        Row: {
          category: string
          checked: boolean | null
          created_at: string | null
          id: string
          item_key: string
          label: string
          rme_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          checked?: boolean | null
          created_at?: string | null
          id?: string
          item_key: string
          label: string
          rme_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          checked?: boolean | null
          created_at?: string | null
          id?: string
          item_key?: string
          label?: string
          rme_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rme_checklist_items_rme_id_fkey"
            columns: ["rme_id"]
            isOneToOne: false
            referencedRelation: "rme_relatorios"
            referencedColumns: ["id"]
          },
        ]
      }
      rme_relatorios: {
        Row: {
          anexos_tecnicos: string[] | null
          aprovado_por: string | null
          assinatura_cliente: string | null
          assinatura_tecnico: string | null
          collaboration: Json | null
          condicoes_encontradas: string
          created_at: string
          data_aprovacao: string | null
          data_execucao: string
          data_fim_execucao: string | null
          data_preenchimento: string
          end_time: string | null
          equipamento_id: string | null
          fotos_antes: string[] | null
          fotos_depois: string[] | null
          id: string
          images_posted: boolean | null
          inverter_number: string | null
          materiais_utilizados: Json | null
          medicoes_eletricas: Json | null
          micro_number: string | null
          modules_cleaned_qty: number | null
          nome_cliente_assinatura: string | null
          observacoes_aprovacao: string | null
          observacoes_tecnicas: string | null
          ordem_servico_id: string
          pdf_url: string | null
          service_type: Json | null
          servicos_executados: string
          shift: string | null
          signatures: Json | null
          site_name: string | null
          start_time: string | null
          status: string
          string_box_qty: number | null
          tecnico_id: string
          testes_realizados: string | null
          ticket_id: string
          updated_at: string
          weekday: string | null
        }
        Insert: {
          anexos_tecnicos?: string[] | null
          aprovado_por?: string | null
          assinatura_cliente?: string | null
          assinatura_tecnico?: string | null
          collaboration?: Json | null
          condicoes_encontradas: string
          created_at?: string
          data_aprovacao?: string | null
          data_execucao: string
          data_fim_execucao?: string | null
          data_preenchimento?: string
          end_time?: string | null
          equipamento_id?: string | null
          fotos_antes?: string[] | null
          fotos_depois?: string[] | null
          id?: string
          images_posted?: boolean | null
          inverter_number?: string | null
          materiais_utilizados?: Json | null
          medicoes_eletricas?: Json | null
          micro_number?: string | null
          modules_cleaned_qty?: number | null
          nome_cliente_assinatura?: string | null
          observacoes_aprovacao?: string | null
          observacoes_tecnicas?: string | null
          ordem_servico_id: string
          pdf_url?: string | null
          service_type?: Json | null
          servicos_executados: string
          shift?: string | null
          signatures?: Json | null
          site_name?: string | null
          start_time?: string | null
          status?: string
          string_box_qty?: number | null
          tecnico_id: string
          testes_realizados?: string | null
          ticket_id: string
          updated_at?: string
          weekday?: string | null
        }
        Update: {
          anexos_tecnicos?: string[] | null
          aprovado_por?: string | null
          assinatura_cliente?: string | null
          assinatura_tecnico?: string | null
          collaboration?: Json | null
          condicoes_encontradas?: string
          created_at?: string
          data_aprovacao?: string | null
          data_execucao?: string
          data_fim_execucao?: string | null
          data_preenchimento?: string
          end_time?: string | null
          equipamento_id?: string | null
          fotos_antes?: string[] | null
          fotos_depois?: string[] | null
          id?: string
          images_posted?: boolean | null
          inverter_number?: string | null
          materiais_utilizados?: Json | null
          medicoes_eletricas?: Json | null
          micro_number?: string | null
          modules_cleaned_qty?: number | null
          nome_cliente_assinatura?: string | null
          observacoes_aprovacao?: string | null
          observacoes_tecnicas?: string | null
          ordem_servico_id?: string
          pdf_url?: string | null
          service_type?: Json | null
          servicos_executados?: string
          shift?: string | null
          signatures?: Json | null
          site_name?: string | null
          start_time?: string | null
          status?: string
          string_box_qty?: number | null
          tecnico_id?: string
          testes_realizados?: string | null
          ticket_id?: string
          updated_at?: string
          weekday?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rme_relatorios_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rme_relatorios_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: true
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rme_relatorios_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rme_relatorios_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      route_optimizations: {
        Row: {
          created_at: string
          data_rota: string
          distance_km: number
          duration_minutes: number
          geometry: Json
          id: string
          optimization_method: string
          tecnico_id: string
          ticket_ids: string[]
          updated_at: string
          waypoints_order: Json
        }
        Insert: {
          created_at?: string
          data_rota: string
          distance_km: number
          duration_minutes: number
          geometry: Json
          id?: string
          optimization_method: string
          tecnico_id: string
          ticket_ids: string[]
          updated_at?: string
          waypoints_order: Json
        }
        Update: {
          created_at?: string
          data_rota?: string
          distance_km?: number
          duration_minutes?: number
          geometry?: Json
          id?: string
          optimization_method?: string
          tecnico_id?: string
          ticket_ids?: string[]
          updated_at?: string
          waypoints_order?: Json
        }
        Relationships: [
          {
            foreignKeyName: "route_optimizations_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "tecnicos"
            referencedColumns: ["id"]
          },
        ]
      }
      status_historico: {
        Row: {
          alterado_por: string | null
          data_alteracao: string
          id: string
          observacoes: string | null
          status_anterior: Database["public"]["Enums"]["ticket_status"] | null
          status_novo: Database["public"]["Enums"]["ticket_status"]
          ticket_id: string
        }
        Insert: {
          alterado_por?: string | null
          data_alteracao?: string
          id?: string
          observacoes?: string | null
          status_anterior?: Database["public"]["Enums"]["ticket_status"] | null
          status_novo: Database["public"]["Enums"]["ticket_status"]
          ticket_id: string
        }
        Update: {
          alterado_por?: string | null
          data_alteracao?: string
          id?: string
          observacoes?: string | null
          status_anterior?: Database["public"]["Enums"]["ticket_status"] | null
          status_novo?: Database["public"]["Enums"]["ticket_status"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_historico_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_runs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          last_sync_cursor: string | null
          rows_read: number
          rows_upserted: number
          source: string
          started_at: string
          status: string
          triggered_by: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          last_sync_cursor?: string | null
          rows_read?: number
          rows_upserted?: number
          source: string
          started_at?: string
          status?: string
          triggered_by?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          last_sync_cursor?: string | null
          rows_read?: number
          rows_upserted?: number
          source?: string
          started_at?: string
          status?: string
          triggered_by?: string
        }
        Relationships: []
      }
      tarifas_concessionaria: {
        Row: {
          ativo: boolean | null
          bandeira_amarela_rs_kwh: number | null
          bandeira_verde_rs_kwh: number | null
          bandeira_vermelha1_rs_kwh: number | null
          bandeira_vermelha2_rs_kwh: number | null
          cofins_percent: number | null
          concessionaria: string
          created_at: string
          demanda_fora_ponta_rs_kw: number | null
          demanda_geracao_rs_kw: number | null
          demanda_ponta_rs_kw: number | null
          demanda_ultrapassagem_rs_kw: number | null
          demanda_unica_rs_kw: number | null
          grupo_tarifario: string
          icms_percent: number | null
          id: string
          modalidade: string | null
          pis_percent: number | null
          resolucao_aneel: string | null
          subgrupo: string | null
          te_fora_ponta_rs_kwh: number | null
          te_ponta_rs_kwh: number | null
          te_reservado_rs_kwh: number | null
          te_unica_rs_kwh: number | null
          tusd_encargos_rs_kwh: number | null
          tusd_fio_a_rs_kwh: number | null
          tusd_fio_b_rs_kwh: number | null
          tusd_fora_ponta_rs_kwh: number | null
          tusd_ponta_rs_kwh: number | null
          tusd_reservado_rs_kwh: number | null
          tusd_unica_rs_kwh: number | null
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          ativo?: boolean | null
          bandeira_amarela_rs_kwh?: number | null
          bandeira_verde_rs_kwh?: number | null
          bandeira_vermelha1_rs_kwh?: number | null
          bandeira_vermelha2_rs_kwh?: number | null
          cofins_percent?: number | null
          concessionaria: string
          created_at?: string
          demanda_fora_ponta_rs_kw?: number | null
          demanda_geracao_rs_kw?: number | null
          demanda_ponta_rs_kw?: number | null
          demanda_ultrapassagem_rs_kw?: number | null
          demanda_unica_rs_kw?: number | null
          grupo_tarifario: string
          icms_percent?: number | null
          id?: string
          modalidade?: string | null
          pis_percent?: number | null
          resolucao_aneel?: string | null
          subgrupo?: string | null
          te_fora_ponta_rs_kwh?: number | null
          te_ponta_rs_kwh?: number | null
          te_reservado_rs_kwh?: number | null
          te_unica_rs_kwh?: number | null
          tusd_encargos_rs_kwh?: number | null
          tusd_fio_a_rs_kwh?: number | null
          tusd_fio_b_rs_kwh?: number | null
          tusd_fora_ponta_rs_kwh?: number | null
          tusd_ponta_rs_kwh?: number | null
          tusd_reservado_rs_kwh?: number | null
          tusd_unica_rs_kwh?: number | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          ativo?: boolean | null
          bandeira_amarela_rs_kwh?: number | null
          bandeira_verde_rs_kwh?: number | null
          bandeira_vermelha1_rs_kwh?: number | null
          bandeira_vermelha2_rs_kwh?: number | null
          cofins_percent?: number | null
          concessionaria?: string
          created_at?: string
          demanda_fora_ponta_rs_kw?: number | null
          demanda_geracao_rs_kw?: number | null
          demanda_ponta_rs_kw?: number | null
          demanda_ultrapassagem_rs_kw?: number | null
          demanda_unica_rs_kw?: number | null
          grupo_tarifario?: string
          icms_percent?: number | null
          id?: string
          modalidade?: string | null
          pis_percent?: number | null
          resolucao_aneel?: string | null
          subgrupo?: string | null
          te_fora_ponta_rs_kwh?: number | null
          te_ponta_rs_kwh?: number | null
          te_reservado_rs_kwh?: number | null
          te_unica_rs_kwh?: number | null
          tusd_encargos_rs_kwh?: number | null
          tusd_fio_a_rs_kwh?: number | null
          tusd_fio_b_rs_kwh?: number | null
          tusd_fora_ponta_rs_kwh?: number | null
          tusd_ponta_rs_kwh?: number | null
          tusd_reservado_rs_kwh?: number | null
          tusd_unica_rs_kwh?: number | null
          updated_at?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      tecnicos: {
        Row: {
          created_at: string
          especialidades: string[] | null
          id: string
          prestador_id: string | null
          profile_id: string
          regiao_atuacao: string | null
          registro_profissional: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          especialidades?: string[] | null
          id?: string
          prestador_id?: string | null
          profile_id: string
          regiao_atuacao?: string | null
          registro_profissional?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          especialidades?: string[] | null
          id?: string
          prestador_id?: string | null
          profile_id?: string
          regiao_atuacao?: string | null
          registro_profissional?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tecnicos_prestador_id_fkey"
            columns: ["prestador_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tecnicos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          aceite_tecnico: string
          anexos: string[] | null
          can_create_rme: boolean | null
          cliente_id: string
          created_at: string
          created_by: string
          data_abertura: string
          data_conclusao: string | null
          data_inicio_execucao: string | null
          data_servico: string | null
          data_vencimento: string | null
          descricao: string
          endereco_servico: string
          equipamento_tipo: Database["public"]["Enums"]["equipamento_tipo"]
          geocoded_at: string | null
          geocoding_status: string | null
          horario_previsto_inicio: string | null
          id: string
          latitude: number | null
          longitude: number | null
          numero_ticket: string
          observacoes: string | null
          prioridade: Database["public"]["Enums"]["prioridade_tipo"]
          status: Database["public"]["Enums"]["ticket_status"]
          tecnico_responsavel_id: string | null
          titulo: string
          ufv_nome: string | null
          updated_at: string
        }
        Insert: {
          aceite_tecnico?: string
          anexos?: string[] | null
          can_create_rme?: boolean | null
          cliente_id: string
          created_at?: string
          created_by: string
          data_abertura?: string
          data_conclusao?: string | null
          data_inicio_execucao?: string | null
          data_servico?: string | null
          data_vencimento?: string | null
          descricao: string
          endereco_servico: string
          equipamento_tipo: Database["public"]["Enums"]["equipamento_tipo"]
          geocoded_at?: string | null
          geocoding_status?: string | null
          horario_previsto_inicio?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          numero_ticket: string
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_tipo"]
          status?: Database["public"]["Enums"]["ticket_status"]
          tecnico_responsavel_id?: string | null
          titulo: string
          ufv_nome?: string | null
          updated_at?: string
        }
        Update: {
          aceite_tecnico?: string
          anexos?: string[] | null
          can_create_rme?: boolean | null
          cliente_id?: string
          created_at?: string
          created_by?: string
          data_abertura?: string
          data_conclusao?: string | null
          data_inicio_execucao?: string | null
          data_servico?: string | null
          data_vencimento?: string | null
          descricao?: string
          endereco_servico?: string
          equipamento_tipo?: Database["public"]["Enums"]["equipamento_tipo"]
          geocoded_at?: string | null
          geocoding_status?: string | null
          horario_previsto_inicio?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          numero_ticket?: string
          observacoes?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_tipo"]
          status?: Database["public"]["Enums"]["ticket_status"]
          tecnico_responsavel_id?: string | null
          titulo?: string
          ufv_nome?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tecnico_responsavel_id_fkey"
            columns: ["tecnico_responsavel_id"]
            isOneToOne: false
            referencedRelation: "prestadores"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_consumidoras: {
        Row: {
          classe_tarifaria: string | null
          cliente_id: string
          concessionaria: string
          created_at: string
          custo_disponibilidade_kwh: number | null
          data_protocolo_gd: string | null
          demanda_contratada: number
          demanda_geracao_kw: number | null
          distribuidora: string
          endereco: string
          grupo_tarifario: string | null
          id: string
          modalidade_tarifaria: string
          numero: string
          subgrupo: string | null
          tem_geracao_propria: boolean | null
          tensao_kv: number | null
          tipo_fornecimento: string | null
          updated_at: string
        }
        Insert: {
          classe_tarifaria?: string | null
          cliente_id: string
          concessionaria?: string
          created_at?: string
          custo_disponibilidade_kwh?: number | null
          data_protocolo_gd?: string | null
          demanda_contratada?: number
          demanda_geracao_kw?: number | null
          distribuidora: string
          endereco: string
          grupo_tarifario?: string | null
          id?: string
          modalidade_tarifaria: string
          numero: string
          subgrupo?: string | null
          tem_geracao_propria?: boolean | null
          tensao_kv?: number | null
          tipo_fornecimento?: string | null
          updated_at?: string
        }
        Update: {
          classe_tarifaria?: string | null
          cliente_id?: string
          concessionaria?: string
          created_at?: string
          custo_disponibilidade_kwh?: number | null
          data_protocolo_gd?: string | null
          demanda_contratada?: number
          demanda_geracao_kw?: number | null
          distribuidora?: string
          endereco?: string
          grupo_tarifario?: string | null
          id?: string
          modalidade_tarifaria?: string
          numero?: string
          subgrupo?: string | null
          tem_geracao_propria?: boolean | null
          tensao_kv?: number | null
          tipo_fornecimento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_consumidoras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usina_geracao_mensal: {
        Row: {
          created_at: string | null
          disponibilidade_percent: number | null
          fator_capacidade_percent: number | null
          geracao_fora_ponta_kwh: number | null
          geracao_ponta_kwh: number | null
          geracao_reservado_kwh: number | null
          geracao_total_kwh: number
          id: string
          mes_ref: string
          observacoes: string | null
          ufv_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disponibilidade_percent?: number | null
          fator_capacidade_percent?: number | null
          geracao_fora_ponta_kwh?: number | null
          geracao_ponta_kwh?: number | null
          geracao_reservado_kwh?: number | null
          geracao_total_kwh?: number
          id?: string
          mes_ref: string
          observacoes?: string | null
          ufv_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disponibilidade_percent?: number | null
          fator_capacidade_percent?: number | null
          geracao_fora_ponta_kwh?: number | null
          geracao_ponta_kwh?: number | null
          geracao_reservado_kwh?: number | null
          geracao_total_kwh?: number
          id?: string
          mes_ref?: string
          observacoes?: string | null
          ufv_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usina_geracao_mensal_ufv_id_fkey"
            columns: ["ufv_id"]
            isOneToOne: false
            referencedRelation: "cliente_ufvs"
            referencedColumns: ["id"]
          },
        ]
      }
      usina_rateio_mensal: {
        Row: {
          created_at: string | null
          energia_alocada_kwh: number
          energia_fora_ponta_kwh: number | null
          energia_ponta_kwh: number | null
          energia_reservado_kwh: number | null
          geracao_id: string
          id: string
          percentual_aplicado: number
          status: string | null
          uc_beneficiaria_id: string
          updated_at: string | null
          valor_compensado_estimado_rs: number | null
          valor_fatura_usina_rs: number | null
          vinculo_id: string
        }
        Insert: {
          created_at?: string | null
          energia_alocada_kwh?: number
          energia_fora_ponta_kwh?: number | null
          energia_ponta_kwh?: number | null
          energia_reservado_kwh?: number | null
          geracao_id: string
          id?: string
          percentual_aplicado?: number
          status?: string | null
          uc_beneficiaria_id: string
          updated_at?: string | null
          valor_compensado_estimado_rs?: number | null
          valor_fatura_usina_rs?: number | null
          vinculo_id: string
        }
        Update: {
          created_at?: string | null
          energia_alocada_kwh?: number
          energia_fora_ponta_kwh?: number | null
          energia_ponta_kwh?: number | null
          energia_reservado_kwh?: number | null
          geracao_id?: string
          id?: string
          percentual_aplicado?: number
          status?: string | null
          uc_beneficiaria_id?: string
          updated_at?: string | null
          valor_compensado_estimado_rs?: number | null
          valor_fatura_usina_rs?: number | null
          vinculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usina_rateio_mensal_geracao_id_fkey"
            columns: ["geracao_id"]
            isOneToOne: false
            referencedRelation: "usina_geracao_mensal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usina_rateio_mensal_uc_beneficiaria_id_fkey"
            columns: ["uc_beneficiaria_id"]
            isOneToOne: false
            referencedRelation: "unidades_consumidoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usina_rateio_mensal_vinculo_id_fkey"
            columns: ["vinculo_id"]
            isOneToOne: false
            referencedRelation: "cliente_usina_vinculo"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_retry: { Args: { attempt: number }; Returns: string }
      can_approve_rdo: { Args: { _user_id: string }; Returns: boolean }
      can_tech_view_cliente: {
        Args: { p_cliente_id: string; p_user_id: string }
        Returns: boolean
      }
      check_geocoding_rate_limit: {
        Args: {
          p_ip: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_presence_rate_limit: {
        Args: { p_ip: string; p_os_id: string }
        Returns: boolean
      }
      check_schedule_conflict: {
        Args: {
          p_data: string
          p_hora_fim: string
          p_hora_inicio: string
          p_os_id?: string
          p_tecnico_id: string
        }
        Returns: boolean
      }
      classificar_gd: { Args: { data_protocolo: string }; Returns: string }
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      cleanup_geocoding_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_geocoding_cache: { Args: never; Returns: undefined }
      generate_presence_token: { Args: { p_os_id: string }; Returns: string }
      gerar_numero_os: { Args: never; Returns: string }
      gerar_numero_rdo: { Args: never; Returns: string }
      gerar_numero_ticket: { Args: never; Returns: string }
      get_backoffice_devolucoes: {
        Args: never
        Returns: {
          devolucoes: Json
          insumo_nome: string
          kit_nome: string
          lote_id: string
          numero_os: string
          ordem_servico_id: string
          quantidade: number
          quantidade_devolvida: number
          retornavel: boolean
          saida_created_at: string
          saida_id: string
          saida_status: string
          tecnico_nome: string
        }[]
      }
      get_backoffice_entradas_pendentes: {
        Args: never
        Returns: {
          created_at: string
          evidencias: Json
          id: string
          insumo_nome: string
          kit_nome: string
          numero_os: string
          observacoes: string
          ordem_servico_id: string
          quantidade: number
          rejeitado_motivo: string
          saida_id: string
          status: string
          tecnico_nome: string
        }[]
      }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_minhas_devolucoes: {
        Args: never
        Returns: {
          devolucoes: Json
          entradas: Json
          insumo_nome: string
          kit_nome: string
          lote_id: string
          numero_os: string
          ordem_servico_id: string
          quantidade: number
          quantidade_devolvida: number
          retornavel: boolean
          saida_created_at: string
          saida_id: string
          saida_status: string
        }[]
      }
      get_rme_pendencias_insumos: {
        Args: { p_rme_id: string }
        Returns: {
          insumo_nome: string
          kit_nome: string
          numero_os: string
          ordem_servico_id: string
          quantidade: number
          quantidade_devolvida: number
          retornavel: boolean
          saida_id: string
          status: string
          tecnico_nome: string
        }[]
      }
      get_technician_workload: {
        Args: { p_end_date: string; p_start_date: string; p_tecnico_id: string }
        Returns: {
          data: string
          os_concluidas: number
          os_pendentes: number
          total_minutos_previstos: number
          total_minutos_realizados: number
          total_os: number
        }[]
      }
      get_technician_workload_os_detail: {
        Args: { p_end_date: string; p_start_date: string; p_tecnico_id: string }
        Returns: {
          cliente: string
          data_programada: string
          minutos_previstos: number
          minutos_realizados: number
          numero_os: string
          ordem_servico_id: string
          ticket_status: string
          ticket_titulo: string
        }[]
      }
      get_tecnico_os_ativas: {
        Args: { p_tecnico_id: string }
        Returns: {
          cliente: string
          data_programada: string
          numero_os: string
          ordem_servico_id: string
          ticket_status: string
          ticket_titulo: string
        }[]
      }
      get_ticket_rme_group_context: {
        Args: { p_ticket_id: string }
        Returns: {
          aceite_status: string
          email: string
          nome: string
          responsavel_email: string
          tecnico_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_safe: { Args: never; Returns: boolean }
      is_backoffice: { Args: { _user_id: string }; Returns: boolean }
      is_cliente_owner: {
        Args: { _cliente_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_staff_or_backoffice: { Args: { _user_id: string }; Returns: boolean }
      is_ticket_owner_cliente: {
        Args: { _ticket_id: string; _user_id: string }
        Returns: boolean
      }
      list_rdo_eletromecanicos: {
        Args: { p_only_supervisores?: boolean }
        Returns: {
          categoria: string
          id: string
          nome: string
        }[]
      }
      log_presence_attempt: {
        Args: { p_ip: string; p_os_id: string }
        Returns: undefined
      }
      mark_stale_clientes_sync_runs: { Args: never; Returns: undefined }
      mark_token_used: { Args: { p_token: string }; Returns: undefined }
      obter_percentual_fio_b: {
        Args: { ano_referencia: number }
        Returns: number
      }
      obter_tarifa_vigente: {
        Args: {
          p_concessionaria: string
          p_data_referencia?: string
          p_grupo_tarifario: string
          p_modalidade?: string
        }
        Returns: {
          ativo: boolean | null
          bandeira_amarela_rs_kwh: number | null
          bandeira_verde_rs_kwh: number | null
          bandeira_vermelha1_rs_kwh: number | null
          bandeira_vermelha2_rs_kwh: number | null
          cofins_percent: number | null
          concessionaria: string
          created_at: string
          demanda_fora_ponta_rs_kw: number | null
          demanda_geracao_rs_kw: number | null
          demanda_ponta_rs_kw: number | null
          demanda_ultrapassagem_rs_kw: number | null
          demanda_unica_rs_kw: number | null
          grupo_tarifario: string
          icms_percent: number | null
          id: string
          modalidade: string | null
          pis_percent: number | null
          resolucao_aneel: string | null
          subgrupo: string | null
          te_fora_ponta_rs_kwh: number | null
          te_ponta_rs_kwh: number | null
          te_reservado_rs_kwh: number | null
          te_unica_rs_kwh: number | null
          tusd_encargos_rs_kwh: number | null
          tusd_fio_a_rs_kwh: number | null
          tusd_fio_b_rs_kwh: number | null
          tusd_fora_ponta_rs_kwh: number | null
          tusd_ponta_rs_kwh: number | null
          tusd_reservado_rs_kwh: number | null
          tusd_unica_rs_kwh: number | null
          updated_at: string
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        SetofOptions: {
          from: "*"
          to: "tarifas_concessionaria"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      populate_rme_checklist: { Args: { p_rme_id: string }; Returns: undefined }
      rdo_status: { Args: { _rdo_id: string }; Returns: string }
      register_devolucao_lote: {
        Args: {
          p_evidencias: Json
          p_observacoes: string
          p_quantidade: number
          p_saida_id: string
        }
        Returns: number
      }
      user_in_rdo_equipe: {
        Args: { _rdo_id: string; _uid: string }
        Returns: boolean
      }
      user_is_prestador: {
        Args: { _prestador_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_rdo_responsavel: {
        Args: { _rdo_id: string; _uid: string }
        Returns: boolean
      }
      user_owns_obra: {
        Args: { _obra_id: string; _user_id: string }
        Returns: boolean
      }
      validate_presence_token: {
        Args: { p_os_id: string; p_token: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "area_tecnica"
        | "tecnico_campo"
        | "cliente"
        | "engenharia"
        | "supervisao"
        | "backoffice"
        | "eletromecanico"
        | "sup_eletromecanico"
        | "lider"
        | "lider_eletromecanico"
        | "gerador"
      classificacao_gd: "gd1" | "gd2"
      equipamento_tipo:
        | "painel_solar"
        | "inversor"
        | "controlador_carga"
        | "bateria"
        | "cabeamento"
        | "estrutura"
        | "monitoramento"
        | "outros"
      fonte_energia: "solar" | "eolica" | "hidraulica" | "biomassa" | "outros"
      grupo_tarifario: "A" | "B"
      modalidade_economia: "ppa_tarifa" | "desconto_fatura_global"
      modalidade_gd:
        | "autoconsumo_remoto"
        | "geracao_compartilhada"
        | "consorcio"
        | "cooperativa"
      prioridade_tipo: "baixa" | "media" | "alta" | "critica"
      referencia_desconto: "valor_total" | "te_tusd" | "apenas_te"
      ticket_status:
        | "aberto"
        | "aguardando_aprovacao"
        | "aprovado"
        | "rejeitado"
        | "ordem_servico_gerada"
        | "em_execucao"
        | "aguardando_rme"
        | "concluido"
        | "cancelado"
      user_role:
        | "admin"
        | "tecnico_campo"
        | "area_tecnica"
        | "cliente"
        | "engenharia"
        | "supervisao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "area_tecnica",
        "tecnico_campo",
        "cliente",
        "engenharia",
        "supervisao",
        "backoffice",
        "eletromecanico",
        "sup_eletromecanico",
        "lider",
        "lider_eletromecanico",
        "gerador",
      ],
      classificacao_gd: ["gd1", "gd2"],
      equipamento_tipo: [
        "painel_solar",
        "inversor",
        "controlador_carga",
        "bateria",
        "cabeamento",
        "estrutura",
        "monitoramento",
        "outros",
      ],
      fonte_energia: ["solar", "eolica", "hidraulica", "biomassa", "outros"],
      grupo_tarifario: ["A", "B"],
      modalidade_economia: ["ppa_tarifa", "desconto_fatura_global"],
      modalidade_gd: [
        "autoconsumo_remoto",
        "geracao_compartilhada",
        "consorcio",
        "cooperativa",
      ],
      prioridade_tipo: ["baixa", "media", "alta", "critica"],
      referencia_desconto: ["valor_total", "te_tusd", "apenas_te"],
      ticket_status: [
        "aberto",
        "aguardando_aprovacao",
        "aprovado",
        "rejeitado",
        "ordem_servico_gerada",
        "em_execucao",
        "aguardando_rme",
        "concluido",
        "cancelado",
      ],
      user_role: [
        "admin",
        "tecnico_campo",
        "area_tecnica",
        "cliente",
        "engenharia",
        "supervisao",
      ],
    },
  },
} as const
