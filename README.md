# Ética Millonaria — multijugador

Juego en tiempo real tipo "¿Quién quiere ser millonario?" para una actividad de ética aplicada e integridad científica en la industria farmacéutica.

## Incluye

- Código de sala de 6 dígitos.
- Registro de jugadores en el momento desde celular/computador.
- Hasta 120 participantes por sala.
- 15 preguntas: 5 conceptos + 10 casos de industria farmacéutica.
- Temporizador por pregunta.
- Puntaje por precisión + rapidez.
- Ranking en tiempo real.
- Reconexión básica de anfitrión y participantes usando `sessionStorage`.
- Revelado de respuesta con explicación.
- Reinicio de partida conservando la sala.

## Stack

- Node.js
- Express
- Socket.IO
- HTML/CSS/JavaScript sin framework de frontend

## Ejecutar localmente

```bash
npm install
npm start
```

Abre `http://localhost:3000`.

## Desplegar en Render

1. Sube este proyecto a un repositorio de GitHub.
2. En Render: **New > Web Service**.
3. Conecta el repositorio.
4. Build command: `npm install`
5. Start command: `npm start`
6. Health check: `/health`

También puedes usar el `render.yaml` incluido.

## Nota sobre persistencia

Esta versión guarda las salas en memoria. Si Render reinicia el proceso, las salas activas desaparecen. Para una actividad de clase con una sola instancia funciona bien. Para producción, varias instancias o recuperación completa después de reinicios, conviene añadir Redis.


## Música y efectos
La pantalla del anfitrión incluye una banda sonora de suspenso original generada en el navegador con Web Audio. Se activa con el botón `Activar música` o al pulsar `Comenzar juego`.

Por restricciones normales de los navegadores, el audio necesita una interacción del usuario antes de empezar. Se recomienda reproducir la música solo en el equipo del anfitrión/proyector para evitar que todos los teléfonos suenen a la vez.

Si tienes permiso para usar una grabación concreta de un programa, puedes sustituir el sistema de audio por tus archivos locales; el proyecto no incluye grabaciones comerciales con copyright.
