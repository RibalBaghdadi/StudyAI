import React, { forwardRef } from 'react';

const TextArea = forwardRef(({ 
  label, 
  error, 
  className = '', 
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  resize = true,
  ...props 
}, ref) => {
  const textAreaClasses = `
    w-full px-3 py-2 border rounded-lg shadow-sm transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${resize ? 'resize-y' : 'resize-none'}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        className={`${textAreaClasses} ${className}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        {...props}
      />
      
      <div className="flex justify-between items-center mt-1">
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            {error}
          </p>
        )}
        
        {maxLength && (
          <p className="text-sm text-gray-500 ml-auto">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

TextArea.displayName = 'TextArea';

export default TextArea;