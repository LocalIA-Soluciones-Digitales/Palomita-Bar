# Print bridge — comanda automática de cocina

Servicio local (Node.js) que se queda escuchando los pedidos de Palomita Bar
en Supabase y, en cuanto entra uno nuevo, imprime automáticamente en la
impresora térmica de cocina (JASSWAY JAW-260H) **solo los productos de
comida** — nunca bebidas, esas se imprimen aparte y a mano desde
`/admin/mesas` en la impresora de barra.

Es un proceso aparte de la web (la web vive en Vercel y no puede hablar con
una impresora dentro de la red del bar). Este servicio se ejecuta en un
ordenador del propio local, conectado a la impresora de cocina.

## 1. Requisitos

- Node.js 18 o superior instalado en el PC/mini-PC de cocina.
- La impresora JAW-260H accesible desde ese PC, preferiblemente **por LAN**
  con IP fija (la interfaz de la etiqueta dice "USB & RS232 & LAN" — usa el
  puerto LAN, es mucho más fiable que USB para impresión en crudo ESC/POS).
  - Para asignarle una IP fija: normalmente estas impresoras traen un
    ejecutable de configuración de red (utilidad "LAN Cable / NetPrint
    Config" o similar) que se instala en Windows y detecta la impresora en
    la red para fijarle una IP dentro de tu rango local (ej. `192.168.1.50`)
    y el puerto estándar `9100`.
  - Alternativa por USB (Windows): instala la impresora como impresora
    normal de Windows (driver "Generic / Text Only" o el que traiga el
    fabricante), y usa como interfaz `printer:<Nombre exacto en Windows>`.
- Una cuenta de acceso a `/admin` dedicada a este servicio (recomendado:
  crear una específica, no reutilizar la personal, así se puede revocar sin
  afectar a nadie).

## 2. Instalación

```bash
cd print-bridge
npm install
cp .env.example .env
```

Rellena `.env`:
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`: los mismos valores que
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el
  `.env.local` de la web.
- `BRIDGE_EMAIL` / `BRIDGE_PASSWORD`: la cuenta de acceso a `/admin` de este
  servicio.
- `PRINTER_INTERFACE`: `tcp://<ip-impresora>:9100` (recomendado) o
  `printer:<nombre en Windows>` si vas por USB.

## 3. Arrancar

```bash
npm start
```

Deja este proceso corriendo. En consola verás cada comanda impresa:

```
[OK] Comanda impresa · pedido 3fa2... · mesa 4
```

Al arrancar, el servicio marca como "ya vistos" los pedidos que ya estuvieran
en cola en ese momento (no los reimprime); solo imprime lo que llegue **a
partir de ese momento**, tanto si el pedido lo mete el encargado a mano en
`/admin/mesas` o `PedidoRapidoForm` como si lo hace un cliente desde
`/pedir` (gestión online).

## 4. Dejarlo funcionando siempre (arranque con Windows)

Para que no dependa de tener una ventana de consola abierta y sobreviva a
reinicios del PC, la forma más sencilla es con [NSSM](https://nssm.cc/):

```powershell
nssm install PalomitaPrintBridge "C:\Program Files\nodejs\node.exe" "C:\ruta\a\print-bridge\src\index.js"
nssm set PalomitaPrintBridge AppDirectory "C:\ruta\a\print-bridge"
nssm start PalomitaPrintBridge
```

Esto lo registra como servicio de Windows: arranca solo al encender el PC y
se reinicia si falla.

## 5. Solución de problemas

- **"No se pudo confirmar la conexión con la impresora"**: revisa que la IP
  y el puerto en `PRINTER_INTERFACE` sean correctos y que el PC y la
  impresora estén en la misma red. Prueba a hacer ping a la IP de la
  impresora.
- **Imprime caracteres raros / no corta el papel**: prueba cambiando
  `type: PrinterTypes.EPSON` por `PrinterTypes.STAR` en `src/index.js` —
  algunas impresoras genéricas responden mejor a uno u otro set de comandos.
- **No imprime nada al hacer un pedido**: comprueba en la consola que el
  canal Realtime dice `SUBSCRIBED`. Si no, revisa `BRIDGE_EMAIL` /
  `BRIDGE_PASSWORD` y que esa cuenta tenga acceso a `/admin` de Palomita.
