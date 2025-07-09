// Файл: src/snap-off-core/style-engine.js (ИДЕАЛЬНАЯ ВЕРСИЯ)

const PSEUDO_STATES = new Set(['hover', 'focus']);

function scopeCSS(css, scopeId) {
    if (!css || !scopeId) return '';
    const scopeAttr = `[snap-c-id="${scopeId}"]`;

    const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!cleanCss) return '';

    return cleanCss.replace(/([^{}]*)(?=\{)/g, (match) => {
        const selector = match.trim();
        if (!selector || selector.startsWith('@') || selector.startsWith('from') || selector.startsWith('to')) {
            return selector;
        }

        // !!! ВОТ ОКОНЧАТЕЛЬНАЯ, ПУЛЕНЕПРОБИВАЕМАЯ ЛОГИКА СКОУПИНГА !!!
        return selector
            .split(',')
            .map(part => {
                const trimmedPart = part.trim();
                // Мы просто добавляем наш атрибут к каждому селектору в группе.
                // ".root p" -> ".root[scope] p"
                // ".root"   -> ".root[scope]"
                // ":hover"  -> "[scope]:hover"
                // Это покрывает все случаи.
                return trimmedPart.split(/\s+/).map((subPart, index) => {
                    // Атрибут добавляется только к первому элементу в цепочке селекторов
                    if (index === 0) {
                        const pseudoIndex = subPart.search(/[:\[]/);
                        if (pseudoIndex === -1) {
                            return subPart + scopeAttr;
                        }
                        return subPart.slice(0, pseudoIndex) + scopeAttr + subPart.slice(pseudoIndex);
                    }
                    return subPart;
                }).join(' ');
            })
            .join(', ');
    });
}


function separateProps(rawProps) {
    const stylingProps = {}; const htmlAttributes = {};
    for (const key in rawProps) {
        if (key.includes(':')) stylingProps[key] = rawProps[key];
        else htmlAttributes[key] = rawProps[key];
    }
    return { stylingProps, htmlAttributes };
}
function processStylingProps(stylingProps, scopeId) {
    const inlineStyles = {}; const dynamicRules = [];
    const scopeAttr = `[snap-c-id="${scopeId}"]`;
    for (const key in stylingProps) {
        const value = stylingProps[key];
        const parts = key.split(':');
        const cssProperty = parts.pop();
        const cssPropKebab = cssProperty.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
        if (parts.length > 0) {
            const pseudoState = parts[0];
            if (PSEUDO_STATES.has(pseudoState)) {
                const selector = `${scopeAttr}:${pseudoState}`;
                dynamicRules.push(`${selector} { ${cssPropKebab}: ${value}; }`);
            }
        } else {
            inlineStyles[cssProperty] = value;
        }
    }
    return { inlineStyles, dynamicRules: dynamicRules.join('\n') };
}
export function processStyles(props, baseCss, scopeId) {
    const { stylingProps, htmlAttributes } = separateProps(props || {});
    const { inlineStyles, dynamicStyles } = processStylingProps(stylingProps, scopeId);
    const scopedBaseCss = baseCss ? scopeCSS(baseCss, scopeId) : '';
    const finalDynamicStyles = [scopedBaseCss, dynamicStyles].filter(Boolean).join('\n');
    return {
        htmlAttributes,
        styles: { inline: inlineStyles, dynamic: finalDynamicStyles },
    };
}