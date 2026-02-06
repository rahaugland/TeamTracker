interface ExpansionContainerProps {
  isExpanded: boolean;
  children: React.ReactNode;
}

export function ExpansionContainer({ isExpanded, children }: ExpansionContainerProps) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out"
      style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  );
}
