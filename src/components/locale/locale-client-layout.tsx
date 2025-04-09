'use client';

export default function LocaleClientLayout(props: { 
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { children } = props;
  
  return children;
} 