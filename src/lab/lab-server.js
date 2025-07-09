// Файл: src/lab/lab-server.js
// Назначение: Сервер для запуска Dev Lab.

import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const PORT = 4000;
const app = express();
const COMPONENTS_PATH = path.resolve('./src/components');

/**
 * Находит все директории компонентов в указанном пути.
 * @returns {Promise<string[]>} - Массив с именами компонентов.
 */
async function findComponentNames() {
    const entries = await fs.readdir(COMPONENTS_PATH, { withFileTypes: true });
    return entries
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

// Главная страница лаборатории
app.get('/', async (req, res) => {
    try {
        const componentNames = await findComponentNames();
        
        const listItems = componentNames
            .map(name => `<li><a href="/component/${name}">${name}</a></li>`)
            .join('');

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Snap-Off Dev Lab</title>
                <style>
                    body { font-family: sans-serif; padding: 2em; }
                    ul { list-style: none; padding: 0; }
                    li a { display: block; padding: 0.5em; text-decoration: none; color: #007bff; }
                    li a:hover { background-color: #f0f0f0; }
                </style>
            </head>
            <body>
                <h1>Snap-Off Dev Lab</h1>
                <h2>Available Components:</h2>
                <ul>
                    ${listItems}
                </ul>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send(`<pre>Error: ${error.message}</pre>`);
    }
});

// Роут для отображения конкретного компонента (пока заглушка)
app.get('/component/:name', (req, res) => {
    res.send(`<h1>Component: ${req.params.name}</h1><p>Rendering will be implemented here.</p><a href="/">Back to list</a>`);
});


app.listen(PORT, () => {
    console.log(`🚀 Snap-Off Dev Lab is running at http://localhost:${PORT}`);
});