import { NavLink, Outlet } from "react-router-dom";

const getNavigationClassName = ({ isActive }: { isActive: boolean }): string =>
  isActive
    ? "app-navigation__link app-navigation__link--active"
    : "app-navigation__link";

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="app-brand" to="/">
          AI Oracle
        </NavLink>

        <nav className="app-navigation" aria-label="Основная навигация">
          <NavLink className={getNavigationClassName} end to="/">
            Прогнозы
          </NavLink>

          <NavLink className={getNavigationClassName} to="/history">
            История
          </NavLink>
        </nav>
      </header>

      <main className="app-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        Объяснимые прогнозы развития AI-экосистемы
      </footer>
    </div>
  );
}
