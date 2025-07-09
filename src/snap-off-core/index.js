// Файл: src/snap-off-core/index.js
// Назначение: Главный файл ядра. Собирает все модули вместе и предоставляет публичный API.

import path from 'path';
import { createComponentLoader } from './component-loader.js';
import { renderComponent } from './renderer.js';
import { createEventHandlerMiddleware } from './event-handler.js';
// Экспортируем функцию для сокетов отдельно, так как она требует 'http.Server'
export { createSnapOffSocketServer } from './websocket-server.js';

/**
 * Инициализирует и возвращает все необходимые для работы движка `snap-off` компоненты.
 * Это главная "фабрика" фреймворка.
 * @param {object} config - Объект конфигурации.
 * @param {string} config.componentsPath - Обязательный путь к директории с компонентами.
 * @returns {{
 *   render: function,
 *   middleware: function
 * }} - Объект с готовыми к использованию функцией рендеринга и middleware для Express.
 */
export function createSnapOff(config) {
  if (!config || !config.componentsPath) {
    throw new Error('[snap-off] Configuration error: `componentsPath` is required.');
  }

  // --- 1. Инициализация модулей ядра ---

  // Абсолютный путь к компонентам для надежности
  const absoluteComponentsPath = path.resolve(config.componentsPath);

  // Создаем единый экземпляр загрузчика компонентов.
  // Все остальные части ядра будут использовать его.
  const getComponent = createComponentLoader(absoluteComponentsPath);

  // Создаем middleware для обработки событий.
  // Оно "замыкает" в себе функцию getComponent.
  const eventHandlerMiddleware = createEventHandlerMiddleware({ getComponent });


  // --- 2. Создание публичного API ---

  /**
   * Публичная функция для рендеринга компонента.
   * Обертка над внутренним рендерером для удобства использования.
   * @param {string} componentName - Имя компонента для рендеринга.
   * @param {object} props - Пропсы для компонента.
   * @param {import('express').Request} req - Объект запроса Express для доступа к сессии.
   * @returns {Promise<string>} - Промис, который разрешается в HTML-строку компонента.
   */
  async function render(componentName, props = {}, req) {
    if (!req || !req.session) {
      throw new Error(`[snap-off] 'req' object with a 'session' property must be provided to render().`);
    }
    try {
      // Получаем определение компонента
      const component = await getComponent(componentName);

      // Вызываем внутренний рендерер
      const { html } = renderComponent({
        component,
        props,
        session: req.session,
      });

      return html;

    } catch (error) {
      console.error(`[snap-off] Failed to render component "${componentName}":`, error);
      // Возвращаем HTML с ошибкой, чтобы было наглядно при разработке.
      return `<div style="color: red; border: 2px solid red; padding: 1em;">
                <strong>Snap-off Render Error:</strong><br>
                Component: <strong>${componentName}</strong><br>
                <pre>${error.message}</pre>
              </div>`;
    }
  }

  // --- 3. Возвращение API ---

  console.log('[snap-off] Core initialized successfully.');

  return {
    /**
     * Рендерит компонент в HTML-строку.
     * @type {render}
     */
    render,

    /**
     * Express middleware для обработки HTMX-событий.
     * Подключается к Express через `app.use('/_snap/event', snap.middleware)`.
     */
    middleware: eventHandlerMiddleware,
  };
}