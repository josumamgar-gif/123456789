# Patrimonio — App de gestión personal

**Versión 1.1**

App móvil-first para gestión de patrimonio personal. React + Vite, datos en localStorage.

### Novedades v1.1 (Sorare)
- Carteras Cash y ETH con botón para añadir fondos
- Al comprar carta: elegir pago (Cash Sorare, ETH o Apple Pay)
- Pestaña Movimientos con historial completo del balance
- Galería de cartas agrupada por rareza (Limited, Rare, Super Rare, Única)

## Estructura

- **Inicio** — Dashboard con resumen cripto, cuenta vivienda, deudas, gráfico de gasto
- **Gastos** — Diario de gastos e ingresos extra por categoría
- **Metas** — Objetivos de ahorro con fecha límite y prioridad 1-5
- **Sorare** — Gestión de cartas, ventas, premios y balance
- **Nómina** — Reparto recomendado de la nómina, gastos fijos, histórico

## Instalación local

```bash
npm install
npm run dev
```

## Despliegue en Vercel

### Opción 1 — Vercel CLI
```bash
npm install -g vercel
vercel
```

### Opción 2 — GitHub + Vercel (recomendado)
1. Sube el proyecto a un repositorio GitHub privado
2. Ve a https://vercel.com/new
3. Importa el repositorio
4. Framework preset: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`
7. Deploy

Los datos se guardan en **localStorage** del navegador, así que persisten entre sesiones en el mismo dispositivo. Si quieres sincronizar entre dispositivos en el futuro, el siguiente paso sería añadir Supabase o Firebase.

## Actualizar préstamo
En `src/data/defaults.js` puedes editar `DEBTS_DEFAULT` para ajustar el progreso del préstamo. Una vez desplegado, los datos que introduces en la app se guardan en localStorage y no dependen de los defaults.
