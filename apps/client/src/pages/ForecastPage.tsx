import { Link, useParams } from "react-router-dom";

export function ForecastPage() {
  const { id: entityId } = useParams<{ id: string }>();

  return (
    <section className="page">
      <header className="page__header">
        <p className="page__eyebrow">Project forecast</p>
        <h1>Прогноз проекта</h1>
        <p className="page__description">
          На этой странице будут score, prediction, predicted value, confidence,
          risk, factors и outcome.
        </p>
      </header>

      <dl className="route-details">
        <dt>Entity ID</dt>
        <dd>{entityId ?? "не указан"}</dd>
      </dl>

      <Link className="text-link" to="/">
        Вернуться к прогнозам
      </Link>
    </section>
  );
}
