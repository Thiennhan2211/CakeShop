import React from 'react';
import StorefrontUtil from '../utils/StorefrontUtil';

function News() {
  const articles = StorefrontUtil.buildNewsArticles();

  return (
    <div className="content-page">
      <section className="page-banner page-banner--compact">
        <span className="section-heading__eyebrow">Tin tức</span>
        <h1>Cảm hứng mới cho những buổi tiệc ngọt</h1>
      </section>

      <section className="news-grid">
        {articles.map((article) => (
          <article key={article.id} className="news-card">
            <div className="news-card__meta">
              <span>{article.tag}</span>
              <span>{article.date}</span>
            </div>
            <h3>{article.title}</h3>
            <p>{article.summary}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export default News;
