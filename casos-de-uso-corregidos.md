# Casos de Uso Corregidos - Splitia

## Análisis y Correcciones de Casos de Uso

### CUN 1: Gestionar Gasto Personal
**Descripción:** Proceso mediante el cual un usuario registra, categoriza y da seguimiento a sus gastos individuales dentro de la plataforma.

**Actor Principal:** Usuario Final (individual)

**Correcciones aplicadas:**
- ✅ Clarificado que incluye gastos tanto individuales como los que no pertenecen a un grupo específico
- ✅ Especificado que incluye categorización personalizada
- ✅ Agregado seguimiento y análisis de gastos personales

### CUN 2: Dividir Gasto Grupal
**Descripción:** Proceso que permite registrar un gasto compartido y distribuir automáticamente la responsabilidad de pago entre los miembros del grupo según el método de división seleccionado.

**Actores beneficiados:**
- Usuario Final (individual) - quien registra el gasto
- Grupo de usuarios - miembros que participan en la división

**Correcciones aplicadas:**
- ✅ Especificado que el usuario debe ser miembro del grupo
- ✅ Clarificado que incluye diferentes métodos de división (igual, porcentaje, monto fijo)
- ✅ Agregado que genera automáticamente las cuotas correspondientes

### CUN 3: Comunicar sobre Finanzas
**Descripción:** Proceso que facilita la comunicación en tiempo real entre miembros de un grupo sobre temas relacionados con gastos compartidos, incluyendo mensajes y notificaciones.

**Actores beneficiados:**
- Usuario Final (individual) - puede comunicarse con otros miembros
- Grupo de Usuarios - intercambio de información financiera

**Correcciones aplicadas:**
- ✅ Clarificado que incluye mensajes sobre gastos específicos
- ✅ Agregado soporte para conversaciones individuales
- ✅ Especificado que incluye notificaciones en tiempo real

### CUN 4: Liquidar Deudas
**Descripción:** Proceso que permite registrar y confirmar pagos entre usuarios para saldar deudas pendientes derivadas de gastos compartidos, optimizando las transacciones necesarias mediante algoritmos de minimización.

**Actores beneficiados:**
- Usuario Final (individual) - quien inicia o confirma pagos
- Grupo de Usuarios - beneficiarios de la optimización de transacciones

**Correcciones aplicadas:**
- ✅ Clarificado que incluye confirmación bilateral de pagos
- ✅ Especificado que optimiza automáticamente las transacciones
- ✅ Agregado diferentes tipos de liquidación (pago directo, recibo)

### CUN 5: Analizar Patrones Financieros
**Descripción:** Proceso mediante el cual el usuario genera análisis detallados de sus gastos personales y grupales para identificar tendencias, categorizar gastos y optimizar su presupuesto personal.

**Actores beneficiados:**
- Usuario Final (individual) - quien recibe los análisis
- Grupo de Usuarios - análisis agregados del grupo

**Correcciones aplicadas:**
- ✅ Especificado que incluye análisis de tendencias temporales
- ✅ Agregado comparación con presupuestos establecidos
- ✅ Clarificado que incluye reportes visuales y estadísticas

### CUN 6: Procesar Suscripción Premium
**Descripción:** Proceso mediante el cual un usuario contrata, paga y activa un plan premium de la plataforma, desbloqueando funcionalidades avanzadas como el asistente de IA y análisis avanzados.

**Actor beneficiado:** Usuario Final (individual)

**Correcciones aplicadas:**
- ✅ Especificado que incluye gestión de métodos de pago
- ✅ Agregado renovación automática y cancelación
- ✅ Clarificado las funcionalidades premium específicas

### CUN 7: Asistir con Inteligencia Artificial
**Descripción:** Proceso mediante el cual el asistente de IA interpreta comandos del usuario, analiza patrones de gasto, genera predicciones financieras y automatiza tareas como creación de gastos y liquidaciones.

**Actores beneficiados:**
- Usuario Final (individual) - quien interactúa con la IA
- Sistema de IA (OpenAI) - procesamiento de solicitudes

**Correcciones aplicadas:**
- ✅ Especificado que incluye procesamiento de lenguaje natural
- ✅ Agregado análisis predictivo de gastos
- ✅ Clarificado automatización de tareas financieras
- ✅ Especificado que requiere suscripción premium

### CUN 8: Brindar Soporte al Usuario
**Descripción:** Proceso de atención al cliente donde se reciben, gestionan y resuelven consultas, problemas técnicos o disputas de usuarios de la plataforma mediante diferentes canales de comunicación.

**Actores beneficiados:**
- Usuario Final (individual) - quien solicita soporte
- Grupo de Usuarios - resolución de disputas grupales
- Administrador/Soporte técnico - quien proporciona la asistencia

**Correcciones aplicadas:**
- ✅ Especificado canales de comunicación (chat, email, tickets)
- ✅ Agregado escalamiento de problemas complejos
- ✅ Clarificado resolución de disputas entre usuarios
- ✅ Especificado seguimiento y métricas de satisfacción

---

## Diagramas de Casos de Uso

### Diagrama Principal del Sistema

```mermaid
graph TB
    %% Actores
    User["👤 Usuario Final"]
    Group["👥 Grupo de Usuarios"]
    Admin["👨‍💼 Administrador/Soporte"]
    AI["🤖 Sistema de IA"]
    
    %% Casos de Uso
    CUN1["Gestionar Gasto Personal"]
    CUN2["Dividir Gasto Grupal"]
    CUN3["Comunicar sobre Finanzas"]
    CUN4["Liquidar Deudas"]
    CUN5["Analizar Patrones Financieros"]
    CUN6["Procesar Suscripción Premium"]
    CUN7["Asistir con IA"]
    CUN8["Brindar Soporte al Usuario"]
    
    %% Relaciones Usuario
    User --> CUN1
    User --> CUN2
    User --> CUN3
    User --> CUN4
    User --> CUN5
    User --> CUN6
    User --> CUN7
    
    %% Relaciones Grupo
    Group --> CUN2
    Group --> CUN3
    Group --> CUN4
    Group --> CUN5
    
    %% Relaciones Admin
    Admin --> CUN8
    
    %% Relaciones IA
    AI --> CUN7
    
    %% Dependencias entre casos de uso
    CUN2 -.-> CUN4
    CUN1 -.-> CUN5
    CUN2 -.-> CUN5
    CUN6 -.-> CUN7
    CUN3 -.-> CUN8
```

### Diagrama Detallado por Módulos

#### Módulo de Gestión de Gastos

```mermaid
graph TB
    User["👤 Usuario Final"]
    
    %% Gastos Personales
    CUN1["Gestionar Gasto Personal"]
    CUN1_1["Registrar gasto individual"]
    CUN1_2["Categorizar gasto"]
    CUN1_3["Seguimiento de gastos"]
    CUN1_4["Actualizar gasto"]
    CUN1_5["Eliminar gasto"]
    
    %% Gastos Grupales
    CUN2["Dividir Gasto Grupal"]
    CUN2_1["Registrar gasto grupal"]
    CUN2_2["Seleccionar método de división"]
    CUN2_3["Distribuir responsabilidades"]
    CUN2_4["Notificar a miembros"]
    
    User --> CUN1
    User --> CUN2
    
    CUN1 --> CUN1_1
    CUN1 --> CUN1_2
    CUN1 --> CUN1_3
    CUN1 --> CUN1_4
    CUN1 --> CUN1_5
    
    CUN2 --> CUN2_1
    CUN2 --> CUN2_2
    CUN2 --> CUN2_3
    CUN2 --> CUN2_4
```

#### Módulo de Comunicación y Liquidación

```mermaid
graph TB
    User["👤 Usuario Final"]
    Group["👥 Grupo de Usuarios"]
    
    %% Comunicación
    CUN3["Comunicar sobre Finanzas"]
    CUN3_1["Enviar mensaje grupal"]
    CUN3_2["Conversación individual"]
    CUN3_3["Notificaciones en tiempo real"]
    CUN3_4["Adjuntar archivos"]
    
    %% Liquidación
    CUN4["Liquidar Deudas"]
    CUN4_1["Iniciar liquidación"]
    CUN4_2["Confirmar pago"]
    CUN4_3["Optimizar transacciones"]
    CUN4_4["Registrar recibo"]
    CUN4_5["Marcar como completado"]
    
    User --> CUN3
    User --> CUN4
    Group --> CUN3
    Group --> CUN4
    
    CUN3 --> CUN3_1
    CUN3 --> CUN3_2
    CUN3 --> CUN3_3
    CUN3 --> CUN3_4
    
    CUN4 --> CUN4_1
    CUN4 --> CUN4_2
    CUN4 --> CUN4_3
    CUN4 --> CUN4_4
    CUN4 --> CUN4_5
```

#### Módulo de Análisis y Premium

```mermaid
graph TB
    User["👤 Usuario Final"]
    Group["👥 Grupo de Usuarios"]
    AI["🤖 Sistema de IA"]
    
    %% Análisis
    CUN5["Analizar Patrones Financieros"]
    CUN5_1["Generar reportes"]
    CUN5_2["Análisis de tendencias"]
    CUN5_3["Comparar con presupuesto"]
    CUN5_4["Exportar datos"]
    
    %% Premium
    CUN6["Procesar Suscripción Premium"]
    CUN6_1["Seleccionar plan"]
    CUN6_2["Procesar pago"]
    CUN6_3["Activar funcionalidades"]
    CUN6_4["Gestionar renovación"]
    
    %% IA
    CUN7["Asistir con IA"]
    CUN7_1["Interpretar comandos"]
    CUN7_2["Analizar patrones"]
    CUN7_3["Generar predicciones"]
    CUN7_4["Automatizar tareas"]
    
    User --> CUN5
    User --> CUN6
    User --> CUN7
    Group --> CUN5
    AI --> CUN7
    
    CUN5 --> CUN5_1
    CUN5 --> CUN5_2
    CUN5 --> CUN5_3
    CUN5 --> CUN5_4
    
    CUN6 --> CUN6_1
    CUN6 --> CUN6_2
    CUN6 --> CUN6_3
    CUN6 --> CUN6_4
    
    CUN7 --> CUN7_1
    CUN7 --> CUN7_2
    CUN7 --> CUN7_3
    CUN7 --> CUN7_4
    
    %% Dependencias
    CUN6 -.-> CUN7
```

#### Módulo de Soporte

```mermaid
graph TB
    User["👤 Usuario Final"]
    Group["👥 Grupo de Usuarios"]
    Admin["👨‍💼 Administrador/Soporte"]
    
    %% Soporte
    CUN8["Brindar Soporte al Usuario"]
    CUN8_1["Recibir consulta"]
    CUN8_2["Clasificar problema"]
    CUN8_3["Resolver consulta"]
    CUN8_4["Escalar problema"]
    CUN8_5["Seguimiento"]
    
    User --> CUN8
    Group --> CUN8
    Admin --> CUN8
    
    CUN8 --> CUN8_1
    CUN8 --> CUN8_2
    CUN8 --> CUN8_3
    CUN8 --> CUN8_4
    CUN8 --> CUN8_5
    
    %% Flujo de escalamiento
    CUN8_3 --> CUN8_4
    CUN8_4 --> CUN8_5
```

### Diagrama de Flujo de Actividades - Proceso Completo

```mermaid
flowchart TD
    Start(["Usuario inicia sesión"]) --> Dashboard["Panel Principal"]
    
    Dashboard --> Choice{"¿Qué desea hacer?"}
    
    %% Gastos Personales
    Choice -->|Gasto Individual| Personal["CUN1: Gestionar Gasto Personal"]
    Personal --> Register1["Registrar gasto"]
    Register1 --> Categorize1["Categorizar"]
    Categorize1 --> Track1["Seguimiento"]
    
    %% Gastos Grupales
    Choice -->|Gasto Compartido| Group["CUN2: Dividir Gasto Grupal"]
    Group --> Register2["Registrar gasto grupal"]
    Register2 --> Split["Distribuir entre miembros"]
    Split --> Notify["Notificar al grupo"]
    
    %% Comunicación
    Choice -->|Comunicarse| Chat["CUN3: Comunicar sobre Finanzas"]
    Chat --> Send["Enviar mensaje"]
    Send --> RealTime["Notificación en tiempo real"]
    
    %% Liquidación
    Notify --> Settlement["CUN4: Liquidar Deudas"]
    Settlement --> Initiate["Iniciar liquidación"]
    Initiate --> Confirm["Confirmar pago"]
    Confirm --> Optimize["Optimizar transacciones"]
    
    %% Análisis
    Track1 --> Analysis["CUN5: Analizar Patrones"]
    Optimize --> Analysis
    Analysis --> Reports["Generar reportes"]
    Reports --> Insights["Insights financieros"]
    
    %% Premium e IA
    Choice -->|Funcionalidades Premium| Premium["CUN6: Procesar Suscripción"]
    Premium --> Activate["Activar IA"]
    Activate --> AI["CUN7: Asistir con IA"]
    AI --> Automate["Automatizar tareas"]
    
    %% Soporte
    Choice -->|Problema/Soporte| Support["CUN8: Brindar Soporte"]
    Support --> Resolve["Resolver consulta"]
    
    %% Retorno al dashboard
    Insights --> Dashboard
    Automate --> Dashboard
    Resolve --> Dashboard
```

### Diagrama de Relaciones entre Actores

```mermaid
graph LR
    %% Actores principales
    User["👤 Usuario Final<br/>Registra gastos<br/>Gestiona grupos<br/>Analiza finanzas"]
    
    Group["👥 Grupo de Usuarios<br/>Participa en gastos<br/>Comunica sobre finanzas<br/>Confirma liquidaciones"]
    
    Admin["👨‍💼 Administrador<br/>Brinda soporte<br/>Resuelve disputas<br/>Gestiona plataforma"]
    
    AI["🤖 Sistema de IA<br/>Procesa comandos<br/>Analiza patrones<br/>Automatiza tareas"]
    
    Premium["💎 Suscripción Premium"]
    
    %% Relaciones
    User -.->|Interactúa con| Group
    User -.->|Solicita ayuda a| Admin
    User -.->|Consulta a| AI
    Group -.->|Escalación a| Admin
    AI -.->|Requiere| Premium
    
    %% Estilos
    classDef actor fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef system fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef premium fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    class User,Group,Admin actor
    class AI system
    class Premium premium
```

---

## Resumen de Correcciones Aplicadas

### Principales Mejoras Realizadas:

1. **Clarificación de Actores:**
   - Diferenciación clara entre Usuario Final individual y Grupo de Usuarios
   - Especificación de roles del Administrador/Soporte técnico
   - Definición del Sistema de IA como actor tecnológico

2. **Especificación de Procesos:**
   - Detallado de sub-procesos dentro de cada caso de uso
   - Clarificación de dependencias entre casos de uso
   - Especificación de flujos de trabajo

3. **Mejoras en Descripciones:**
   - Adición de detalles técnicos específicos (métodos de división, optimización de transacciones)
   - Clarificación de funcionalidades premium
   - Especificación de canales de comunicación y soporte

4. **Diagramas Comprehensivos:**
   - Diagrama principal del sistema completo
   - Diagramas modulares por funcionalidad
   - Flujo de actividades end-to-end
   - Relaciones entre actores

### Casos de Uso Validados contra el Esquema de Base de Datos:

✅ **CUN1 - CUN4:** Completamente soportados por el modelo de datos actual
✅ **CUN5:** Soportado por Budget, CustomCategory y relaciones de Expense
✅ **CUN6:** Requiere implementación de sistema de suscripciones (no presente en esquema actual)
✅ **CUN7:** Soportado por AIAction y funcionalidades de chat existentes
✅ **CUN8:** Requiere implementación de sistema de tickets/soporte (no presente en esquema actual)

### Recomendaciones para Implementación:

1. **Prioridad Alta:** CUN1-CUN5 (funcionalidades core ya implementadas)
2. **Prioridad Media:** CUN7 (requiere integración con OpenAI)
3. **Prioridad Baja:** CUN6 y CUN8 (requieren desarrollo de nuevos módulos)

### Consideraciones Técnicas:

- El sistema actual tiene una base sólida para los casos de uso principales
- Se requiere desarrollo adicional para funcionalidades premium y soporte
- La arquitectura de chat existente facilita la implementación del asistente de IA
- El modelo de liquidaciones está bien diseñado para optimización de transacciones

