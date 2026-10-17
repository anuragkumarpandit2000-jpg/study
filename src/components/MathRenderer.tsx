'use client';

import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  as?: 'div' | 'span';
}

export function formatToNotebookUnicode(text: string): string {
  if (!text) return '';

  return text
    // Remove dollar signs
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    // Replace text blocks
    .replace(/\\(text|mathrm|mathbf|mathit)\{([^}]*)\}/g, '$2')
    // Replace fractions
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 / $2')
    // Replace square roots
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt/g, '√')
    // Replace symbols
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\cdot/g, '·')
    .replace(/\\approx/g, '≈')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\degree/g, '°')
    .replace(/\^\\circ/g, '°')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\pi/g, 'π')
    .replace(/\\mu/g, 'μ')
    .replace(/\\Delta/g, 'Δ')
    // Superscripts
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/\^0\b/g, '⁰')
    .replace(/\^1\b/g, '¹')
    .replace(/\^-1\b/g, '⁻¹')
    .replace(/\^-2\b/g, '⁻²')
    .replace(/\^-3\b/g, '⁻³')
    .replace(/\^\{([0-9]+)\}/g, (_, p1) => {
      const superMap: Record<string, string> = { '0':'⁰', '1':'¹', '2':'²', '3':'³', '4':'⁴', '5':'⁵', '6':'⁶', '7':'⁷', '8':'⁸', '9':'⁹' };
      return p1.split('').map((c: string) => superMap[c] || c).join('');
    })
    .replace(/\^\{-([0-9]+)\}/g, (_, p1) => {
      const superMap: Record<string, string> = { '0':'⁰', '1':'¹', '2':'²', '3':'³', '4':'⁴', '5':'⁵', '6':'⁶', '7':'⁷', '8':'⁸', '9':'⁹' };
      return '⁻' + p1.split('').map((c: string) => superMap[c] || c).join('');
    })
    // Subscripts
    .replace(/_i\b/g, 'ᵢ')
    .replace(/_o\b/g, 'ₒ')
    .replace(/_1\b/g, '₁')
    .replace(/_2\b/g, '₂')
    .replace(/_3\b/g, '₃')
    .replace(/_4\b/g, '₄')
    .replace(/_\{([0-9a-zA-Z]+)\}/g, (_, p1) => {
      const subMap: Record<string, string> = { '0':'₀', '1':'₁', '2':'₂', '3':'₃', '4':'₄', '5':'₅', '6':'₆', '7':'₇', '8':'₈', '9':'₉', 'i':'ᵢ', 'o':'ₒ' };
      return p1.split('').map((c: string) => subMap[c] || c).join('');
    })
    // Clean leftover braces and backslashes
    .replace(/\\/g, '')
    .replace(/\{([^{}]+)\}/g, '$1')
    .replace(/[{}]/g, '');
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', as = 'span' }) => {
  if (!content) return null;

  const cleanText = formatToNotebookUnicode(content);
  const Component = as === 'div' ? 'div' : 'span';

  return (
    <Component className={`leading-relaxed whitespace-pre-wrap ${Component === 'span' ? 'inline-block w-full' : ''} ${className}`}>
      {cleanText}
    </Component>
  );
};
