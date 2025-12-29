interface ModuleIconProps {
  module: 'proyecciones' | 'boletas' | 'asignaciones' | 'grupos' | 'maestros' | 'lecciones' | 'estudiantes' | 'configuracion';
  size?: number;
  className?: string;
}

export const ModuleIcon = ({ module, size = 64, className = '' }: ModuleIconProps) => {
  return (
    <img
      src={`/icons/modules/${module}.svg`}
      alt={`${module} icon`}
      width={size}
      height={size}
      className={className}
    />
  );
};
