import React from 'react';

interface ToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({ isActive, onClick, className, children }) => {
  return (
    <div
      onClick={onClick}
      className={`px-2 py-1 border rounded-md ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'} ${className}`}
    >
      {children}
    </div>
  );
}; 