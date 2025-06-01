import React, { useState, useEffect } from 'react';
import Button from './Button';
import Loader from './Loader';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  itemName,
  itemCount = 1,
  type = 'single', // 'single', 'bulk', 'all'
  isLoading = false 
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requiresTyping = type === 'all';
  const expectedText = 'DELETE';

  const handleConfirm = () => {
    if (type === 'all') {
      if (step === 1) {
        setStep(2);
        return;
      }
      if (confirmText !== expectedText) {
        return;
      }
    }
    onConfirm();
  };

  const handleCancel = () => {
    setConfirmText('');
    setStep(1);
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'all': return '🚨';
      case 'bulk': return '⚠️';
      default: return '🗑️';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'all': return 'bg-red-600 hover:bg-red-700';
      case 'bulk': return 'bg-orange-600 hover:bg-orange-700';
      default: return 'bg-red-500 hover:bg-red-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getIcon()}</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {title || `Delete ${type === 'all' ? 'All Files' : type === 'bulk' ? 'Selected Files' : 'File'}`}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {type === 'all' && step === 1 ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <div>
                    <h4 className="font-medium text-red-800">Warning: This action is irreversible</h4>
                    <p className="text-red-700 text-sm mt-1">
                      This will permanently delete ALL {itemCount} uploaded files including:
                    </p>
                    <ul className="text-red-700 text-sm mt-2 space-y-1">
                      <li>• Original documents</li>
                      <li>• Extracted text content</li>
                      <li>• All processed data</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-gray-700">
                Are you absolutely sure you want to continue?
              </p>
            </div>
          ) : type === 'all' && step === 2 ? (
            <div className="space-y-4">
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">Final Confirmation Required</h4>
                <p className="text-red-700 text-sm mb-3">
                  Type <strong>DELETE</strong> below to confirm the permanent deletion of all files:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
                {confirmText && confirmText !== expectedText && (
                  <p className="text-red-600 text-xs mt-1">Please type "DELETE" exactly as shown</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-orange-500 text-xl flex-shrink-0 mt-1">
                  {type === 'bulk' ? '⚠️' : '🗑️'}
                </span>
                <div>
                  <p className="text-gray-700">
                    {message || `Are you sure you want to delete ${type === 'bulk' ? `${itemCount} selected files` : `"${itemName}"`}?`}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    This action cannot be undone.
                  </p>
                  
                  {type === 'bulk' && itemCount > 1 && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-orange-800 text-sm">
                        <strong>{itemCount} files</strong> will be permanently deleted.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          {type === 'all' && step === 1 ? (
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              Continue
            </Button>
          ) : (
            <Button
              className={`text-white ${getButtonColor()} ${
                (requiresTyping && confirmText !== expectedText) || isLoading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
              onClick={handleConfirm}
              disabled={(requiresTyping && confirmText !== expectedText) || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  {getIcon()} Delete {type === 'all' ? 'All' : type === 'bulk' ? `${itemCount} Files` : 'File'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;