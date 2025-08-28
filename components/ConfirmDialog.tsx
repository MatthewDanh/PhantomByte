import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onConfirm, onCancel, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="neumorphic-outset border-2 border-red-500/50 rounded-lg max-w-sm w-full p-6 text-center">
        <h2 className="text-2xl font-hacker text-red-400 mb-4 tracking-wide">{title}</h2>
        <div className="text-gray-300 mb-6">
          {children}
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-white font-bold rounded-lg neumorphic-outset hover:border-gray-400 transition-all duration-300 text-lg font-hacker"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600/20 text-red-300 font-bold rounded-lg neumorphic-outset border-red-500/50 hover:bg-red-500/30 transition-all duration-300 text-lg font-hacker"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;