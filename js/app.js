(function () {
  'use strict';

  const data = window.NAVIGATOR_DATA || {};
  const modules = Array.isArray(data.modules) ? data.modules : [];
  const tools = Array.isArray(data.tools) ? data.tools : [];
  const examples = Array.isArray(data.examples) ? data.examples : [];
  const app = document.getElementById('app');

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function routeUrl(page, id) {
    const params = new URLSearchParams();
    params.set('page', page);
    if (id) params.set('id', id);
    return 'index.html?' + params.toString();
  }

  function findById(items, id) {
    return items.find(function (item) { return item && String(item.id) === String(id); });
  }

  function safeExternalUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
    } catch (_) {
      return '';
    }
  }

  function safeResourceUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) return safeExternalUrl(trimmed);
    // Разрешаем локальные относительные пути, но не протоколы, protocol-relative URL и javascript:.
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) return '';
    return trimmed;
  }

  function setTitle(title) {
    document.title = title ? title + ' — Цифровой навигатор учителя' : 'Цифровой навигатор учителя';
  }

  function breadcrumbs(items) {
    return '<nav class="breadcrumbs" aria-label="Навигационная цепочка">' +
      items.map(function (item, index) {
        const part = item.href
          ? '<a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + '</a>'
          : '<span class="breadcrumb-current" aria-current="page">' + escapeHtml(item.label) + '</span>';
        return (index ? '<span class="breadcrumb-separator" aria-hidden="true">›</span>' : '') + part;
      }).join('') + '</nav>';
  }

  function emptyState(message) {
    return '<div class="empty-state"><p>' + escapeHtml(message) + '</p></div>';
  }

  function descriptionOrEmpty(value, message) {
    if (typeof value === 'string' && value.trim()) return '<p class="card-description">' + escapeHtml(value) + '</p>';
    return '<p class="card-description">' + escapeHtml(message) + '</p>';
  }

  function renderHome() {
    setTitle('Главная');
    const cards = modules.map(function (module) {
      if (!module || !module.id || !module.name) return '';
      return '<a class="card" href="' + escapeHtml(routeUrl('module', module.id)) + '">' +
        '<h2 class="card-title">' + escapeHtml(module.name) + '</h2>' +
        descriptionOrEmpty(module.description, 'Описание пока не добавлено.') +
        '<span class="card-arrow" aria-hidden="true">→</span>' +
      '</a>';
    }).filter(Boolean).join('');

    app.innerHTML = '<section class="page-intro">' +
      '<h1 class="page-heading">Цифровой навигатор учителя</h1>' +
      '<p class="page-description">Выберите педагогическую задачу и найдите подходящие цифровые инструменты для её решения.</p>' +
      '</section>' +
      '<section aria-labelledby="modules-heading">' +
      '<h2 class="section-heading" id="modules-heading">Модули</h2>' +
      (cards ? '<div class="card-grid">' + cards + '</div>' : emptyState('Модули пока не добавлены.')) +
      '</section>';
  }

  function renderModule(module) {
    setTitle(module.name);
    const moduleTools = tools.filter(function (tool) {
      return tool && String(tool.moduleId) === String(module.id) && tool.id && tool.name;
    });
   
    
    const cards = moduleTools.map(function (tool) {
      return '<a class="card" href="' + escapeHtml(routeUrl('tool', tool.id)) + '">' +
        '<div class="card-header">' +
          '<span class="card-icon" aria-hidden="true">' +
            tool.logo +
          '</span>' +
          '<h2 class="card-title">' + escapeHtml(tool.name) + '</h2>' +
        '</div>' +
        descriptionOrEmpty(tool.description, 'Описание пока не добавлено.') +
        '<span class="card-arrow" aria-hidden="true">→</span>' +
      '</a>';
    }).join('');


    app.innerHTML = breadcrumbs([
      { label: 'Главная', href: 'index.html' },
      { label: module.name }
    ]) +
    '<section class="page-intro">' +
      '<h1 class="page-heading">' + escapeHtml(module.name) + '</h1>' +
      (module.description && String(module.description).trim()
        ? '<p class="page-description">' + escapeHtml(module.description) + '</p>'
        : '<p class="page-description">Описание пока не добавлено.</p>') +
    '</section>' +
    '<section aria-labelledby="tools-heading">' +
      '<h2 class="section-heading" id="tools-heading">Цифровые инструменты</h2>' +
      (cards ? '<div class="card-grid">' + cards + '</div>' : emptyState('В этом модуле пока нет инструментов.')) +
    '</section>' +
    '<a class="back-link" href="index.html"><span aria-hidden="true">←</span> На главную</a>';
  }

  function renderSteps(steps) {
    const validSteps = Array.isArray(steps) ? steps.filter(function (step) {
      return step && (String(step.title || '').trim() || String(step.description || '').trim());
    }) : [];
    if (!validSteps.length) return '<p class="section-empty">Инструкция пока не добавлена.</p>';
    return '<ol class="steps-list">' + validSteps.map(function (step, index) {
      const title = String(step.title || '').trim();
      const description = String(step.description || '').trim();
      return '<li class="step-item">' +
        '<div class="step-content">' +
          '<h3 class="step-heading">' + escapeHtml(step.title) + '</h3>' +
          '<p class="step-description">' + escapeHtml(step.description) + '</p>' +
        '</div>' +
      '</li>';
    }).join('') + '</ol>';
  }

  function renderExamples(tool) {
    const toolExamples = examples.filter(function (example) {
      return example && String(example.toolId) === String(tool.id) && (example.title || example.description || example.url);
    });
    if (!toolExamples.length) return '<p class="section-empty">Примеры и материалы пока не добавлены.</p>';
    return '<ul class="examples-list">' + toolExamples.map(function (example) {
      const title = String(example.title || 'Материал').trim();
      const description = String(example.description || '').trim();
      const type = String(example.type || '').trim();
      const url = safeResourceUrl(example.url);
      return '<li class="example-item">' +
        '<h3 class="example-title">' + escapeHtml(title) + '</h3>' +
        (description ? '<p class="example-description">' + escapeHtml(description) + '</p>' : '') +
        (type ? '<span class="example-meta">' + escapeHtml(type) + '</span>' : '') +
        (url ? '<a class="example-link" href="' + escapeHtml(url) + '"' + (/^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>Открыть материал ↗</a>' : '') +
      '</li>';
    }).join('') + '</ul>';
  }

  function renderTool(tool) {
    const module = findById(modules, tool.moduleId);
    if (!module) return renderNotFound();
    setTitle(tool.name);

    const title = escapeHtml(tool.name);
    const tasks = tool.pedagogicalTasks && String(tool.pedagogicalTasks).trim() ? (() => {
      const lines = String(tool.pedagogicalTasks)
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

      const intro = lines.find(line => !line.startsWith('-'));
      const items = lines
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s*/, ''));

      return '<div class="section-copy">' +
        (intro ? '<p>' + escapeHtml(intro) + '</p>' : '') +
        (items.length
          ? '<ul>' + items.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>'
          : '') +
        '</div>';
    })() : '<p class="section-empty">Педагогические задачи пока не добавлены.</p>';
    const officialUrl = safeExternalUrl(tool.officialUrl);
    const officialLink = officialUrl
      ? '<a class="external-link" href="' + escapeHtml(officialUrl) + '" target="_blank" rel="noopener noreferrer">Перейти к инструменту <span aria-hidden="true">↗</span></a>'
      : '<p class="section-empty">Ссылка на платформу пока не добавлена.</p>';
    
    const check = tool.resultCheck && String(tool.resultCheck).trim() ? (() => {
      const lines = String(tool.resultCheck)
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

      const intro = lines.find(line => !line.startsWith('-'));
      const items = lines
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s*/, ''));

      return '<div class="section-copy">' +
          '<p>' + (tool.resultCheckBefore || " ") + '</p>' +
        (intro ? '<p>' + escapeHtml(intro) + '</p>' : '') +
        (items.length
          ? '<ul>' + items.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>'
          : '') +
          '<p>' + (tool.resultCheckAfter || " ") + '</p>' +
        '</div>';
    })() : '<p class="section-empty">Рекомендации по проверке результата пока не добавлены.</p>';


    app.innerHTML = breadcrumbs([
      { label: 'Главная', href: 'index.html' },
      { label: module.name, href: routeUrl('module', module.id) },
      { label: tool.name }
    ]) +
    '<section class="page-intro">' +
      '<h1 class="page-heading">' + title + '</h1>' +
    '</section>' +
    '<div class="tool-content">' +
      '<section class="tool-section" aria-labelledby="tool-name-heading">' +
        '<h2 id="tool-name-heading">1. Название платформы</h2>' +
        (tool.description2 && String(tool.description2).trim()
          ? '<p class="section-copy">' + escapeHtml(tool.description2) + '</p>'
          : '<p class="section-empty">Описание инструмента пока не добавлено.</p>') +
      '</section>' +
      '<section class="tool-section" aria-labelledby="tasks-heading">' +
        '<h2 id="tasks-heading">2. Педагогические задачи</h2>' + tasks +
      '</section>' +
      '<section class="tool-section" aria-labelledby="official-heading">' +
        '<h2 id="official-heading">3. Ссылка на платформу</h2>' + officialLink +
      '</section>' +
      '<section class="tool-section" aria-labelledby="steps-heading">' +
        '<h2 id="steps-heading">4. Алгоритм действий</h2>' + renderSteps(tool.steps) +
      '</section>' +
      '<section class="tool-section" aria-labelledby="check-heading">' +
        '<h2 id="check-heading">5. Проверка и оценка результата</h2>' + check +
      '</section>' +
      '<section class="tool-section" aria-labelledby="examples-heading">' +
        '<h2 id="examples-heading">6. Примеры и готовые материалы</h2>' + renderExamples(tool) +
      '</section>' +
    '</div>' +
    '<a class="back-link" href="' + escapeHtml(routeUrl('module', module.id)) + '"><span aria-hidden="true">←</span> К модулю «' + escapeHtml(module.name) + '»</a>';
  }

  function renderNotFound() {
    setTitle('Страница не найдена');
    app.innerHTML = '<section class="not-found">' +
      '<p class="not-found-code">Ошибка 404</p>' +
      '<h1 class="page-heading">Страница не найдена</h1>' +
      '<p class="page-description">Возможно, ссылка устарела или такая страница ещё не создана.</p>' +
      '<a class="back-link" href="index.html"><span aria-hidden="true">←</span> Вернуться на главную</a>' +
    '</section>';
  }

  function start() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || 'home';
    const id = params.get('id');

    if (page === 'home' && !id) {
      renderHome();
      return;
    }
    if (page === 'module' && id) {
      const module = findById(modules, id);
      if (module && module.name) renderModule(module);
      else renderNotFound();
      return;
    }
    if (page === 'tool' && id) {
      const tool = findById(tools, id);
      if (tool && tool.name) renderTool(tool);
      else renderNotFound();
      return;
    }
    renderNotFound();
  }

  start();
}());
