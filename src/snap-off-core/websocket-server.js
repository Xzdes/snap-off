// Файл: src/snap-off-core/websocket-server.js (ИСПРАВЛЕННАЯ ВЕРСИЯ)

import { WebSocketServer } from 'ws';

export function createSnapOffSocketServer({ server }) {
  const wss = new WebSocketServer({ server, path: '/_snap/ws' });

  wss.on('connection', (ws) => {
    console.log('[snap-off-ws] Client connected.');
    ws.on('close', () => console.log('[snap-off-ws] Client disconnected.'));
    ws.on('error', (error) => console.error('[snap-off-ws] Client error:', error));
  });

  wss.on('error', (error) => console.error('[snap-off-ws] Server error:', error));

  /**
   * Отправляет HTML-сообщение всем подключенным клиентам.
   * @param {object} messagePayload - Объект, содержащий HTML для отправки.
   */
  function broadcast(messagePayload) {
    if (!messagePayload || !messagePayload.html) {
      console.warn('[snap-off-ws] broadcast: message must be an object with an "html" key.');
      return;
    }
    
    // !!! КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Мы отправляем HTML напрямую !!!
    const messageString = messagePayload.html;

    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(messageString, (error) => {
          if (error) {
            console.error('[snap-off-ws] Failed to send message to a client:', error);
          }
        });
      }
    });
    
    console.log(`[snap-off-ws] Broadcasted HTML message to ${wss.clients.size} clients.`);
  }

  return {
    broadcast,
  };
}