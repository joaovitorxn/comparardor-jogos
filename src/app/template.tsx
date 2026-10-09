// o template remonta a cada navegação, então a animação de entrada roda em toda troca de página
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
