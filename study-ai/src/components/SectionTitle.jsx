import React from 'react';

const SectionTitle = ({ 
  title, 
  subtitle, 
  icon, 
  level = 2, // 1, 2, 3, 4
  align = 'left', // left, center, right
  className = '',
  children 
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };
  
  const getTitleElement = () => {
    const baseClasses = `font-bold text-gray-900 ${alignClasses[align]}`;
    
    const classes = {
      1: `text-4xl lg:text-5xl ${baseClasses}`,
      2: `text-3xl lg:text-4xl ${baseClasses}`,
      3: `text-2xl lg:text-3xl ${baseClasses}`,
      4: `text-xl lg:text-2xl ${baseClasses}`
    };
    
    const content = (
      <div className="flex items-center gap-3 justify-start">
        {icon && <span className="text-current">{icon}</span>}
        <span>{title}</span>
      </div>
    );
    
    switch (level) {
      case 1:
        return <h1 className={classes[1]}>{content}</h1>;
      case 2:
        return <h2 className={classes[2]}>{content}</h2>;
      case 3:
        return <h3 className={classes[3]}>{content}</h3>;
      case 4:
        return <h4 className={classes[4]}>{content}</h4>;
      default:
        return <h2 className={classes[2]}>{content}</h2>;
    }
  };
  
  return (
    <div className={`section-header mb-6 ${className}`}>
      <div className={alignClasses[align]}>
        {getTitleElement()}
        
        {subtitle && (
          <p className={`text-gray-600 mt-2 text-lg ${alignClasses[align]}`}>
            {subtitle}
          </p>
        )}
        
        {children && (
          <div className={`mt-4 ${alignClasses[align]}`}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionTitle;