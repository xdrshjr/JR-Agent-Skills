import React from 'react';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = '#ffffff',
  align = 'left',
  style = {},
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    title: {
      fontSize: '56px',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: '28px',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body: {
      fontSize: '22px',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    caption: {
      fontSize: '14px',
      fontWeight: 600,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
    },
  };

  return (
    <div
      style={{
        color,
        textAlign: align,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
};
