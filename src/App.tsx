import { ControlApp } from './control/ControlApp';
import { StageApp } from './stage/StageApp';
import { isControlWindow } from './store/appStore';
import { ErrorBoundary } from './ui/ErrorBoundary';

export function App() {
  return <ErrorBoundary>{isControlWindow() ? <ControlApp /> : <StageApp />}</ErrorBoundary>;
}
