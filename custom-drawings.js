/**
 * Sistema de Desenhos Customizados
 * Permite ao usuário criar e gerenciar seus próprios desenhos manuscritos
 */

const CustomDrawings = (() => {
  let supabase = null;
  let customDrawingsCache = {};
  let useCustomDrawings = localStorage.getItem('use_custom_drawings') === 'true';

  // Inicializar Supabase
  const init = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase não configurado. Usando apenas cache local.');
        return false;
      }

      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
      await loadCustomDrawings();
      return true;
    } catch (error) {
      console.error('Erro ao inicializar CustomDrawings:', error);
      return false;
    }
  };

  // Carregar todos os desenhos customizados
  const loadCustomDrawings = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('custom_drawings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      customDrawingsCache = {};
      data.forEach(drawing => {
        const key = `${drawing.character}-${drawing.variant_index}`;
        customDrawingsCache[key] = drawing;
      });

      console.log(`✅ ${data.length} desenhos customizados carregados`);
    } catch (error) {
      console.error('Erro ao carregar desenhos:', error);
    }
  };

  // Capturar área do canvas como imagem
  const captureCanvasArea = (canvas, x, y, width, height) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    return tempCanvas.toDataURL('image/png');
  };

  // Salvar desenho customizado
  const saveDrawing = async (character, variantIndex, imageData, width, height) => {
    if (!supabase) {
      alert('Banco de dados não disponível');
      return false;
    }

    try {
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('custom_drawings')
        .select('id')
        .eq('character', character)
        .eq('variant_index', variantIndex)
        .maybeSingle();

      let result;
      if (existing) {
        // Atualizar
        result = await supabase
          .from('custom_drawings')
          .update({
            image_data: imageData,
            width: width,
            height: height,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Inserir novo
        result = await supabase
          .from('custom_drawings')
          .insert({
            character: character,
            variant_index: variantIndex,
            image_data: imageData,
            width: width,
            height: height
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Atualizar cache
      const key = `${character}-${variantIndex}`;
      customDrawingsCache[key] = result.data;

      return true;
    } catch (error) {
      console.error('Erro ao salvar desenho:', error);
      return false;
    }
  };

  // Excluir desenho customizado
  const deleteDrawing = async (character, variantIndex) => {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('custom_drawings')
        .delete()
        .eq('character', character)
        .eq('variant_index', variantIndex);

      if (error) throw error;

      // Remover do cache
      const key = `${character}-${variantIndex}`;
      delete customDrawingsCache[key];

      return true;
    } catch (error) {
      console.error('Erro ao excluir desenho:', error);
      return false;
    }
  };

  // Obter desenho (customizado ou original)
  const getDrawingPath = (character, variantIndex) => {
    const key = `${character}-${variantIndex}`;

    if (useCustomDrawings && customDrawingsCache[key]) {
      return customDrawingsCache[key].image_data; // base64 data URL
    }

    // Fallback para desenho original
    const map = { '10': 'T', 'S': 'S', 'H': 'H', 'C': 'C', 'D': 'D' };
    const fileNamePart = map[character] || character;
    return `font_assets/${fileNamePart}-${variantIndex}.png`;
  };

  // Verificar se existe desenho customizado
  const hasCustomDrawing = (character, variantIndex) => {
    const key = `${character}-${variantIndex}`;
    return !!customDrawingsCache[key];
  };

  // Listar todos os desenhos customizados
  const listCustomDrawings = () => {
    return Object.values(customDrawingsCache);
  };

  // Toggle usar desenhos customizados
  const toggleUseCustom = () => {
    useCustomDrawings = !useCustomDrawings;
    localStorage.setItem('use_custom_drawings', useCustomDrawings);
    return useCustomDrawings;
  };

  // Exportar desenhos customizados
  const exportDrawings = () => {
    const data = Object.values(customDrawingsCache);
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `duplicity-custom-drawings-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Importar desenhos customizados
  const importDrawings = async (jsonData) => {
    if (!supabase) return false;

    try {
      const drawings = JSON.parse(jsonData);

      for (const drawing of drawings) {
        await saveDrawing(
          drawing.character,
          drawing.variant_index,
          drawing.image_data,
          drawing.width,
          drawing.height
        );
      }

      await loadCustomDrawings();
      return true;
    } catch (error) {
      console.error('Erro ao importar desenhos:', error);
      return false;
    }
  };

  return {
    init,
    captureCanvasArea,
    saveDrawing,
    deleteDrawing,
    getDrawingPath,
    hasCustomDrawing,
    listCustomDrawings,
    toggleUseCustom,
    exportDrawings,
    importDrawings,
    isUsingCustom: () => useCustomDrawings
  };
})();
