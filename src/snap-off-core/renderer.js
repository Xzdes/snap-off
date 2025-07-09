// Файл: src/snap-off-core/renderer.js (ФИНАЛЬНАЯ ВЕРСИЯ)

import Handlebars from 'handlebars';
import { processStyles } from './style-engine.js';
import { createAndSaveState, getState } from './state-manager.js';

const templateCache = new Map();

function getCompiledTemplate(componentName, viewString) {
    if (templateCache.has(componentName)) return templateCache.get(componentName);
    const template = Handlebars.compile(viewString); // Убрали noEscape, будем использовать {{{...}}}
    templateCache.set(componentName, template);
    return template;
}

// --- renderComponent ---
export function renderComponent({ component, props, session }) {
    console.log(`[renderer] START RENDER: Component '${component.name}' with props:`, props);
    // ... (весь остальной код функции renderComponent) ...
    const { instanceId, initialState } = createAndSaveState(session, component, props);
    const { htmlAttributes, styles } = processStyles(props, component.style, instanceId);
    const inlineStylesString = Object.entries(styles.inline).map(([key, value]) => `${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${value}`).join(';');
    const inlineStyleAttr = inlineStylesString ? `style="${inlineStylesString}"` : '';
    const templateData = {
        props: htmlAttributes, state: initialState, meta: { id: instanceId, name: component.name, ...component.meta },
        styleAttr: inlineStyleAttr,
        styleTag: styles.dynamic ? `<style data-snap-id="${instanceId}">${styles.dynamic}</style>` : '',
    };
    const template = getCompiledTemplate(component.name, component.view);
    const html = template(templateData);
    console.log(`[renderer] END RENDER: Successfully generated HTML for new instance '${instanceId}'.`);
    return { html, instanceId };
}
// --- rerenderComponent ---
export function rerenderComponent({ component, instanceId, session }) {
    console.log(`[renderer] START RE-RENDER: Component '${component.name}', instance '${instanceId}'.`);
    // ... (весь остальной код функции rerenderComponent) ...
    const instanceData = getState(session, instanceId);
    if (!instanceData) {
        console.error(`[renderer] RE-RENDER FAILED: State not found for instance '${instanceId}'.`);
        return `<div style="border: 2px solid red; padding: 10px;">Error: Component state for ID ${instanceId} lost.</div>`;
    }
    const { styles } = processStyles({}, component.style, instanceId);
    const templateData = {
        props: {}, state: instanceData.state, meta: { id: instanceId, name: component.name, ...component.meta },
        styleAttr: '',
        styleTag: styles.dynamic ? `<style data-snap-id="${instanceId}">${styles.dynamic}</style>` : '',
    };
    const template = getCompiledTemplate(component.name, component.view);
    const html = template(templateData);
    console.log(`[renderer] END RE-RENDER: Successfully generated HTML for existing instance '${instanceId}'.`);
    return html;
}
