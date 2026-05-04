/**
 * UI para Gerenciamento de Desenhos Customizados
 */

(() => {
  let captureState = {
    isActive: false,
    startPoint: null,
    capturedImage: null,
    capturedWidth: 100,
    capturedHeight: 100,
    selectedChar: '',
    selectedVariant: 0
  };

  // Inicializar
  const initCustomDrawingsUI = async () => {
    await CustomDrawings.init();
    updateToggleButton();
  };

  // Toggle usar desenhos customizados
  window.toggleUseCustomDrawings = () => {
    CustomDrawings.toggleUseCustom();
    updateToggleButton();

    // Re-renderizar se houver duplicity images
    if (window.duplicityImages && window.duplicityImages.length > 0) {
      const renderFunc = window.render || (() => {});
      renderFunc();
    }
  };

  const updateToggleButton = () => {
    const btn = document.getElementById('toggleCustomDrawingsBtn');
    if (btn) {
      const isUsing = CustomDrawings.isUsingCustom();
      btn.textContent = `Usar Desenhos Customizados: ${isUsing ? 'ON' : 'OFF'}`;
      btn.classList.toggle('active', isUsing);
    }
  };

  // Abrir gerenciador de desenhos
  window.openCustomDrawingsManager = () => {
    const panel = document.getElementById('customDrawingsPanel');
    const setupPanel = document.getElementById('setupPanel');

    setupPanel.classList.add('hidden');
    panel.classList.remove('hidden');

    renderDrawingsGallery();
  };

  // Fechar gerenciador
  window.closeCustomDrawingsManager = () => {
    const panel = document.getElementById('customDrawingsPanel');
    panel.classList.add('hidden');
  };

  // Renderizar galeria de desenhos
  const renderDrawingsGallery = () => {
    const gallery = document.getElementById('customDrawingsGallery');
    const drawings = CustomDrawings.listCustomDrawings();

    if (drawings.length === 0) {
      gallery.innerHTML = '<div class="drawings-gallery-empty">Nenhum desenho customizado ainda.<br>Clique em "Capturar Novo" para começar.</div>';
      return;
    }

    // Agrupar por caractere
    const grouped = {};
    drawings.forEach(d => {
      if (!grouped[d.character]) grouped[d.character] = [];
      grouped[d.character].push(d);
    });

    let html = '';
    Object.keys(grouped).sort().forEach(char => {
      grouped[char].sort((a, b) => a.variant_index - b.variant_index);
      grouped[char].forEach(drawing => {
        const displayChar = char;
        const suitEmoji = {'S':'♠️','H':'♥️','C':'♣️','D':'♦️'}[char] || '';
        const label = suitEmoji || displayChar;

        html += `
          <div class="drawing-item has-custom">
            <div class="drawing-item-label">${label} (v${drawing.variant_index})</div>
            <img src="${drawing.image_data}" alt="${char}">
            <div class="drawing-item-actions">
              <button class="drawing-item-btn delete" onclick="window.deleteCustomDrawing('${char}', ${drawing.variant_index})">Excluir</button>
            </div>
          </div>
        `;
      });
    });

    gallery.innerHTML = html;
  };

  // Excluir desenho
  window.deleteCustomDrawing = async (char, variant) => {
    if (!confirm(`Excluir desenho de ${char} (variante ${variant})?`)) return;

    const success = await CustomDrawings.deleteDrawing(char, variant);
    if (success) {
      renderDrawingsGallery();
    } else {
      alert('Erro ao excluir desenho');
    }
  };

  // Exportar desenhos
  window.exportCustomDrawings = () => {
    CustomDrawings.exportDrawings();
  };

  // Importar desenhos
  window.importCustomDrawings = () => {
    document.getElementById('drawingsFileInput').click();
  };

  window.handleDrawingsImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const success = await CustomDrawings.importDrawings(e.target.result);
        if (success) {
          alert('Desenhos importados com sucesso!');
          renderDrawingsGallery();
        } else {
          alert('Erro ao importar desenhos');
        }
      } catch (err) {
        alert('Erro ao ler arquivo JSON');
      }
    };
    reader.readAsText(file);
  };

  // Iniciar captura de desenho
  window.startDrawingCapture = () => {
    const setupPanel = document.getElementById('setupPanel');
    const capturePanel = document.getElementById('captureDrawingPanel');

    setupPanel.classList.add('hidden');
    capturePanel.classList.remove('hidden');

    resetCaptureState();
  };

  // Cancelar captura
  window.cancelDrawingCapture = () => {
    const capturePanel = document.getElementById('captureDrawingPanel');
    capturePanel.classList.add('hidden');

    resetCaptureState();
  };

  const resetCaptureState = () => {
    captureState = {
      isActive: false,
      startPoint: null,
      capturedImage: null,
      capturedWidth: 100,
      capturedHeight: 100,
      selectedChar: '',
      selectedVariant: 0
    };

    document.getElementById('drawingPreviewContainer').innerHTML = '<span style="color: #8e8e93;">Nenhum desenho capturado</span>';
    document.getElementById('drawingAdjustControls').style.display = 'none';
    document.getElementById('drawingCharacterSelect').style.display = 'none';
    document.getElementById('startCaptureBtn').style.display = 'block';
    document.getElementById('saveDrawingBtn').style.display = 'none';

    document.querySelectorAll('.card-btn').forEach(b => b.classList.remove('active'));
  };

  // Ativar modo de captura
  window.activateCaptureMode = () => {
    captureState.isActive = true;
    document.body.style.cursor = 'crosshair';
    document.getElementById('startCaptureBtn').textContent = 'Arraste no Canvas para Selecionar';

    const board = document.getElementById('board');
    board.style.cursor = 'crosshair';
  };

  // Capturar área (integrado aos eventos de pointer)
  window.handleCapturePointerDown = (e) => {
    if (!captureState.isActive) return;

    const board = document.getElementById('board');
    const rect = board.getBoundingClientRect();
    captureState.startPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  window.handleCapturePointerUp = (e) => {
    if (!captureState.isActive || !captureState.startPoint) return;

    const board = document.getElementById('board');
    const rect = board.getBoundingClientRect();
    const endPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const x = Math.min(captureState.startPoint.x, endPoint.x);
    const y = Math.min(captureState.startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - captureState.startPoint.x);
    const height = Math.abs(endPoint.y - captureState.startPoint.y);

    if (width < 10 || height < 10) {
      captureState.startPoint = null;
      return;
    }

    captureDrawingFromCanvas(x, y, width, height);
    captureState.isActive = false;
    document.body.style.cursor = 'default';
    board.style.cursor = 'default';
  };

  const captureDrawingFromCanvas = (x, y, width, height) => {
    const board = document.getElementById('board');
    const imageData = CustomDrawings.captureCanvasArea(board, x, y, width, height);

    captureState.capturedImage = imageData;
    captureState.capturedWidth = width;
    captureState.capturedHeight = height;

    showCapturePreview();
  };

  const showCapturePreview = () => {
    const container = document.getElementById('drawingPreviewContainer');
    container.innerHTML = `<img src="${captureState.capturedImage}" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;

    document.getElementById('drawingAdjustControls').style.display = 'block';
    document.getElementById('drawingCharacterSelect').style.display = 'block';
    document.getElementById('startCaptureBtn').style.display = 'none';

    document.getElementById('captureWidthValue').textContent = Math.round(captureState.capturedWidth);
    document.getElementById('captureHeightValue').textContent = Math.round(captureState.capturedHeight);
  };

  // Ajustar tamanho da captura
  window.adjustCaptureSize = (axis, delta) => {
    if (axis === 'width') {
      captureState.capturedWidth = Math.max(20, captureState.capturedWidth + delta);
      document.getElementById('captureWidthValue').textContent = Math.round(captureState.capturedWidth);
    } else {
      captureState.capturedHeight = Math.max(20, captureState.capturedHeight + delta);
      document.getElementById('captureHeightValue').textContent = Math.round(captureState.capturedHeight);
    }

    updatePreviewSize();
  };

  const updatePreviewSize = () => {
    const img = document.querySelector('#drawingPreviewContainer img');
    if (img) {
      img.style.width = captureState.capturedWidth + 'px';
      img.style.height = captureState.capturedHeight + 'px';
    }
  };

  // Selecionar caractere
  window.selectCaptureChar = (char) => {
    captureState.selectedChar = char;
    document.querySelectorAll('[data-char]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[data-char="${char}"]`).forEach(b => b.classList.add('active'));
    updateSaveButton();
  };

  // Selecionar variante
  window.selectCaptureVariant = (variant) => {
    captureState.selectedVariant = variant;
    document.querySelectorAll('[data-variant]').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-variant="${variant}"]`).classList.add('active');
    updateSaveButton();
  };

  const updateSaveButton = () => {
    if (captureState.selectedChar) {
      document.getElementById('saveDrawingBtn').style.display = 'block';
    }
  };

  // Salvar desenho customizado
  window.saveCustomDrawing = async () => {
    if (!captureState.capturedImage || !captureState.selectedChar) {
      alert('Selecione um caractere antes de salvar');
      return;
    }

    const btn = document.getElementById('saveDrawingBtn');
    btn.textContent = 'Salvando...';
    btn.disabled = true;

    const success = await CustomDrawings.saveDrawing(
      captureState.selectedChar,
      captureState.selectedVariant,
      captureState.capturedImage,
      captureState.capturedWidth,
      captureState.capturedHeight
    );

    if (success) {
      alert('Desenho salvo com sucesso!');
      window.cancelDrawingCapture();
    } else {
      alert('Erro ao salvar desenho');
      btn.textContent = 'Salvar Desenho';
      btn.disabled = false;
    }
  };

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomDrawingsUI);
  } else {
    initCustomDrawingsUI();
  }
})();
