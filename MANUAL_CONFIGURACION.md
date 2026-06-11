# Manual de Configuración y Parametrización - SGI Fundata

Este documento explica paso a paso el orden lógico y correcto para configurar un nuevo ciclo de indicadores dentro del Sistema de Gestión de Indicadores (SGI) de la Fundación Luker. 

Debido a que la arquitectura de la base de datos es robusta y está fuertemente normalizada (utilizando conexiones exactas mediante UUIDs), **el orden de los factores sí altera el producto**. Debes configurar las bases maestras antes de intentar registrar metas o cargar reportes.

---

## Orden Lógico de Configuración

Sigue estrictamente esta secuencia cuando inicialices la plataforma o cuando vayas a preparar un nuevo año de evaluación:

### 1. Configuración de Catálogos (Bases del Sistema)
**Ubicación:** Pestaña `Catálogos`

Antes de crear cualquier indicador o programa, debes asegurarte de que las variables maestras existan. Estas variables alimentan los menús desplegables del resto de la plataforma.
- **Tipos de Dato:** Define cómo se medirá la información (ej. Porcentaje, Valor Absoluto, Índice, Cualitativo).
- **Niveles Lógicos:** Define la jerarquía del impacto (ej. Resultado, Impacto, Producto, Proceso, Insumo).
- **Frecuencias de Reporte:** (ej. Mensual, Trimestral, Semestral, Anual).

### 2. Definición del Ciclo de Trabajo
**Ubicación:** Pestaña `Ciclos`

Todo programa, meta e indicador necesita vivir dentro de un marco temporal o "Ciclo" (generalmente el año fiscal).
- Crea el ciclo correspondiente (ej. 2024, 2025).
- Solo debe existir un (1) ciclo marcado como **"Activo"** a la vez. El Dashboard y las analíticas priorizarán la visualización del ciclo que esté activo.

### 3. Gestión de Ejes de Trabajo
**Ubicación:** Pestaña `Programas` -> Panel Colapsable `Ejes de Trabajo`

Los ejes temáticos son los grandes pilares de la Fundación (ej. Educación, Emprendimiento, Habitabilidad). Agrupan a los programas.
- Asegúrate de dar de alta todos los ejes de trabajo de la Fundación antes de intentar registrar tu primer programa.

### 4. Creación de Programas
**Ubicación:** Pestaña `Programas`

Una vez tengas los Ciclos y los Ejes listos, puedes registrar los programas operativos.
- Cada programa debe asociarse obligatoriamente a un Eje de Trabajo existente y a un Ciclo de vida.
- **Tip:** Puedes usar el botón `+ Nuevo Programa` para hacerlo a mano, o usar la plantilla de carga masiva de Excel.

### 5. Configuración de Indicadores
**Ubicación:** Pestaña `Indicadores`

Los indicadores son la métrica que medirá el éxito de los Programas.
- Selecciona el Programa al que pertenece el indicador.
- Asigna los atributos que definiste en el Paso 1: Nivel Lógico, Tipo de Dato y Frecuencia de Reporte.
- Establece la **"Línea Base"**.
- Marca la casilla **"Es Inverso"** solo si el indicador mide algo negativo que queremos reducir (ej: Tasa de Deserción Escolar, donde sacar "menos" es "mejor").

### 6. Establecimiento de Metas y Políticas de Calidad
**Ubicación:** Pestaña `Metas y Políticas`

Un indicador no sirve de nada si no tiene un objetivo cuantitativo y reglas claras de evaluación.
- **Metas:** Define el `valor_meta` exacto que se espera alcanzar para el indicador dentro del Ciclo específico.
- **Políticas de Calidad:**
  - Define qué peso estratégico tiene el indicador dentro de su programa (Escala de 1 a 5).
  - Activa la casilla `pondera` si quieres que este indicador afecte la calificación global del programa.
  - Ajusta los límites matemáticos (`alfa_exceso`, `tope_maximo`) que evitarán que un indicador sobrecumplido desbalancee todo el sistema.

### 7. Gobernanza, Accesos y Permisos
**Ubicación:** Pestañas `Usuarios` y `Gobernanza`

Finalmente, decide quién puede hacer qué dentro de la plataforma.
- **Roles Globales (`Usuarios`):** Asigna roles amplios como Admin (acceso total a configuración) o Lector (solo visualización del Dashboard).
- **Roles Operativos (`Gobernanza`):** Asigna usuarios a programas específicos para descentralizar la carga de datos.
  - *Editor:* El coordinador de área que podrá subir el reporte manual o masivo (Excel) del programa.
  - *Validador:* El gerente que deberá aprobar la métrica reportada por el editor para que impacte los semáforos del Dashboard.

---

> 📝 **Nota sobre actualizaciones:** Mantendremos este documento vivo y en constante actualización a medida que se integren nuevos módulos operativos o cambie la arquitectura técnica de Fundata.
