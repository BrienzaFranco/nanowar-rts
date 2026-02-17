# Guía para Publicar en Itch.io

## Opción 1: Singleplayer (Recomendada para Itch.io)

La versión más fácil de publicar es solo el modo Singleplayer, ya que Itch.io sirve archivos estáticos.

### Pasos:

1. **Build del juego:**
```bash
npm run build
```

2. **Preparar archivos para itch.io:**
Crear una carpeta `itch-upload/` con:
- `index.html` (modificado para singleplayer only)
- `dist/bundle.js`
- `favicon.ico` (opcional)
- Assets (si los hay)

3. **Modificar index.html para itch.io:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nano War 2</title>
    <style>
        body { 
            margin: 0; 
            background: #0a0a0f; 
            overflow: hidden; 
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        canvas { 
            display: block; 
            background: #0a0a0f;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <script src="dist/bundle.js"></script>
    <script>
        // Auto-iniciar modo singleplayer
        window.onload = function() {
            // Código para iniciar singleplayer automáticamente
            // o mostrar menú simplificado
        };
    </script>
</body>
</html>
```

4. **Crear ZIP:**
```bash
zip -r nano-war-2-itch.zip itch-upload/
```

5. **Subir a Itch.io:**
- Ve a https://itch.io/game/new
- Título: "Nano War 2"
- Classification: Games
- Kind: HTML
- Release: In development
- Pricing: $0 or donate
- Subir el ZIP
- Embed: "Embed in page"
- Viewport: 1280x720 (o el tamaño de tu canvas)
- ✅ Mobile friendly (opcional)
- ✅ Fullscreen button

---

## Opción 2: Multiplayer (Avanzado)

Para multiplayer necesitas hostear el servidor backend separadamente.

### Opciones de hosting para el backend:

1. **Render.com** (Gratis con sleep)
   - Crear web service
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: `NODE_ENV=production`

2. **Railway.app** (Gratis con límites)
   - Conectar repo de GitHub
   - Deploy automático

3. **Heroku** (Ya no tiene free tier)

### Configuración:

1. **Modificar el cliente para conectar al servidor:**
En `src/client/modes/MultiplayerController.js`:
```javascript
this.socket = io('https://tu-servidor-en-render.com'); // URL de tu servidor
```

2. **Variables de entorno en el servidor:**
Crear archivo `.env`:
```
PORT=3000
NODE_ENV=production
```

3. **CORS en server.js:**
```javascript
const io = new Server(httpServer, {
    cors: {
        origin: "https://itch.io", // o tu dominio
        methods: ["GET", "POST"]
    }
});
```

---

## Archivos Necesarios

### Estructura del ZIP para itch.io (Singleplayer):
```
nano-war-2.zip
├── index.html          (Modificado para itch)
├── dist/
│   └── bundle.js       (Build de webpack)
└── assets/             (Si tienes imágenes, sonidos, etc.)
    └── ...
```

### Estructura completa (desarrollo):
```
Nanowar/
├── public/
│   ├── index.html
│   └── dist/
│       └── bundle.js   ← Este archivo es el juego compilado
├── src/
│   ├── client/
│   ├── server/
│   └── shared/
├── server.js
├── package.json
└── webpack.config.js
```

---

## Build Script para Itch.io

Crear archivo `build-itch.sh` (Linux/Mac) o `build-itch.bat` (Windows):

### build-itch.sh:
```bash
#!/bin/bash

# Limpiar build anterior
rm -rf itch-upload
mkdir itch-upload

# Build webpack
npm run build

# Copiar archivos necesarios
cp public/index.html itch-upload/
cp -r public/dist itch-upload/
cp public/favicon.ico itch-upload/ 2>/dev/null || true

# Modificar index.html para itch.io (quitar referencias a servidor)
sed -i 's/<!-- Remove for itch -->.*<!-- End remove -->//g' itch-upload/index.html

# Crear ZIP
cd itch-upload
zip -r ../nano-war-2-itch.zip .
cd ..

echo "✅ Build completo: nano-war-2-itch.zip"
```

---

## Metadata para Itch.io

### Title:
**Nano War 2**

### Short description:
RTS de células con control táctico. Captura nodos, genera unidades y conquista el mapa.

### Description:
```
Nano War 2 es un juego de estrategia en tiempo real donde controlas células en un mundo microscópico.

**Características:**
- 🎮 Controla células individualmente
- 🏆 Captura nodos para producir más unidades
- ⚡ Buffs al capturar: producción aumentada
- 📊 Estadísticas en tiempo real
- 🎯 Modo singleplayer vs IA

**Controles:**
- Click + arrastrar: Seleccionar células
- Click derecho: Mover/Atacar
- T: Establecer punto de rally

**Tipos de nodos:**
- 🔵 Pequeños: 50 HP, spawn lento
- 🟢 Medianos: 100 HP, spawn medio  
- 🔴 Grandes: 180 HP, spawn rápido +50% producción

Desarrollado con JavaScript, Node.js y Socket.io.
```

### Genre:
Strategy

### Tags:
- rts
- strategy
- multiplayer
- singleplayer
- cells
- microscopic
- war
- nodes
- capture
- javascript

### Screenshots:
Necesitas capturas de pantalla del juego:
- screenshot1.png (Menú principal)
- screenshot2.png (Gameplay)
- screenshot3.png (Captura de nodo)

---

## Consideraciones Técnicas

### Canvas Size:
El juego usa un canvas que se adapta a la ventana. Para itch.io se recomienda:
- Width: 1280px
- Height: 720px
- O usar: 100% viewport para fullscreen

### Mobile:
El juego no está optimizado para touch, así que desactiva "Mobile friendly" o implementa controles táctiles.

### Sonido:
Los navegadores bloquean audio hasta que el usuario interactúe. Considera agregar un botón "Click to Start".

### Problemas comunes:
1. **CORS**: Si el juego no carga, revisa las políticas CORS del servidor
2. **WebSocket**: Itch.io puede tener problemas con WebSockets en embed
3. **Fullscreen**: Siempre habilita el botón de fullscreen

---

## Deploy Automático con Butler

Instalar butler: https://itch.io/docs/butler/

```bash
# Login
butler login

# Subir build
butler push itch-upload tu-usuario/nano-war-2:html5

# O subir ZIP
butler push nano-war-2-itch.zip tu-usuario/nano-war-2:html5
```

---

## Checklist Pre-Publicación

- [ ] Build funciona localmente
- [ ] Juego carga sin errores en consola
- [ ] Audio funciona después de click
- [ ] Controles responden bien
- [ ] Se ve bien en 1280x720
- [ ] Botón fullscreen funciona
- [ ] Capturas de pantalla agregadas
- [ ] Descripción completa
- [ ] Tags relevantes
- [ ] Precio establecido ($0)

---

## Recursos Adicionales

- [Itch.io Creator Guide](https://itch.io/docs/creators/)
- [Butler Documentation](https://itch.io/docs/butler/)
- [HTML5 Games on Itch](https://itch.io/docs/creators/html5-guide.html)

---

**Nota:** Esta guía asume que tienes el código fuente del juego. Si solo tienes el bundle.js, solo necesitas crear el index.html y subirlo a itch.io.