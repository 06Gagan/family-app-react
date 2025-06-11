import React from 'react';

// Modal with improved styling and subtle animation
export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    // Adds a fade-in animation to the background
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300"
      style={{ opacity: isOpen ? 1 : 0 }}
      onClick={onClose}
    >
      {/* Modal panel uses a scale-up animation */}
      <div 
        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-transform duration-300"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)' }}
        onClick={(e) => e.stopPropagation()} // This prevents the modal from closing when you click inside it.
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
}