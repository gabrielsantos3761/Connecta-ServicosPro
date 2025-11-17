# Pasta de Imagens

Esta pasta é destinada para armazenar as imagens do projeto BarberPro.

## Estrutura Recomendada

```
public/assets/images/
├── logo.png ou logo.svg          # Logo principal da barbearia
├── logo-white.png                # Logo em branco (para fundos escuros)
├── favicon.ico                   # Ícone do navegador
└── backgrounds/                  # Imagens de fundo
```

## Como Usar

### 1. Imagens na pasta `public/assets/images/`

Arquivos aqui podem ser acessados diretamente pela URL:

```tsx
<img src="/Projeto-barbearia/assets/images/logo.png" alt="Logo" />
```

### 2. Formatos Recomendados

- **Logo**: SVG (escalável) ou PNG com fundo transparente
- **Ícones**: SVG
- **Fotos**: JPG ou WebP (otimizado)

## Sugestões de Nome

- `logo.svg` ou `logo.png` - Logo principal
- `logo-icon.svg` - Apenas o ícone (tesoura)
- `banner.jpg` - Banner da página inicial
- `favicon.ico` - Ícone do navegador (16x16, 32x32, 64x64)

## Tamanhos Recomendados

- Logo completo: 200-400px de largura
- Logo circular (ícone): 512x512px
- Favicon: 64x64px (ou usar gerador online)
