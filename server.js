// Файл: server.js (ФИНАЛЬНАЯ ВЕРСИЯ - ПОБЕДА)

import express from 'express';
import session from 'express-session';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createSnapOff, createSnapOffSocketServer } from './src/snap-off-core/index.js';

// --- 0. Конфигурация ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;
const app = express();
const server = http.createServer(app);

// --- 1. Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'a-very-strong-and-secret-key-for-session-change-it',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// --- 2. Инициализация Snap-Off ---
const snap = createSnapOff({ componentsPath: './src/components' });
const snapSockets = createSnapOffSocketServer({ server });

// --- 3. Роуты ---
app.post('/_snap/event/:instanceId/:eventName', snap.middleware);

app.get('/', async (req, res) => {
  const counterHtml = await snap.render('counter', { initialValue: 10 }, req);
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Snap-Off: ПОБЕДА!</title>
      <script src="/htmx.min.js"></script>
      <script src="/ws.js"></script>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 2em; }
        .success-box { background-color: #28a745; color: white; border: 1px solid #1e7e34; padding: 1rem; margin-top: 1rem; border-radius: 0.25rem; text-align: center; font-size: 1.2rem; }
        button { font-size: 1rem; padding: 0.5em 1em; cursor: pointer; }
      </style>
    </head>
    <body hx-ext="ws" ws-connect="/_snap/ws">
      <h1>✅ Snap-Off: Система Работает</h1>
      ${counterHtml}
      <hr style="margin: 2em 0;">
      <h2>Тест WebSocket:</h2>
      
      <!-- Этот div просто ждет, чтобы его заменили -->
      <div id="server-messages" ws-swap="message" style="min-height: 60px;">
         Ожидание сообщения от сервера...
      </div>
      
      <button onclick="fetch('/broadcast-time', { method: 'POST' })" style="margin-top: 1rem;">Broadcast Time</button>
    </body>
    </html>
  `);
});

// Тестовый роут, который инициирует WebSocket-событие
app.post('/broadcast-time', (req, res) => {
    console.log('[server] POST /broadcast-time: Формируем и отправляем HTML по WebSocket...');
    
    // !!! ВОТ ОНО, РЕШЕНИЕ !!!
    // Мы создаем HTML, который будет отправлен напрямую.
    const htmlMessage = `
        <div id="server-messages" ws-swap="message" class="success-box">
            <strong>ПОБЕДА!</strong> Ответ от сервера получен в: <strong>${new Date().toLocaleTimeString()}</strong>
        </div>
    `;
    
    // И отправляем его в правильном формате: { html: '...' }
    snapSockets.broadcast({ html: htmlMessage });
    
    res.status(200).send('Event broadcasted!');
});

// --- 4. Запуск Сервера ---
server.listen(PORT, () => {
    console.log('------------------------------------------');
    console.log(`🚀 Сервер Snap-Off запущен и работает!`);
    console.log(`✅ Откройте в браузере: http://localhost:${PORT}`);
    console.log('------------------------------------------');
});