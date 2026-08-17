import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="page">
      <header className="page__header">
        <p className="page__eyebrow">404</p>
        <h1>Страница не найдена</h1>
        <p className="page__description">
          Проверьте адрес или вернитесь к списку прогнозов.
        </p>
      </header>

      <Link className="text-link" to="/">
        На главную
      </Link>
    </section>
  );
}
