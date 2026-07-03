# Changelog

## [1.4.0] — 2026-06-11

### Diseño
- Rediseño visual completo: paleta refinada, sombras suaves y fondo con degradado sutil
- Hero del Dashboard con degradado azul-violeta y total del mes destacado
- Carteras Banco/Efectivo como paneles de cristal dentro del hero
- Navegación inferior con efecto blur (cristal) y píldora en pestaña activa
- Animaciones de entrada en páginas y modales
- Botones con degradado, inputs con anillo de enfoque y barras de progreso mejoradas

## [1.3.3] — 2026-06-11

### Funcionalidades
- Metas vinculadas a Gastos: al ahorrar se crea apunte automático (categoría Metas)
- Primer ahorro opcional al crear una meta con selector banco/efectivo
- Dashboard: Disponible = saldo banco; nueva tarjeta Total (banco + efectivo)

### Correcciones
- Saldos de cartera con actualización funcional (varios movimientos seguidos)
- Cargos automáticos no se recrean al borrarlos (`autoChargesDismissed`)
- Sincronización de metas al editar/borrar transacciones y movimientos de cartera
- Préstamos pagados dejan de generar cuotas automáticas
- Sorare: devolver carta vendida y editar precio ajustan la cartera Cash
- Sorare: editar/eliminar premios ajustan saldo ETH y movimientos
- Migración contable v1→v2 limpia movimientos al resetear saldos
- `useLocalStorage` con actualizaciones funcionales correctas

## [1.3.2] — 2026-06-11

### Funcionalidades
- Día de cargo (1–31) en gastos fijos y deudas
- Cobro automático el día indicado (`processAutoCharges`)
- Obligaciones mensuales solo cuentan tras pasar el día de cargo

## [1.3.1] — 2026-06-11

### Funcionalidades
- Cada mes empieza en 0€ hasta cobrar nómina y añadir efectivo
- `paycheckMonth` evita duplicar nómina sin confirmación

## [1.3.0] — 2026-06-11

### Funcionalidades
- Carteras separadas: banco y efectivo con historial de movimientos
- Método de pago en gastos (banco / efectivo)
- Botones + Nómina y + Efectivo en Dashboard
- Historial mensual: cerrar mes, reiniciar y ver meses anteriores
- Metas de ahorro en Dashboard (hasta 4 activas)
- Favicon y manifest PWA actualizados
