if (!window.__ERGONECK_INIT__) {
  window.__ERGONECK_INIT__ = true;

  // 1. Mobile Menu Navigation Logic
  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const bar1 = document.querySelector('.menu-bar-1');
  const bar2 = document.querySelector('.menu-bar-2');

  function setMenu(open) {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);

    if (open) {
      mobileMenu.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
      mobileMenu.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
      if (bar1 && bar2) {
        bar1.style.transform = 'translateY(4px) rotate(45deg)';
        bar2.style.transform = 'translateY(-4px) rotate(-45deg)';
      }
    } else {
      mobileMenu.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
      mobileMenu.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
      if (bar1 && bar2) {
        bar1.style.transform = '';
        bar2.style.transform = '';
      }
    }
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setMenu(false);
    });
  }

  // 2. Scroll Reveal Observer
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px' });

  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

  // 3. 3D Card Tilt Micro-Interaction (desktop pointer only)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  // 4. Live Posture & ErgoNeck Correction Simulator
  const postureSlider = document.getElementById('posture-slider');
  const ergoModeToggle = document.getElementById('ergo-mode-toggle');
  const ergoModeLabel = document.getElementById('ergo-mode-label');
  const simModeSubtitle = document.getElementById('sim-mode-subtitle');
  const simAngleBadge = document.getElementById('sim-angle-badge');
  const simAngleReadout = document.getElementById('sim-angle-readout');
  const simLoadReadout = document.getElementById('sim-load-readout');
  const simLoadSub = document.getElementById('sim-load-sub');
  const simStatusReadout = document.getElementById('sim-status-readout');
  const simActionSub = document.getElementById('sim-action-sub');
  const simHeadGroup = document.getElementById('sim-head-group');
  const simCollar = document.getElementById('sim-collar');
  const simSvgPill = document.getElementById('sim-svg-pill');
  const simFeedbackBanner = document.getElementById('sim-feedback-banner');

  let ergoActive = true;
  let correctionTimer = null;

  function calculateNeckLoadKg(angle) {
    return (5 + angle * 0.36 + (angle * angle) * 0.0012).toFixed(1);
  }

  function updateSimulator(angle, isAutoCorrecting = false) {
    if (!postureSlider) return;
    const numericAngle = Number(angle);
    const loadKg = calculateNeckLoadKg(numericAngle);

    postureSlider.value = numericAngle;
    simAngleBadge.textContent = `${numericAngle}°`;
    simAngleReadout.textContent = `${numericAngle}°`;
    simLoadReadout.textContent = `${loadKg} кг`;
    simHeadGroup.setAttribute('transform', `rotate(${numericAngle}, 110, 175)`);

    if (numericAngle <= 15) {
      simAngleBadge.className = 'px-3 py-1 rounded-lg bg-teal-50 text-teal-700 font-mono font-bold text-base sm:text-lg border border-teal-200';
      simStatusReadout.textContent = 'Оптимальная поза';
      simStatusReadout.className = 'font-display font-bold text-base text-teal-600 block mt-0.5';
      simLoadSub.textContent = 'Физиологическая норма';
      simActionSub.textContent = isAutoCorrecting ? 'Скорректировано ErgoNeck ✓' : 'Шея в безопасной зоне 0–15°';
      simSvgPill.textContent = 'НОРМА 0–15°';
      simSvgPill.className = 'px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30';
      simFeedbackBanner.textContent = isAutoCorrecting
        ? 'ErgoNeck мягко ограничил наклон и вернул шею в безопасный диапазон 15°!'
        : 'Опора ErgoNeck поддерживает шею в комфортном диапазоне 0–15°.';
    } else if (numericAngle <= 28) {
      simAngleBadge.className = 'px-3 py-1 rounded-lg bg-amber-50 text-amber-700 font-mono font-bold text-base sm:text-lg border border-amber-200';
      simStatusReadout.textContent = 'Превышение угла';
      simStatusReadout.className = 'font-display font-bold text-base text-amber-600 block mt-0.5';
      simLoadSub.textContent = 'Повышенная нагрузка';
      simActionSub.textContent = ergoActive ? 'Срабатывает упор ErgoNeck...' : 'Начало сутулости';
      simSvgPill.textContent = 'ВНИМАНИЕ >15°';
      simSvgPill.className = 'px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30';
      simFeedbackBanner.textContent = ergoActive
        ? 'Угол выше 15°: тактильный упор ErgoNeck сигнализирует и возвращает голову выше.'
        : 'Режим ErgoNeck выключен: мышцы шеи начинают перегружаться.';
    } else {
      simAngleBadge.className = 'px-3 py-1 rounded-lg bg-rose-50 text-rose-700 font-mono font-bold text-base sm:text-lg border border-rose-200';
      simStatusReadout.textContent = 'Синдром Tech Neck';
      simStatusReadout.className = 'font-display font-bold text-base text-rose-600 block mt-0.5';
      simLoadSub.textContent = 'Критическая перегрузка!';
      simActionSub.textContent = ergoActive ? 'Активный возврат в 15°...' : 'Риск спазма и боли в шее';
      simSvgPill.textContent = 'ПЕРЕГРУЗКА ' + numericAngle + '°';
      simSvgPill.className = 'px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30';
      simFeedbackBanner.textContent = ergoActive
        ? 'Критический наклон! ErgoNeck мягко амортизирует и возвращает шею к 15°...'
        : 'Без ErgoNeck нагрузка на шейный отдел превышает норму в 3–4 раза.';
    }

    clearTimeout(correctionTimer);
    if (ergoActive && numericAngle > 15) {
      correctionTimer = setTimeout(() => {
        updateSimulator(15, true);
      }, 900);
    }
  }

  if (postureSlider) {
    postureSlider.addEventListener('input', e => {
      updateSimulator(e.target.value, false);
    });
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      updateSimulator(btn.dataset.presetAngle, false);
    });
  });

  if (ergoModeToggle) {
    ergoModeToggle.addEventListener('click', () => {
      ergoActive = !ergoActive;
      ergoModeToggle.setAttribute('aria-checked', String(ergoActive));
      if (ergoActive) {
        ergoModeToggle.className = 'min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-mono text-xs font-bold transition-all cursor-pointer hover:bg-teal-400';
        ergoModeLabel.textContent = 'ERGONECK: ВКЛ';
        simModeSubtitle.textContent = 'Активен: мягко возвращает угол к ≤ 15°';
        simCollar.setAttribute('opacity', '1');
        if (Number(postureSlider.value) > 15) {
          updateSimulator(15, true);
        }
      } else {
        ergoModeToggle.className = 'min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer hover:bg-slate-600';
        ergoModeLabel.textContent = 'ERGONECK: ВЫКЛ';
        simModeSubtitle.textContent = 'Выключен: наклон головы не ограничивается';
        simCollar.setAttribute('opacity', '0.25');
        updateSimulator(postureSlider.value, false);
      }
    });
  }

  // 5. 3D Model Viewer & Fullscreen Media Modal Logic
  const mediaModal = document.querySelector('#media-modal');
  const modalStage = document.querySelector('#modal-stage');
  const modalTitle = document.querySelector('#modal-title');
  const modalKicker = document.querySelector('#modal-kicker');
  const modalHelp = document.querySelector('#modal-help');
  const modalClose = document.querySelector('.modal-close');
  const modelSource = window.ERGONECK_MODEL_DATA || 'ergoneck-model.glb';

  function enhanceModelViewer(viewer) {
    const applyMaterials = () => {
      const materials = viewer.model?.materials || [];
      materials.forEach(material => {
        const surface = material.pbrMetallicRoughness;
        if (!surface) return;
        surface.setBaseColorFactor([0.68, 0.76, 0.82, 1]);
        surface.setMetallicFactor(0.06);
        surface.setRoughnessFactor(0.74);
      });
    };

    viewer.addEventListener('load', applyMaterials, { once: true });
    if (viewer.loaded) applyMaterials();
  }

  document.querySelectorAll('model-viewer').forEach(viewer => {
    viewer.setAttribute('src', modelSource);
    enhanceModelViewer(viewer);
  });

  function openMediaModal(type) {
    if (!mediaModal || !modalStage) return;
    modalStage.replaceChildren();

    if (type === 'model') {
      const viewer = document.createElement('model-viewer');
      viewer.setAttribute('src', modelSource);
      viewer.setAttribute('alt', 'Интерактивная 3D-модель шейного ортеза ErgoNeck');
      viewer.setAttribute('camera-controls', '');
      viewer.setAttribute('auto-rotate', '');
      viewer.setAttribute('rotation-per-second', '12deg');
      viewer.setAttribute('camera-orbit', '28deg 68deg 128%');
      viewer.setAttribute('field-of-view', '31deg');
      viewer.setAttribute('interaction-prompt', 'auto');
      viewer.setAttribute('environment-image', 'neutral');
      viewer.setAttribute('shadow-intensity', '1.5');
      viewer.setAttribute('exposure', '0.56');
      viewer.style.width = '100%';
      viewer.style.height = '100%';
      enhanceModelViewer(viewer);
      modalStage.append(viewer);
      modalKicker.textContent = '3D MODEL / INTERACTIVE';
      modalTitle.textContent = 'Объёмная модель ErgoNeck';
      modalHelp.textContent = 'Зажмите и перемещайте, чтобы вращать · колесо или жест — масштаб';
    } else {
      const image = document.createElement('img');
      image.src = 'ergoneck-blueprint.jpg';
      image.alt = 'Технический чертёж ErgoNeck с размерами и обозначениями';
      image.className = 'w-full h-full object-contain p-3 sm:p-4 bg-slate-100';
      modalStage.append(image);
      modalKicker.textContent = 'BLUEPRINT / V4.1';
      modalTitle.textContent = 'Технический чертёж ErgoNeck';
      modalHelp.textContent = 'Нажмите Esc или кнопку закрытия, чтобы вернуться на сайт';
    }

    document.body.classList.add('modal-open');
    mediaModal.showModal();
  }

  document.querySelectorAll('[data-modal-type]').forEach(view => {
    view.addEventListener('click', () => openMediaModal(view.dataset.modalType));
    view.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMediaModal(view.dataset.modalType);
      }
    });
  });

  if (modalClose && mediaModal) {
    modalClose.addEventListener('pointerdown', event => event.stopPropagation());
    modalClose.addEventListener('click', event => {
      event.stopPropagation();
      mediaModal.close();
    });
    mediaModal.addEventListener('click', event => {
      if (event.target === mediaModal) mediaModal.close();
    });
    mediaModal.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      modalStage.replaceChildren();
    });
  }

  // 6. Purchase CTA Status Handler
  const purchaseButton = document.querySelector('#purchase-button');
  const purchaseStatus = document.querySelector('#purchase-status');
  if (purchaseButton && purchaseStatus) {
    purchaseButton.addEventListener('click', () => {
      purchaseButton.classList.add('bg-teal-100', 'text-teal-950');
      purchaseButton.innerHTML = '<span>Предзаказ скоро</span> <span class="text-teal-600 font-bold">✓</span>';
      purchaseStatus.textContent = 'Продажи откроются после финальных испытаний ErgoNeck.';
    });
  }
}
