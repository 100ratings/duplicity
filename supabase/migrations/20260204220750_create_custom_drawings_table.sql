/*
  # Sistema de Desenhos Customizados

  1. Nova Tabela
    - `custom_drawings`
      - `id` (uuid, primary key)
      - `character` (text) - O caractere que o desenho representa (A, 2, 3, etc)
      - `variant_index` (int) - Índice da variante (0-4)
      - `image_data` (text) - Dados da imagem em base64
      - `width` (int) - Largura original
      - `height` (int) - Altura original
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Segurança
    - Tabela sem RLS pois é uso local (cada dispositivo tem seus próprios desenhos)
    - Os dados são armazenados localmente por dispositivo
*/

CREATE TABLE IF NOT EXISTS custom_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character text NOT NULL,
  variant_index int NOT NULL DEFAULT 0,
  image_data text NOT NULL,
  width int NOT NULL,
  height int NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índice para busca rápida por caractere
CREATE INDEX IF NOT EXISTS idx_custom_drawings_character ON custom_drawings(character);

-- Constraint para garantir que variant_index seja válido (0-4)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'custom_drawings_variant_check'
  ) THEN
    ALTER TABLE custom_drawings 
    ADD CONSTRAINT custom_drawings_variant_check 
    CHECK (variant_index >= 0 AND variant_index <= 4);
  END IF;
END $$;

-- Como não estamos usando autenticação neste app, vamos desabilitar RLS
-- Os dados serão gerenciados localmente por cada instalação
ALTER TABLE custom_drawings DISABLE ROW LEVEL SECURITY;
