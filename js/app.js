(function () {
  'use strict';

  const data = window.NAVIGATOR_DATA || {};
  const modules = Array.isArray(data.modules) ? data.modules : [];
  const tools = Array.isArray(data.tools) ? data.tools : [];
  const examples = Array.isArray(data.examples) ? data.examples : [];
  const app = document.getElementById('app');
  const DEFAULT_LANGUAGE = "kk";

  function getLanguage() {
    const savedLanguage = localStorage.getItem("navigator-language");

    return savedLanguage === "ru" || savedLanguage === "kk"
      ? savedLanguage
      : DEFAULT_LANGUAGE;
  }

  let currentLanguage = getLanguage();

  function setLanguage(language) {
    if (language !== "kk" && language !== "ru") {
      return;
    }

    currentLanguage = language;
    localStorage.setItem("navigator-language", language);
    window.location.reload();
  }

  function getLocalizedText(item, field) {
    if (currentLanguage === "ru") {
      return item[field + "Ru"] || item[field] || "";
    }

    return item[field] || "";
  }

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
    if (currentLanguage === 'kk') {
      const localized = UI_TRANSLATIONS[title] || title;
      document.title = localized + ' — Мұғалімнің цифрлық навигаторы';
    } else {
      document.title = title ? title + ' — Цифровой навигатор учителя' : 'Цифровой навигатор учителя';
    }
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
        '<h2 class="card-title">' + escapeHtml(getLocalizedText(module, 'name')) + '</h2>' +
        descriptionOrEmpty(getLocalizedText(module, 'description'), 'Описание пока не добавлено.') +
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
    setTitle(getLocalizedText(module, 'name'));
    const moduleTools = tools.filter(function (tool) {
      return tool && String(tool.moduleId) === String(module.id) && tool.id && (tool.name || tool.nameRu);
    });
   
    
    const cards = moduleTools.map(function (tool) {
      return '<a class="card" href="' + escapeHtml(routeUrl('tool', tool.id)) + '">' +
        '<div class="card-header">' +
          '<span class="card-icon" aria-hidden="true">' +
            tool.logo +
          '</span>' +
          '<h2 class="card-title">' + escapeHtml(getLocalizedText(tool, 'name')) + '</h2>' +
        '</div>' +
        descriptionOrEmpty(getLocalizedText(tool, 'description'), 'Описание пока не добавлено.') +
        '<span class="card-arrow" aria-hidden="true">→</span>' +
      '</a>';
    }).join('');


    app.innerHTML = breadcrumbs([
      { label: 'Главная', href: 'index.html' },
      { label: getLocalizedText(module, 'name') }
    ]) +
    '<section class="page-intro">' +
      '<h1 class="page-heading">' + escapeHtml(getLocalizedText(module, 'name')) + '</h1>' +
      (getLocalizedText(module, 'description') && String(getLocalizedText(module, 'description')).trim()
        ? '<p class="page-description">' + escapeHtml(getLocalizedText(module, 'description')) + '</p>'
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
      return step && (String(getLocalizedText(step, 'title') || '').trim() || String(getLocalizedText(step, 'description') || '').trim());
    }) : [];
    if (!validSteps.length) return '<p class="section-empty">Инструкция пока не добавлена.</p>';
    return '<ol class="steps-list">' + validSteps.map(function (step, index) {
      const title = String(getLocalizedText(step, 'title') || '').trim();
      const description = String(getLocalizedText(step, 'description') || '').trim();
      return '<li class="step-item">' +
        '<div class="step-content">' +
          '<h3 class="step-heading">' + escapeHtml(title) + '</h3>' +
          '<p class="step-description">' + escapeHtml(description) + '</p>' +
        '</div>' +
      '</li>';
    }).join('') + '</ol>';
  }

  
  function getGoogleDriveFileId(url) {
    const value = String(url || '');

    const patterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  function getGoogleDrivePreviewUrl(url) {
    const fileId = getGoogleDriveFileId(url);

    return fileId
      ? 'https://drive.google.com/file/d/' + fileId + '/preview'
      : safeResourceUrl(url);
  }

  function getGoogleDriveImageUrl(url) {
    const fileId = getGoogleDriveFileId(url);

    return fileId
      ? 'https://drive.google.com/uc?export=view&id=' + fileId
      : safeResourceUrl(url);
  }

  function getGoogleDriveAudioUrl(url) {
    const fileId = getGoogleDriveFileId(url);

    return fileId
      ? 'https://drive.google.com/uc?export=download&id=' + fileId
      : safeResourceUrl(url);
  }

  function getYouTubeVideoId(url) {
    const value = String(url || '');

    const match = value.match(
      /(?:youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );

    return match ? match[1] : null;
  }

  
  function renderExamples(tool) {
    const toolExamples = examples.filter(function (example) {
      return example &&
        String(example.toolId) === String(tool.id) &&
        (example.title || example.description || example.url);
    });

    // Видео YouTube
    const videos = (
      Array.isArray(tool.resourceVideoUrl)
        ? tool.resourceVideoUrl
        : tool.resourceVideoUrl
          ? [tool.resourceVideoUrl]
          : []
    ).map(function (url, index) {
      return {
        title: 'Видео ' + (index + 1),
        url: url,
        type: 'video'
      };
    });

    // Изображения, PDF и аудио
    const references = (
      Array.isArray(tool.resourceReferences)
        ? tool.resourceReferences
        : []
    ).map(function (reference) {
      const url = String(reference.url || '');
      let type = String(reference.type || '').toLowerCase();

      // Определяем тип по расширению, если он не задан
      if (!type) {
        if (/\.pdf(?:$|[?#])/i.test(url)) {
          type = 'pdf';
        } else if (/\.mp3(?:$|[?#])/i.test(url)) {
          type = 'audio';
        } else if (/\.(?:jpg|jpeg|png|gif|webp)(?:$|[?#])/i.test(url)) {
          type = 'image';
        }
      }

      return {
        title: getLocalizedText(reference, 'title') || 'Материал',
        description: getLocalizedText(reference, 'description') || '',
        url: url,
        type: type
      };
    });

    const allExamples = toolExamples.concat(videos, references)
      .filter(function (item) {
        return safeResourceUrl(item.url);
      });

    if (!allExamples.length) {
      return '<p class="section-empty">Примеры и материалы пока не добавлены.</p>';
    }

    return '<ul class="examples-list">' +
      allExamples.map(function (example) {
        const title = String(example.title || 'Материал').trim();
        const description = String(example.description || '').trim();
        const type = String(example.type || '').toLowerCase();
        const url = safeResourceUrl(example.url);

        let content = '';

        // YouTube
        if (type === 'video') {
          const videoId = getYouTubeVideoId(url);

          if (videoId) {
            content =
              '<div class="example-video">' +
                '<iframe src="https://www.youtube-nocookie.com/embed/' +
                  escapeHtml(videoId) +
                '" title="' + escapeHtml(title) +
                '" loading="lazy" allowfullscreen></iframe>' +
              '</div>';
          }
        }

        // Изображения, включая Google Drive
        else if (type === 'image') {
          const imageUrl = getGoogleDriveImageUrl(url);

          content =
            '<a class="example-image-link" href="' +
              escapeHtml(url) +
              '" target="_blank" rel="noopener noreferrer">' +
              '<img class="example-image" src="' +
                escapeHtml(imageUrl) +
              '" alt="' + escapeHtml(title) +
              '" loading="lazy">' +
            '</a>';
        }

        // PDF, включая Google Drive
        else if (type === 'pdf') {
          const pdfUrl = getGoogleDriveFileId(url)
            ? getGoogleDrivePreviewUrl(url)
            : url;

          content =
            '<div class="example-pdf">' +
              '<iframe src="' + escapeHtml(pdfUrl) +
              '" title="' + escapeHtml(title) +
              '" loading="lazy"></iframe>' +
              '<a class="example-link" href="' +
                escapeHtml(url) +
              '" target="_blank" rel="noopener noreferrer">' +
                'Открыть PDF ↗' +
              '</a>' +
            '</div>';
        }

        // MP3, включая Google Drive
        else if (type === 'audio' || type === 'mp3') {
          const audioUrl = getGoogleDriveAudioUrl(url);

          content =
            '<div class="example-audio">' +
              '<audio controls preload="none">' +
                '<source src="' + escapeHtml(audioUrl) +
                '" type="audio/mpeg">' +
                'Ваш браузер не поддерживает аудио.' +
              '</audio>' +
              '<a class="example-link" href="' +
                escapeHtml(url) +
              '" target="_blank" rel="noopener noreferrer">' +
                'Открыть аудиофайл ↗' +
              '</a>' +
            '</div>';
        }

        // Остальные материалы — обычная ссылка
        
        if (!content) {
          if (type === 'link') {
            content =
              '<a class="example-link example-external-link" href="' +
                escapeHtml(url) +
                '" target="_blank" rel="noopener noreferrer">' +
                '<span>' + escapeHtml(title) + '</span>' +
                '<span aria-hidden="true"> ↗</span>' +
              '</a>';
          } else {
            content =
              (type
                ? '<span class="example-meta">' +
                    escapeHtml(type) +
                  '</span>'
                : '') +
              '<a class="example-link" href="' +
                escapeHtml(url) + '"' +
                (/^https?:\/\//i.test(url)
                  ? ' target="_blank" rel="noopener noreferrer"'
                  : '') +
              '>Открыть материал ↗</a>';
          }
        }


        return '<li class="example-item">' +
         // '<h3 class="example-title">' +
         //   escapeHtml(title) +
         // '</h3>' +
          (description
            ? '<p class="example-description">' +
                escapeHtml(description) +
              '</p>'
            : '') +
          content +
        '</li>';
      }).join('') +
    '</ul>';
  }



  function renderTool(tool) {
    const module = findById(modules, tool.moduleId);
    if (!module) return renderNotFound();
    setTitle(getLocalizedText(tool, 'name'));

    const title = escapeHtml(getLocalizedText(tool, 'name'));
    const pedagogicalTasks = getLocalizedText(tool, 'pedagogicalTasks');
    const tasks = pedagogicalTasks && String(pedagogicalTasks).trim() ? (() => {
      const lines = String(pedagogicalTasks)
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
    
    const resultCheck = getLocalizedText(tool, 'resultCheck');
    const resultCheckBefore = getLocalizedText(tool, 'resultCheckBefore');
    const resultCheckAfter = getLocalizedText(tool, 'resultCheckAfter');
    const check = resultCheck && String(resultCheck).trim() ? (() => {
      const lines = String(resultCheck)
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

      const intro = lines.find(line => !line.startsWith('-'));
      const items = lines
        .filter(line => line.startsWith('-'))
        .map(line => line.replace(/^-\s*/, ''));

      return '<div class="section-copy">' +
          '<p>' + escapeHtml(resultCheckBefore || '') + '</p>' +
        (intro ? '<p>' + escapeHtml(intro) + '</p>' : '') +
        (items.length
          ? '<ul>' + items.map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>'
          : '') +
          '<p>' + escapeHtml(resultCheckAfter || '') + '</p>' +
        '</div>';
    })() : '<p class="section-empty">Рекомендации по проверке результата пока не добавлены.</p>';


    app.innerHTML = breadcrumbs([
      { label: 'Главная', href: 'index.html' },
      { label: getLocalizedText(module, 'name'), href: routeUrl('module', module.id) },
      { label: getLocalizedText(tool, 'name') }
    ]) +
    '<section class="page-intro">' +
      '<h1 class="page-heading">' + title + '</h1>' +
    '</section>' +
    '<div class="tool-content">' +
      '<section class="tool-section" aria-labelledby="tool-name-heading">' +
        '<h2 id="tool-name-heading">1. Название платформы</h2>' +
        (getLocalizedText(tool, 'description2') && String(getLocalizedText(tool, 'description2')).trim()
          ? '<p class="section-copy">' + escapeHtml(getLocalizedText(tool, 'description2')) + '</p>'
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
    '<a class="back-link" href="' + escapeHtml(routeUrl('module', module.id)) + '"><span aria-hidden="true">←</span> К модулю «' + escapeHtml(getLocalizedText(module, 'name')) + '»</a>';
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


  const UI_TRANSLATIONS = {
    "Цифровой навигатор учителя": "Мұғалімнің цифрлық навигаторы",
    "Главная": "Басты бет",
    "Модули": "Модульдер",
    "Выберите педагогическую задачу и найдите подходящие цифровые инструменты для её решения.": "Педагогикалық міндетті таңдап, оны шешуге арналған цифрлық құралдарды табыңыз.",
    "Описание пока не добавлено.": "Сипаттама әзірге қосылмаған.",
    "Модули пока не добавлены.": "Модульдер әзірге қосылмаған.",
    "Цифровые инструменты": "Цифрлық құралдар",
    "В этом модуле пока нет инструментов.": "Бұл модульде әзірге құралдар жоқ.",
    "На главную": "Басты бетке",
    "Инструкция пока не добавлена.": "Нұсқаулық әзірге қосылмаған.",
    "Материал": "Материал",
    "Примеры и материалы пока не добавлены.": "Мысалдар мен материалдар әзірге қосылмаған.",
    "Открыть PDF ↗": "PDF ашу ↗",
    "Ваш браузер не поддерживает аудио.": "Браузеріңіз аудионы қолдамайды.",
    "Открыть аудиофайл ↗": "Аудиофайлды ашу ↗",
    "Открыть материал ↗": "Материалды ашу ↗",
    "Педагогические задачи пока не добавлены.": "Педагогикалық міндеттер әзірге қосылмаған.",
    "Перейти к инструменту ": "Құралға өту ",
    "Ссылка на платформу пока не добавлена.": "Платформаға сілтеме әзірге қосылмаған.",
    "Рекомендации по проверке результата пока не добавлены.": "Нәтижені тексеру бойынша ұсыныстар әзірге қосылмаған.",
    "Главная": "Басты бет",
    "Название платформы": "Платформа атауы",
    "1. Название платформы": "1. Платформа атауы",
    "2. Педагогические задачи": "2. Педагогикалық міндеттер",
    "3. Ссылка на платформу": "3. Платформаға сілтеме",
    "4. Алгоритм действий": "4. Әрекеттер алгоритмі",
    "5. Проверка и оценка результата": "5. Нәтижені тексеру және бағалау",
    "6. Примеры и готовые материалы": "6. Мысалдар мен дайын материалдар",
    "Педагогические задачи": "Педагогикалық міндеттер",
    "Ссылка на платформу": "Платформаға сілтеме",
    "Алгоритм действий": "Әрекеттер алгоритмі",
    "Проверка и оценка результата": "Нәтижені тексеру және бағалау",
    "Примеры и готовые материалы": "Мысалдар мен дайын материалдар",
    "Описание инструмента пока не добавлено.": "Құрал сипаттамасы әзірге қосылмаған.",
    "Страница не найдена": "Бет табылмады",
    "Возможно, ссылка устарела или такая страница ещё не создана.": "Сілтеме ескірген немесе бұл бет әлі жасалмаған болуы мүмкін.",
    "Вернуться на главную": "Басты бетке оралу",
    "Навигационная цепочка": "Навигация жолы",
    "К модулю": "Модульге өту",
    "Видео ": "Бейне "
  };

  function applyInterfaceLanguage() {
    const existing = document.getElementById('language-switcher');
    if (existing) existing.remove();

    const switcher = document.createElement('div');
    switcher.id = 'language-switcher';
    switcher.className = 'language-switcher';
    switcher.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:6px;margin:0 0 16px;font-size:14px;';
    switcher.setAttribute('aria-label', 'Тілді таңдау');
    switcher.innerHTML =
      '<button type="button" data-language="kk" ' +
        (currentLanguage === 'kk' ? 'aria-pressed="true" ' : 'aria-pressed="false" ') +
        'class="language-option" style="cursor:pointer;padding:6px 10px;border:1px solid #ccc;border-radius:6px;background:' + (currentLanguage === 'kk' ? '#eee' : '#fff') + '">Қазақша</button>' +
      '<span aria-hidden="true"> / </span>' +
      '<button type="button" data-language="ru" ' +
        (currentLanguage === 'ru' ? 'aria-pressed="true" ' : 'aria-pressed="false" ') +
        'class="language-option" style="cursor:pointer;padding:6px 10px;border:1px solid #ccc;border-radius:6px;background:' + (currentLanguage === 'ru' ? '#eee' : '#fff') + '">Русский</button>';

    switcher.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-language]');
      if (button) setLanguage(button.getAttribute('data-language'));
    });
    app.prepend(switcher);

    if (currentLanguage === 'kk') {
      const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      console.log(nodes);
      nodes.forEach(function (node) {
        const original = node.nodeValue;
        const trimmed = original.trim();
        if (UI_TRANSLATIONS[trimmed]) {
          node.nodeValue = original.replace(trimmed, UI_TRANSLATIONS[trimmed]);
        }
      });
      app.querySelectorAll('[aria-label="Навигационная цепочка"]').forEach(function (el) {
        el.setAttribute('aria-label', 'Навигация жолы');
      });
      document.querySelectorAll('a.back-link').forEach(function (link) {
          link.childNodes.forEach(function (node) {
              if (node.nodeType === Node.TEXT_NODE) {
                  node.textContent = node.textContent.replace('К модулю', UI_TRANSLATIONS["К модулю"]);
              }
          });
      });
    }

    document.documentElement.lang = currentLanguage;
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
      if (tool && (tool.name || tool.nameRu)) renderTool(tool);
      else renderNotFound();
      return;
    }
    renderNotFound();
  }

  start();
  applyInterfaceLanguage();
}());
