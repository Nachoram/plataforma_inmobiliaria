import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ApplicantLayout } from '../ApplicantLayout';

const renderApplicantLayout = (props = {}, children = <div>Test Content</div>) => {
  return render(
    <BrowserRouter>
      <ApplicantLayout {...props}>{children}</ApplicantLayout>
    </BrowserRouter>
  );
};

describe('ApplicantLayout', () => {
  it('renders children content', () => {
    renderApplicantLayout({}, <div>Applicant Content</div>);
    expect(screen.getByText('Applicant Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderApplicantLayout({ title: 'Mi Perfil' });
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
  });

  // TODO: Add more comprehensive tests
  it.todo('renders applicant-specific navigation');
  it.todo('handles breadcrumbs');
  it.todo('toggles sidebar');
});



