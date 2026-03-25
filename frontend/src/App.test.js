import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app title', () => {
  render(<App />);
  expect(screen.getByText(/Career/i)).toBeInTheDocument();
});

test('renders the Analyse button', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /Analyse My Profile/i })).toBeInTheDocument();
});

test('subject chips are present', () => {
  render(<App />);
  expect(screen.getByText('Mathematics')).toBeInTheDocument();
  expect(screen.getByText('Computer Science')).toBeInTheDocument();
});
