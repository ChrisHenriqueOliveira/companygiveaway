import { ControlApp } from './control/ControlApp';
import { StageApp } from './stage/StageApp';
import { isControlWindow } from './store/appStore';

export function App() {
  return isControlWindow() ? <ControlApp /> : <StageApp />;
}
