// Файл: src/snap-off-core/component-loader.js (САМЫЙ НАДЕЖНЫЙ КЭШ)

import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';

// Глобальный кэш компонентов. Он будет жить, пока жив сервер.
const componentCache = new Map();

async function loadComponentDefinition(componentName, componentsBasePath) {
    const componentPath = path.join(componentsBasePath, componentName);
    // ... остальная часть функции без изменений
    const filePaths = {
        meta: path.join(componentPath, 'component.json'),
        handler: path.join(componentPath, 'handler.js'),
        view: path.join(componentPath, 'view.html'),
        style: path.join(componentPath, 'style.css'),
    };
    try {
        const metaContent = await fs.readFile(filePaths.meta, 'utf-8');
        const meta = JSON.parse(metaContent);
        const handlerModule = await import(pathToFileURL(filePaths.handler).href);
        const handler = {
            createState: handlerModule.createState,
            events: handlerModule.events || {},
        };
        const view = await fs.readFile(filePaths.view, 'utf-8');
        const style = await fs.readFile(filePaths.style, 'utf-8').catch(() => null);
        
        console.log(`[snap-off-loader] SUCCESS: Component "${componentName}" loaded from disk and cached.`);
        return { name: componentName, meta, handler, view, style };
    } catch (error) {
        throw new Error(`Error processing component "${componentName}": ${error.message}`);
    }
}

export function createComponentLoader(componentsBasePath) {
    console.log(`[snap-off] Component loader initialized. Path: ${componentsBasePath}`);
    return async function getComponent(componentName) {
        if (componentCache.has(componentName)) {
            console.log(`[snap-off-loader] CACHE HIT: Returning cached version of "${componentName}".`);
            return componentCache.get(componentName);
        }
        
        console.log(`[snap-off-loader] CACHE MISS: Loading "${componentName}" from disk.`);
        const componentDefinition = await loadComponentDefinition(componentName, componentsBasePath);
        componentCache.set(componentName, componentDefinition);
        return componentDefinition;
    };
}