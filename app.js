(() => {
  const board = document.getElementById("board");
  const ctx = board?.getContext("2d", { alpha: true });
  const visor = document.getElementById("visor");
  const visorL1 = document.getElementById("visorLine1");
  const setupPanel = document.getElementById("setupPanel");
  const cardsPanel = document.getElementById("panelCards");
  const cardInputDisplay = document.getElementById("cardInputDisplay");
  const cardsAdjustControls = document.getElementById("cardsAdjustControls");

  let W = window.innerWidth, H = window.innerHeight, DPR = window.devicePixelRatio || 1;

  let mode = "draw"; 
  let color = "#111111";
  let strokes = [];
  let currentStroke = null;
  let swipeData = { start: null, arrows: [] };
  let cardInputData = { rank: "", suit: "", digits: "" };
  let isYellowSwipe = false; 
  let activePointerId = null;
  let isSetupPeek = false;
  
  let tapCounts = { red: 0, yellow: 0, black: 0 };
  let lastTapTimes = { red: 0, yellow: 0, black: 0 };
  
  let adjTarget = "visor";
  let lastResult = ""; 
  let isCardsAdjustMode = false;
  let peekTimer = null;

  // Imagens do Duplicity
  window.duplicityImages = [];

  let cfg = JSON.parse(localStorage.getItem("mnem_v6_cfg") || JSON.stringify({
    visor: { x: 50, y: 80, s: 15, lh: 1.1, y2: 0, text: "…", label: "Peek Principal", inverted: false, useEmoji: false, o: 0.3 },
    toolbar: { x: 50, y: 90, s: 1, label: "Barra de Ferramentas" },
    panelSetup: { x: 50, y: 10, s: 1, o: 0.6, label: "Painel de Configurações" },
    panelCards: { x: 50, y: 10, s: 1, o: 0.6, label: "Painel de Cartas" },
    duplicity: { x: 10, y: 30, s: 1, spacingY: 150, spacingX_RS: 0.8, spacingX_CN: 1.0, charW: 50, charH: 100, o: 1.0, label: "Desenho Duplicity" },
    draw: { blur: 0, label: "Ajuste do Traço" },
    inputType: "swipe",
    peekDuration: 1.0,
    forceLandscape: false
  }));

  const ensureCfg = () => {
    Object.keys(cfg).forEach(k => { if (cfg[k] && typeof cfg[k] === 'object' && cfg[k].visible === undefined) cfg[k].visible = true; });
    if (cfg.visor.useEmoji === undefined) cfg.visor.useEmoji = false;
    if (cfg.visor.peekStyle === undefined) cfg.visor.peekStyle = "both";
    if (cfg.visor.o === undefined) cfg.visor.o = 0.3;
    if (cfg.inputType === undefined) cfg.inputType = "swipe";
    if (cfg.peekDuration === undefined || cfg.peekDuration > 1.0) cfg.peekDuration = 1.0;
    if (cfg.forceLandscape === undefined) cfg.forceLandscape = false;
    if (!cfg.duplicity) cfg.duplicity = { x: 10, y: 30, s: 1, spacingY: 150, spacingX_RS: 0.8, spacingX_CN: 1.0, charW: 50, charH: 100, o: 1.0, label: "Desenho Duplicity" };
    if (cfg.duplicity.spacingY === undefined) cfg.duplicity.spacingY = 150;
    if (cfg.duplicity.spacingX_RS === undefined) cfg.duplicity.spacingX_RS = 0.8;
    if (cfg.duplicity.spacingX_CN === undefined) cfg.duplicity.spacingX_CN = 1.0;
    if (cfg.duplicity.charW === undefined) cfg.duplicity.charW = 50;
    if (cfg.duplicity.charH === undefined) cfg.duplicity.charH = 100;
    if (cfg.duplicity.o === undefined) cfg.duplicity.o = 1.0;
    if (!cfg.draw) cfg.draw = { blur: 0, label: "Ajuste do Traço" };

    const splitKeys = ['visor', 'toolbar', 'panelSetup', 'panelCards', 'duplicity'];
    if (!cfg.landscape || !cfg.portrait) {
      cfg.landscape = {};
      cfg.portrait = {};
      splitKeys.forEach(k => {
        cfg.landscape[k] = JSON.parse(JSON.stringify(cfg[k]));
        cfg.portrait[k] = JSON.parse(JSON.stringify(cfg[k]));
      });
    }
    ['landscape', 'portrait'].forEach(m => {
      if (!cfg[m]) cfg[m] = {};
      splitKeys.forEach(k => {
        if (!cfg[m][k]) cfg[m][k] = JSON.parse(JSON.stringify(cfg[k]));
      });
    });
  };
  ensureCfg();

  const init = () => {
    window.addEventListener('resize', onResize);
    onResize();
    bindEvents();
    
    // Tentar forçar landscape via API de Orientação
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(err => {
        console.log("A trava de orientação requer tela cheia ou interação prévia em alguns navegadores.");
      });
    }

    updateAdjustUI();
    // Resetar para 4 de paus no topo ao iniciar
    DUPLICITY.setTopCard("4C");
  };



  const onResize = () => {
    setTimeout(() => {
      W = window.innerWidth; H = window.innerHeight; DPR = window.devicePixelRatio || 1;
      board.width = W * DPR; board.height = H * DPR;
      board.style.width = W + "px"; board.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      
      const orient = H > W ? 'portrait' : 'landscape';
      const splitKeys = ['visor', 'toolbar', 'panelSetup', 'panelCards', 'duplicity'];
      splitKeys.forEach(k => {
        if (cfg[orient] && cfg[orient][k]) {
          cfg[k] = cfg[orient][k];
        }
      });

      applyCfg(); render();
    }, 100);
  };

  const getExamplePeek = () => {
    const cardStr = cfg.visor.useEmoji ? "3♥️" : "3H";
    const numStr = "14";
    if (cfg.visor.peekStyle === "cardOnly") return cardStr;
    return cfg.visor.inverted ? `${numStr} ${cardStr}` : `${cardStr} ${numStr}`;
  };

  const checkOrientation = () => {
    const warning = document.getElementById("orientationWarning");
    if (!warning) return;
    const isPortrait = H > W;
    if (cfg.forceLandscape && isPortrait) {
      warning.classList.remove("hidden");
    } else {
      warning.classList.add("hidden");
    }
  };

  const applyCfg = () => {
    visor.style.display = cfg.visor.visible ? "block" : "none";
    visor.style.left = (cfg.visor.x * W / 100) + "px";
    visor.style.top = (cfg.visor.y * H / 100) + "px";
    visor.style.fontSize = cfg.visor.s + "px";
    visor.style.lineHeight = cfg.visor.lh;
    
    if (mode === "setup" || mode === "cards") {
      visor.style.opacity = cfg.visor.o;
      visorL1.textContent = getExamplePeek();
      visorL1.classList.remove("loading-dots-animation");
    } else if (mode === "draw") {
      visor.style.opacity = 0;
      visorL1.textContent = cfg.visor.text;
      visorL1.classList.remove("loading-dots-animation");
    } else if (mode === "swipe") {
      visor.style.opacity = cfg.visor.o;
      if (swipeData.arrows.length === 0 && !swipeData.start) {
        visorL1.textContent = "";
        visorL1.classList.add("loading-dots-animation");
      } else {
        visorL1.classList.remove("loading-dots-animation");
      }
    }
    
    const panels = { "toolbar": "toolbar", "setupPanel": "panelSetup", "panelCards": "panelCards" };
    Object.keys(panels).forEach(id => {
      const el = document.getElementById(id);
      const c = cfg[panels[id]];
      if (el && c) {
        if (id === "toolbar") el.style.display = c.visible ? "flex" : "none";
        el.style.left = (c.x * W / 100) + "px";
        el.style.top = (c.y * H / 100) + "px";
        el.style.transform = `translateX(-50%) scale(${c.s})`;
        if (id !== "toolbar") el.style.background = `rgba(255, 255, 255, ${c.o})`;
      }
    });

    document.getElementById("toggleEmojiBtn").textContent = `Símbolos de Naipes: ${cfg.visor.useEmoji ? 'ON' : 'OFF'}`;
    document.getElementById("inputSwipeBtn").classList.toggle("active", cfg.inputType === "swipe");
    document.getElementById("inputCardsBtn").classList.toggle("active", cfg.inputType === "cards");
    
    document.getElementById("swatchGroup").querySelectorAll(".swatch").forEach(s => {
      if (s.dataset.color === "#FF3B30") s.classList.toggle("swipe-active", mode === "swipe" && !isYellowSwipe);
      if (s.dataset.color === "#F7C600") s.classList.toggle("swipe-active", mode === "swipe" && isYellowSwipe);
    });

    document.getElementById("invertOrderBtn").textContent = cfg.visor.inverted ? "Ordem: 05 4H → 4H 05" : "Ordem: 4H 05 → 05 4H";
    document.getElementById("togglePeekStyleBtn").textContent = `Estilo: ${cfg.visor.peekStyle === 'cardOnly' ? 'Apenas Carta' : 'Carta + Posição'}`;
    
    const forceBtn = document.getElementById("forceLandscapeBtn");
    if (forceBtn) forceBtn.textContent = `Forçar Landscape: ${cfg.forceLandscape ? 'ON' : 'OFF'}`;

    document.querySelectorAll(".setup-btn-target").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.target === adjTarget);
    });

    localStorage.setItem("mnem_v6_cfg", JSON.stringify(cfg));
    checkOrientation();
  };

  const bindEvents = () => {
    const handleSwatchClick = (s) => {
      const c = s.dataset.color;
      document.querySelectorAll(".swatch").forEach(b => b.classList.remove("active"));
      s.classList.add("active");
      color = c;

      if (c === "#FF3B30") {
        if (cfg.inputType === "cards") window.toggleCards(false);
        else toggleSwipe(false);
      }
      if (c === "#F7C600") {
        toggleSwipe(true);
      }
    };

    document.querySelectorAll(".swatch").forEach(s => {
      let pressTimer = null;

      s.addEventListener("pointerdown", (e) => {
        if (!e.isPrimary) return;
        if (s.dataset.color === "#111111") {
          pressTimer = setTimeout(() => {
            window.toggleSetup();
            pressTimer = null;
          }, 1500);
        }
      });

      s.addEventListener("pointerup", (e) => {
        if (!e.isPrimary) return;
        if (s.dataset.color === "#111111" && !pressTimer) return; // Long press triggered
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        handleSwatchClick(s);
      });

      s.addEventListener("pointerleave", () => {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      });
    });

    document.getElementById("clearBtn").onclick = (e) => { 
      e.stopPropagation(); 
      strokes = []; 
      swipeData.arrows = []; 
      window.duplicityImages = []; 
      if (mode === "swipe") { mode = "draw"; visor.style.opacity = 0; isYellowSwipe = false; }
      if (mode === "cards") window.toggleCards();
      applyCfg();
      render(); 
    };

    document.getElementById("undoBtn").onclick = (e) => {
      e.stopPropagation();
      strokes.pop();
      render();
    };

    // Botão Olho no Painel de Setup
    const eyeBtn = document.getElementById("eyeBtn");
    if (eyeBtn) {
      eyeBtn.onclick = () => {
        isSetupPeek = true;
        setupPanel.classList.add("hidden");
        const floatBtn = document.getElementById("floatingEyeBtn");
        if (floatBtn) floatBtn.classList.remove("hidden");
        mode = "draw"; // Permite desenhar e usar toolbar
        applyCfg();
      };
    }

    // Lógica do Botão Flutuante (Arrastar e Clicar)
    const floatBtn = document.getElementById("floatingEyeBtn");
    if (floatBtn) {
      let isDraggingFloat = false;
      let floatDragStart = { x: 0, y: 0 };
      let startClickPos = { x: 0, y: 0 };

      floatBtn.addEventListener("pointerdown", (e) => {
        if (!e.isPrimary) return;
        isDraggingFloat = false;
        floatBtn.setPointerCapture(e.pointerId);
        const rect = floatBtn.getBoundingClientRect();
        // Fixar posição absoluta para evitar pulos ao iniciar o drag
        floatBtn.style.right = 'auto';
        floatBtn.style.left = rect.left + 'px';
        floatBtn.style.top = rect.top + 'px';
        floatDragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        startClickPos = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      });

      floatBtn.addEventListener("pointermove", (e) => {
        if (!floatBtn.hasPointerCapture(e.pointerId)) return;
        e.preventDefault();
        let newX = e.clientX - floatDragStart.x;
        let newY = e.clientY - floatDragStart.y;
        // Limites da tela
        newX = Math.max(10, Math.min(W - 54, newX));
        newY = Math.max(10, Math.min(H - 54, newY));
        floatBtn.style.left = newX + "px";
        floatBtn.style.top = newY + "px";
      });

      floatBtn.addEventListener("pointerup", (e) => {
        floatBtn.releasePointerCapture(e.pointerId);
        // Se moveu pouco, considera clique
        if (Math.hypot(e.clientX - startClickPos.x, e.clientY - startClickPos.y) < 5) {
          window.toggleSetup();
        }
      });
    }

    board.addEventListener("pointerdown", (e) => {
      if (!e.isPrimary) return;
      if (activePointerId !== null) return;
      
      e.preventDefault();
      activePointerId = e.pointerId;
      board.setPointerCapture(activePointerId);

      // Tentar forçar orientação
      if (screen.orientation && screen.orientation.lock) { screen.orientation.lock('landscape').catch(() => {}); }

      const p = getPt(e);
      if (mode === "swipe") { 
        swipeData.start = p; 
        applyCfg();
        return; 
      }
      currentStroke = { c: color, p: [p] };
    }, { passive: false });

    board.addEventListener("pointermove", (e) => {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();

      if (mode === "swipe") return;
      if (!currentStroke) return;
      const p = getPt(e);
      currentStroke.p.push(p);
      render(); 
    }, { passive: false });

    board.addEventListener("pointerup", (e) => {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();

      if (mode === "swipe" && swipeData.start) {
        const arrow = getArrow(swipeData.start, getPt(e));
        swipeData.start = null;
        if (arrow) { 
          swipeData.arrows.push(arrow); 
          updateVisorProgress(); 
          visor.style.opacity = cfg.visor.o; 
          const targetLen = isYellowSwipe ? 3 : 7;
          if (swipeData.arrows.length === targetLen) resolveSwipe(); 
        }
      }
      if (currentStroke) { strokes.push(currentStroke); currentStroke = null; render(); }
      activePointerId = null;
    }, { passive: false });

    board.addEventListener("pointercancel", (e) => {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();
      activePointerId = null;
      currentStroke = null;
      swipeData.start = null;
      render();
    }, { passive: false });
  };

  const getPt = (e) => { const r = board.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  
  const render = () => {
    ctx.clearRect(0, 0, board.width, board.height);
    
    if (window.duplicityImages && window.duplicityImages.length > 0) {
      const d = cfg.duplicity;
      const startX = (d.x * W / 100); 
      const startY = (d.y * H / 100); 
      const charWidth = d.charW * d.s;   
      const charHeight = d.charH * d.s;  
      const lineSpacingY = d.spacingY * d.s; 

      ctx.save();
      ctx.globalAlpha = d.o;
      ctx.globalCompositeOperation = 'multiply';
      
      window.duplicityImages.forEach((line, lineIdx) => {
        let currentX = startX;
        line.forEach((imgObj, charIdx) => {
          if (imgObj.path && imgObj.img) {
            ctx.drawImage(imgObj.img, currentX, startY + (lineIdx * lineSpacingY), charWidth, charHeight);
            
            let isTen = (line[charIdx].char === '10');
            let nextChar = line[charIdx+1];
            
            if (nextChar && nextChar.char === ' ') {
               currentX += charWidth * d.spacingX_CN; 
            } else {
               currentX += charWidth * d.spacingX_RS; 
            }
          } else if (imgObj.char === ' ') {
            currentX += charWidth * 0.5; 
          }
        });
      });
      ctx.restore();
    }

    ctx.save();
    if (cfg.draw.blur > 0) {
      ctx.shadowBlur = cfg.draw.blur;
      ctx.shadowColor = color;
      ctx.filter = `blur(${cfg.draw.blur/2}px)`;
    }
    
    const drawOne = (s) => {
      ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 6; ctx.strokeStyle = s.c;
      ctx.beginPath(); ctx.moveTo(s.p[0].x, s.p[0].y);
      for (let i = 1; i < s.p.length; i++) ctx.lineTo(s.p[i].x, s.p[i].y);
      ctx.stroke();
    };

    strokes.forEach(drawOne);
    if (currentStroke) drawOne(currentStroke);
    ctx.restore();
  };

  const getArrow = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    if (Math.hypot(dx, dy) < 30) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "→" : "←") : (dy > 0 ? "↓" : "↑");
  };

  const formatCard = (card) => {
    const rank = card.slice(0, -1); const suit = card.slice(-1);
    const suitDisplay = cfg.visor.useEmoji ? ({"S":"♠️","H":"♥️","C":"♣️","D":"♦️"}[suit] || suit) : suit;
    return rank + suitDisplay;
  };

  const updateVisorProgress = () => {
    const arr = swipeData.arrows; const len = arr.length; let content = arr.join("");
    if (len >= 3) {
      const rank = {"↑→":"A","→↑":"2","→→":"3","→↓":"4","↓→":"5","↓↓":"6","↓←":"7","←↓":"8","←←":"9","←↑":"10","↑←":"J","↑↑":"Q","↑↓":"K"}[arr[0]+arr[1]];
      const suit = {"↑":"S","→":"H","↓":"C","←":"D"}[arr[2]];
      const card = (rank && suit) ? formatCard(rank+suit) : "??";
      if (len === 3) content = isYellowSwipe ? `TOPO: ${card}` : card;
      else if (len >= 5) {
        const dec = {"↑↑":0,"↑→":10,"→↑":20,"→→":30,"→↓":40,"↓→":50}[arr[3]+arr[4]];
        const decStr = dec !== undefined ? (dec/10).toString() : "?";
        if (len === 5) content = `${card} ${decStr}`;
        else if (len === 7) {
          const unt = {"↑↑":0,"↑→":1,"→↑":2,"→→":3,"→↓":4,"↓→":5,"↓↓":6,"↓←":7,"←↓":8,"←←":"9"}[arr[5]+arr[6]];
          const num = (dec !== undefined && unt !== undefined) ? parseInt(dec) + parseInt(unt) : "??";
          content = `${card} ${num}`;
        }
      }
    }
    visorL1.textContent = content;
    visor.style.opacity = cfg.visor.o; 
  };

  window.drawDuplicityResult = (card, pos) => {
    DUPLICITY.resetVariantCache();
    const result = DUPLICITY.calculateInversion(card, pos);
    const line1Text = `${result.line1.card} ${result.line1.pos}`;
    const line2Text = `${result.line2.card} ${result.line2.pos}`;
    
    const line1Images = DUPLICITY.textToImages(line1Text);
    const line2Images = DUPLICITY.textToImages(line2Text);
    
    window.duplicityImages = [line1Images, line2Images];
    
    let loaded = 0;
    const allImgs = [...line1Images, ...line2Images].filter(i => i.path);
    const total = allImgs.length;
    
    if (total === 0) { render(); return; }

    allImgs.forEach(imgObj => {
      imgObj.img = new Image();
      imgObj.img.onload = () => {
        loaded++;
        if (loaded >= total) {
          render();
          // Após gerar o desenho, volta a considerar o 4 de paus no topo
          DUPLICITY.setTopCard("4C");
        }
      };
      imgObj.img.src = imgObj.path;
    });
  };

  const resolveSwipe = () => {
    const arr = swipeData.arrows;
    const rank = {"↑→":"A","→↑":"2","→→":"3","→↓":"4","↓→":"5","↓↓":"6","↓←":"7","←↓":"8","←←":"9","←↑":"10","↑←":"J","↑↑":"Q","↑↓":"K"}[arr[0]+arr[1]];
    const suit = {"↑":"S","→":"H","↓":"C","←":"D"}[arr[2]];
    const card = (rank && suit) ? rank+suit : "";
    
    if (isYellowSwipe) {
      if (card) {
        DUPLICITY.setTopCard(card);
        visorL1.textContent = `TOPO: ${formatCard(card)}`;
        
        clearTimeout(peekTimer);
        peekTimer = setTimeout(() => {
          color = "#FF3B30";
          document.querySelectorAll(".swatch").forEach(b => b.classList.remove("active"));
          const redBtn = document.querySelector('.swatch[data-color="#FF3B30"]');
          if (redBtn) redBtn.classList.add("active");
          if (cfg.inputType === "cards") window.toggleCards(false);
          else toggleSwipe(false);
        }, cfg.peekDuration * 1000);
        return;
      } else {
        visorL1.textContent = "ERRO";
      }
    } else {
      const dec = {"↑↑":0,"↑→":10,"→↑":20,"→→":30,"→↓":40,"↓→":50}[arr[3]+arr[4]];
      const unt = {"↑↑":0,"↑→":1,"→↑":2,"→→":3,"→↓":4,"↓→":5,"↓↓":6,"↓←":7,"←↓":8,"←←":"9"}[arr[5]+arr[6]];
      const num = (dec !== undefined && unt !== undefined) ? parseInt(dec) + parseInt(unt) : 0;
      processResult(card, num);
    }
    
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => { 
      if (mode !== "setup" && mode !== "cards") { visor.style.opacity = 0; setTimeout(() => { if (mode === "draw") visorL1.textContent = cfg.visor.text; }, 300); }
      swipeData.arrows = []; if (mode === "swipe") { mode = "draw"; isYellowSwipe = false; }
    }, cfg.peekDuration * 1000);
  };

  const processResult = (card, num) => {
    if (!card || num < 1 || num > 52) { visorL1.textContent = "ERRO"; lastResult = "ERRO"; }
    else {
      lastResult = `${formatCard(card)} ${num.toString().padStart(2, '0')}`;
      visorL1.textContent = lastResult;
      window.drawDuplicityResult(card, num);
    }
  };

  const closeOtherPanels = () => {
    setupPanel.classList.add("hidden");
    cardsPanel.classList.add("hidden");
  };

  window.toggleSetup = () => {
    const floatBtn = document.getElementById("floatingEyeBtn");
    if (floatBtn) floatBtn.classList.add("hidden");
    isSetupPeek = false;

    if (mode === "setup") { mode = "draw"; setupPanel.classList.add("hidden"); visor.style.opacity = 0; applyCfg(); }
    else { closeOtherPanels(); mode = "setup"; setupPanel.classList.remove("hidden"); adjTarget = "panelSetup"; applyCfg(); updateAdjustUI(); }
  };

  const toggleSwipe = (yellow = false) => {
    if (mode === "swipe" && isYellowSwipe === yellow) { mode = "draw"; visor.style.opacity = 0; isYellowSwipe = false; }
    else { closeOtherPanels(); mode = "swipe"; visor.style.opacity = cfg.visor.o; visorL1.textContent = ""; isYellowSwipe = yellow; }
    swipeData.arrows = [];
    applyCfg();
  };

  window.toggleCards = (isAdjust = false) => {
    isCardsAdjustMode = isAdjust;
    if (mode === "cards" && !isAdjust) { mode = "draw"; cardsPanel.classList.add("hidden"); visor.style.opacity = 0; applyCfg(); }
    else {
      closeOtherPanels(); mode = "cards"; cardsPanel.classList.remove("hidden");
      cardsAdjustControls.classList.toggle("hidden", !isAdjust);
      cardInputData = { rank: "", suit: "", digits: "" };
      updateCardDisplay(); applyCfg();
    }
  };

  window.selectCardPart = (type, val) => {
    if (type === "rank") cardInputData.rank = val;
    if (type === "suit") cardInputData.suit = val;
    if (type === "digit") {
      cardInputData.digits += val;
      if (cardInputData.digits.length > 2) cardInputData.digits = val;
    }
    updateCardDisplay();
    if (cardInputData.rank && cardInputData.suit && cardInputData.digits.length === 2) {
      const num = parseInt(cardInputData.digits);
      if (num >= 1 && num <= 52) {
        processResult(cardInputData.rank + cardInputData.suit, num);
        setTimeout(() => window.toggleCards(), 1500);
      } else {
        cardInputData.digits = ""; updateCardDisplay();
      }
    }
  };

  const updateCardDisplay = () => {
    const r = cardInputData.rank || "--";
    const s = cardInputData.suit ? ({"S":"♠️","H":"♥️","C":"♣️","D":"♦️"}[cardInputData.suit]) : "--";
    const d = cardInputData.digits.padStart(2, '-');
    cardInputDisplay.textContent = `${r}${s} ${d}`;
  };

  window.setInputType = (t) => { cfg.inputType = t; applyCfg(); };
  window.toggleEmoji = () => { cfg.visor.useEmoji = !cfg.visor.useEmoji; applyCfg(); };
  window.toggleInvertOrder = () => { cfg.visor.inverted = !cfg.visor.inverted; applyCfg(); };
  window.togglePeekStyle = () => { cfg.visor.peekStyle = (cfg.visor.peekStyle === "both" ? "cardOnly" : "both"); applyCfg(); };
  window.toggleForceLandscape = () => { cfg.forceLandscape = !cfg.forceLandscape; applyCfg(); };
  window.setTarget = (t) => { adjTarget = t; updateAdjustUI(); applyCfg(); };

  const updateAdjustUI = () => {
    const container = document.getElementById("setupAdjusts");
    const opContainer = document.getElementById("opacitySlider");
    if (!container) return;
    container.innerHTML = "";
    const target = cfg[adjTarget];
    if (!target) return;

    const createStepper = (label, key, axis, step) => {
      const div = document.createElement("div");
      div.className = "stepper-control";
      div.innerHTML = `
        <span class="stepper-label">${label}</span>
        <button class="stepper-btn" onclick="window.adjust('${axis}', ${-step}, '${key}')">-</button>
        <span class="stepper-value">${target[axis].toFixed(axis === 's' && (key.startsWith('panel') || key === 'toolbar') ? 2 : (axis.includes('spacingX') ? 2 : 1))}</span>
        <button class="stepper-btn" onclick="window.adjust('${axis}', ${step}, '${key}')">+</button>
      `;
      return div;
    };

    if (target.x !== undefined) container.appendChild(createStepper("Posição X", adjTarget, "x", 0.5));
    if (target.y !== undefined) container.appendChild(createStepper("Posição Y", adjTarget, "y", 0.5));
    if (target.s !== undefined) container.appendChild(createStepper("Tamanho", adjTarget, "s", adjTarget === 'duplicity' ? 0.1 : (adjTarget.startsWith('panel') || adjTarget === 'toolbar' ? 0.05 : 1)));

    if (adjTarget === "duplicity") {
      container.appendChild(createStepper("Espaço Valor/Naipe", "duplicity", "spacingX_RS", 0.05));
      container.appendChild(createStepper("Espaço Carta/Número", "duplicity", "spacingX_CN", 0.05));
      container.appendChild(createStepper("Espaçamento Y", "duplicity", "spacingY", 5));
    }

    if (adjTarget === "draw") {
      container.appendChild(createStepper("Blur do Traço", "draw", "blur", 1));
    }

    if (target.o !== undefined) {
      document.getElementById("oControl").style.display = "block";
      opContainer.innerHTML = `
        <div class="slider-control">
          <div class="slider-label-group"><span class="slider-label">Opacidade</span><span class="slider-value-display">${Math.round(target.o * 100)}%</span></div>
          <input type="range" class="range-slider" min="0" max="1" step="0.01" value="${target.o}" oninput="window.adjustDirect('o', this.value, '${adjTarget}')">
        </div>
      `;
    } else {
      document.getElementById("oControl").style.display = "none";
    }
  };

  window.adjust = (axis, delta, key) => {
    cfg[key][axis] += delta;
    if (axis === 'o') cfg[key][axis] = Math.max(0, Math.min(1, cfg[key][axis]));
    if (axis === 'blur') cfg[key][axis] = Math.max(0, cfg[key][axis]);
    applyCfg(); updateAdjustUI(); render();
  };

  window.adjustDirect = (axis, val, key) => {
    cfg[key][axis] = parseFloat(val);
    applyCfg(); updateAdjustUI(); render();
  };

  window.openCardsAdjust = () => {
    window.toggleCards(true);
    const container = document.getElementById("cardsAdjusts");
    container.innerHTML = "";
    const target = cfg.panelCards;
    const createStepper = (label, key, axis, step) => {
      const div = document.createElement("div");
      div.className = "stepper-control";
      div.innerHTML = `<span class="stepper-label">${label}</span><button class="stepper-btn" onclick="window.adjust('${axis}', ${-step}, '${key}')">-</button><span class="stepper-value">${target[axis].toFixed(2)}</span><button class="stepper-btn" onclick="window.adjust('${axis}', ${step}, '${key}')">+</button>`;
      return div;
    };
    container.appendChild(createStepper("Posição X", "panelCards", "x", 0.5));
    container.appendChild(createStepper("Posição Y", "panelCards", "y", 0.5));
    container.appendChild(createStepper("Tamanho", "panelCards", "s", 0.05));
  };

  // Funções de Importação/Exportação JSON
  window.exportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cfg, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "duplicity_config.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  window.importConfig = () => {
    document.getElementById('configFileInput').click();
  };

  window.handleConfigImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCfg = JSON.parse(e.target.result);
        cfg = importedCfg;
        ensureCfg();
        applyCfg();
        updateAdjustUI();
        alert("Configurações importadas com sucesso!");
      } catch (err) {
        alert("Erro ao importar arquivo JSON.");
      }
    };
    reader.readAsText(file);
  };

  init();
})();
