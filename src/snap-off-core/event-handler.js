// Файл: src/snap-off-core/event-handler.js
// Назначение: Middleware для Express, обрабатывающий события от HTMX.

import { getState, updateState } from './state-manager.js';
import { rerenderComponent } from './renderer.js';

/**
 * Создает middleware для обработки событий от компонентов snap-off.
 * @param {object} options
 * @param {function} options.getComponent - Функция для получения определения компонента (из component-loader).
 * @returns {function} - Express middleware.
 */
export function createEventHandlerMiddleware({ getComponent }) {
  return async (req, res, next) => {
    const { instanceId, eventName } = req.params;
    if (!instanceId || !eventName) return next();

    console.log(`\n--- [event-handler] INCOMING EVENT ---`);
    console.log(`[event-handler] Instance: '${instanceId}', Event: '${eventName}', Payload:`, req.body);
    
    try {
      const instanceData = getState(req.session, instanceId);
      if (!instanceData) {
        return res.status(404).send(`Error: Component instance '${instanceId}' not found.`);
      }
      const { componentName, state: currentState } = instanceData;
      
      const component = await getComponent(componentName);
      if (!component) {
        return res.status(404).send(`Error: Component definition for '${componentName}' not found.`);
      }
      
      const eventHandler = component.handler.events[eventName];
      if (typeof eventHandler !== 'function') {
        return res.status(400).send(`Error: Event '${eventName}' not defined for component '${componentName}'.`);
      }

      console.log(`[event-handler] Executing event handler for '${eventName}'...`);
      const newState = eventHandler(currentState, req.body);
      
      updateState(req.session, instanceId, newState);
      
      const newHtml = rerenderComponent({ component, instanceId, session: req.session });
      
      console.log(`[event-handler] SUCCESS: Responding with new HTML.`);
      console.log(`--- [event-handler] EVENT PROCESSED ---\n`);
      res.status(200).send(newHtml);
    } catch (error) {
      console.error(`[event-handler] FATAL ERROR:`, error);
      res.status(500).send(`Server error while processing event.`);
    }
  };
}