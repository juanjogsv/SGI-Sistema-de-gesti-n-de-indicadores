export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cat_ejes_trabajo: {
        Row: { id: string; codigo: string; nombre: string; activo: boolean; orden: number; creado_en: string }
        Insert: Omit<Database['public']['Tables']['cat_ejes_trabajo']['Row'], 'id' | 'creado_en'> & { id?: string; creado_en?: string }
        Update: Partial<Database['public']['Tables']['cat_ejes_trabajo']['Insert']>
      }
      cat_tipos_dato: {
        Row: { id: string; codigo: string; nombre: string; descripcion: string | null; activo: boolean; orden: number; creado_en: string }
        Insert: Omit<Database['public']['Tables']['cat_tipos_dato']['Row'], 'id' | 'creado_en'> & { id?: string; creado_en?: string }
        Update: Partial<Database['public']['Tables']['cat_tipos_dato']['Insert']>
      }
      cat_niveles_logico: {
        Row: { id: string; codigo: string; nombre: string; descripcion: string | null; activo: boolean; orden: number; creado_en: string }
        Insert: Omit<Database['public']['Tables']['cat_niveles_logico']['Row'], 'id' | 'creado_en'> & { id?: string; creado_en?: string }
        Update: Partial<Database['public']['Tables']['cat_niveles_logico']['Insert']>
      }
      cat_frecuencias: {
        Row: { id: string; codigo: string; nombre: string; descripcion: string | null; activo: boolean; orden: number; creado_en: string }
        Insert: Omit<Database['public']['Tables']['cat_frecuencias']['Row'], 'id' | 'creado_en'> & { id?: string; creado_en?: string }
        Update: Partial<Database['public']['Tables']['cat_frecuencias']['Insert']>
      }
      usuarios: {
        Row: {
          id: string
          auth_user_id: string | null
          nombre: string
          email: string
          activo: boolean
          creado_en: string
          actualizado_en: string
        }
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'id' | 'creado_en' | 'actualizado_en'> & { id?: string, creado_en?: string, actualizado_en?: string }
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
      }
      programas: {
        Row: {
          id: string
          nombre: string
          eje_trabajo_id: string
          ciclo_id: string
          creado_en: string
        }
        Insert: Omit<Database['public']['Tables']['programas']['Row'], 'id' | 'creado_en'> & { id?: string, creado_en?: string }
        Update: Partial<Database['public']['Tables']['programas']['Insert']>
      }
      ciclos: {
        Row: {
          id: string
          nombre: string
          anio: number
          activo: boolean
        }
        Insert: Omit<Database['public']['Tables']['ciclos']['Row'], 'id' | 'activo'> & { id?: string, activo?: boolean }
        Update: Partial<Database['public']['Tables']['ciclos']['Insert']>
      }
      indicadores: {
        Row: {
          id: string
          nombre: string
          nivel_logico_id: string
          tipo_dato_id: string
          linea_base: number
          frecuencia_reporte_id: string
          es_inverso: boolean
          observaciones: string | null
          programa_id: string
          creado_en: string
        }
        Insert: Omit<Database['public']['Tables']['indicadores']['Row'], 'id' | 'frecuencia_reporte' | 'es_inverso' | 'creado_en'> & { id?: string, frecuencia_reporte?: Database['public']['Enums']['frecuencia_enum'], es_inverso?: boolean, creado_en?: string }
        Update: Partial<Database['public']['Tables']['indicadores']['Insert']>
      }
      metas: {
        Row: {
          id: string
          indicador_id: string
          ciclo_id: string
          valor_meta: number
          fecha_corte: string
        }
        Insert: Omit<Database['public']['Tables']['metas']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['metas']['Insert']>
      }
      politicas_calidad: {
        Row: {
          id: string
          indicador_id: string
          ciclo_id: string
          pondera: boolean
          peso_estrategico: number
          alfa_exceso: number
          tope_maximo: number | null
          umbral_completitud: number
          rango_min: number | null
          rango_max: number | null
          dias_max_retraso: number
          justificacion: string | null
          modificado_por: string | null
          modificado_en: string
        }
        Insert: Omit<Database['public']['Tables']['politicas_calidad']['Row'], 'id' | 'pondera' | 'peso_estrategico' | 'alfa_exceso' | 'umbral_completitud' | 'dias_max_retraso' | 'modificado_en'> & { id?: string }
        Update: Partial<Database['public']['Tables']['politicas_calidad']['Insert']>
      }
      reportes: {
        Row: {
          id: string
          indicador_id: string
          ciclo_id: string
          valor_real: number
          fecha: string
          observacion: string | null
          estado: Database['public']['Enums']['estado_reporte_enum']
          creado_por: string
          creado_en: string
        }
        Insert: Omit<Database['public']['Tables']['reportes']['Row'], 'id' | 'estado' | 'creado_en' | 'fecha'> & { id?: string, estado?: Database['public']['Enums']['estado_reporte_enum'], creado_en?: string, fecha?: string }
        Update: Partial<Database['public']['Tables']['reportes']['Insert']>
      }
    }
    Views: {
      v_cuadro_mando: {
        Row: {
          programa: string
          eje_trabajo: string
          indicador_id: string
          indicador: string
          nivel_logico: string
          tipo_dato: string
          es_inverso: boolean
          ciclo: string
          valor_meta: number | null
          linea_base: number
          valor_real: number | null
          fecha_reporte: string | null
          estado_reporte: Database['public']['Enums']['estado_reporte_enum'] | null
          pondera: boolean | null
          peso_estrategico: number | null
          alfa_exceso: number | null
          tope_maximo: number | null
          c_pct: number | null
          c_efectivo: number | null
          semaforo: Database['public']['Enums']['semaforo_enum']
        }
      }
    }
    Functions: {
      fn_score_programa: {
        Args: { p_programa_id: string; p_ciclo_id: string }
        Returns: {
          score_ponderado: number | null
          semaforo: Database['public']['Enums']['semaforo_enum']
          n_activos: number
          n_nulos: number
          suma_pesos: number
        }[]
      }
    }
    Enums: {
      nivel_logico_enum: 'resultado' | 'impacto' | 'producto' | 'proceso' | 'insumo'
      tipo_dato_enum: 'porcentaje' | 'absoluto' | 'indice' | 'cualitativo'
      frecuencia_enum: 'mensual' | 'trimestral' | 'semestral' | 'anual'
      rol_global_enum: 'admin' | 'editor' | 'validador' | 'lector' | 'auditor'
      rol_programa_enum: 'editor' | 'validador' | 'lector'
      estado_reporte_enum: 'borrador' | 'en_revision' | 'aprobado' | 'rechazado'
      semaforo_enum: 'azul' | 'verde' | 'amarillo' | 'amarillo_oscuro' | 'rojo' | 'rojo_critico' | 'gris'
      accion_audit_enum: 'INSERT' | 'UPDATE' | 'DELETE'
    }
  }
}
