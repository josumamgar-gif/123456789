# Patrimonio — App de gestión personal

**Versión 1.4.0**

App móvil-first para gestión de patrimonio personal. React + Vite, datos en `localStorage`.

## Novedades v1.4.0

- Rediseño visual: hero degradado en Dashboard, nav con blur y animaciones
- Paleta refinada, sombras suaves y tipografía mejorada en toda la app

## Novedades v1.3.x

- **Carteras** banco y efectivo con historial de movimientos
- **Mes en 0€** hasta cobrar nómina y añadir efectivo
- **Día de cargo** en gastos fijos y deudas con cobro automático
- **Metas → Gastos**: el ahorro crea apuntes automáticos
- **Historial mensual**: cerrar mes y ver resúmenes anteriores
- Correcciones de saldos, cargos automáticos y cartera Sorare

Ver [CHANGELOG.md](./CHANGELOG.md) para el detalle completo.

## Estructura

| Pestaña | Contenido |
|---------|-----------|
| **Inicio** | Carteras, resumen, metas, gráfico de gastos, cripto, deudas |
| **Gastos** | Diario de gastos e ingresos por categoría (banco/efectivo) |
| **Metas** | Objetivos de ahorro con fecha límite y prioridad |
| **Sorare** | Cartas, ventas, premios ETH y carteras Cash/ETH |
| **Nómina** | Reparto de nómina, gastos fijos, deudas, cierre de mes |

## Instalación local

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## Build de producción

```bash
npm run build
npm run preview   # previsualizar dist/
```

## Despliegue en Vercel

### GitHub + Vercel (recomendado)

1. Repositorio: `https://github.com/josumamgar-gif/123456789`
2. Importar en [vercel.com/new](https://vercel.com/new)
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

Cada push a `main` despliega automáticamente si el proyecto está vinculado.

### Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

## Datos

Los datos se guardan en **localStorage** del navegador. Persisten entre sesiones en el mismo dispositivo. No hay sincronización entre dispositivos.

## Configuración

Edita `src/data/defaults.js` para nómina, gastos fijos, deudas y categorías iniciales. Una vez en uso, los datos de la app viven en localStorage.
