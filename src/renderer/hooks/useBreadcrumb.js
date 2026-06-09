import { useAppState } from '../context/AppState.context.jsx';

export function useBreadcrumb() {
  const { breadcrumb, setBreadcrumb } = useAppState();
  return { breadcrumb, setBreadcrumb };
}
