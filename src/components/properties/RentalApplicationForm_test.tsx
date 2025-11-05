import React from 'react';

interface TestProps {
  property: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RentalApplicationForm: React.FC<TestProps> = ({ property, onSuccess, onCancel }) => {
  return (
    <div>
      <h1>Test Component</h1>
      <p>Property: {property?.address_street}</p>
    </div>
  );
};

export default RentalApplicationForm;
