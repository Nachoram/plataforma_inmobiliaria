import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import { CustomButton } from '../common';

export interface FormStepInfo {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  error?: string;
  required?: boolean;
}

interface FormProgressBarProps {
  steps: FormStepInfo[];
  currentStep: number;
  onStepChange?: (stepIndex: number) => void;
  canNavigateToStep?: (stepIndex: number) => boolean;
  showStepNavigation?: boolean;
  className?: string;
}

export const FormProgressBar: React.FC<FormProgressBarProps> = ({
  steps,
  currentStep,
  onStepChange,
  canNavigateToStep,
  showStepNavigation = true,
  className = ''
}) => {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const completedSteps = steps.filter(step => step.completed).length;

  const handleStepClick = (stepIndex: number) => {
    if (onStepChange && canNavigateToStep?.(stepIndex)) {
      onStepChange(stepIndex);
    }
  };

  const getStepIcon = (step: FormStepInfo, index: number) => {
    if (step.error) {
      return <Circle className="h-5 w-5 text-red-500 fill-current" />;
    }
    if (step.completed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (index === currentStep) {
      return <Circle className="h-5 w-5 text-blue-500 fill-current" />;
    }
    return <Circle className="h-5 w-5 text-gray-300" />;
  };

  const getStepColor = (step: FormStepInfo, index: number) => {
    if (step.error) return 'text-red-600';
    if (step.completed) return 'text-green-600';
    if (index === currentStep) return 'text-blue-600';
    return 'text-gray-400';
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progreso del Formulario
          </span>
          <span className="text-sm text-gray-500">
            {currentStep + 1} de {steps.length} pasos
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">
            {completedSteps} de {steps.length} completados
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(progressPercentage)}% completado
          </span>
        </div>
      </div>

      {/* Step Navigation */}
      {showStepNavigation && (
        <div className="space-y-4">
          {/* Step Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => handleStepClick(index)}
                  disabled={!canNavigateToStep?.(index)}
                  className={`
                    flex flex-col items-center p-2 rounded-lg transition-all
                    ${index === currentStep ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    ${canNavigateToStep?.(index) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                  `}
                >
                  {getStepIcon(step, index)}
                  <span className={`text-xs font-medium mt-1 ${getStepColor(step, index)}`}>
                    {index + 1}
                  </span>
                  <span className={`text-xs text-center max-w-20 truncate ${
                    index === currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </button>

                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  {steps[currentStep]?.title}
                </h4>
                {steps[currentStep]?.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {steps[currentStep].description}
                  </p>
                )}
              </div>

              {steps[currentStep]?.required && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Requerido
                </span>
              )}
            </div>

            {steps[currentStep]?.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{steps[currentStep].error}</p>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <CustomButton
              onClick={() => onStepChange?.(currentStep - 1)}
              disabled={currentStep === 0}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </CustomButton>

            <CustomButton
              onClick={() => onStepChange?.(currentStep + 1)}
              disabled={currentStep === steps.length - 1}
              size="sm"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </CustomButton>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for mobile or limited space
interface CompactProgressBarProps {
  steps: FormStepInfo[];
  currentStep: number;
  className?: string;
}

export const CompactProgressBar: React.FC<CompactProgressBarProps> = ({
  steps,
  currentStep,
  className = ''
}) => {
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Paso {currentStep + 1} de {steps.length}
        </span>
        <span className="text-sm text-gray-500">
          {steps[currentStep]?.title}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default FormProgressBar;








