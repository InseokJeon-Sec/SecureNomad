import React from 'react';
import Link from '@docusaurus/Link';
import {usePluginData} from '@docusaurus/useGlobalData';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function Column({title, moreLabel, moreTo, items}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="recent-col">
      <div className="recent-col__head">
        <span className="recent-col__title">{title}</span>
        <Link className="recent-col__more" to={moreTo}>{moreLabel}</Link>
      </div>
      <ul className="recent-list">
        {items.map((p) => (
          <li key={p.permalink}>
            <Link className="recent-item" to={p.permalink}>
              <span className="recent-item__title">{p.title}</span>
              <span className="recent-item__date">{p.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RecentPosts() {
  const data = usePluginData('recent-posts') || {};
  const {i18n} = useDocusaurusContext();
  const en = i18n.currentLocale !== 'ko';
  const news = data.news || [];
  const notes = data.notes || [];
  if (news.length === 0 && notes.length === 0) return null;
  return (
    <section className="recent">
      <h2 className="recent__heading">{en ? 'Latest' : '최근 업데이트'}</h2>
      <div className="recent-grid">
        <Column title="News" moreLabel={en ? 'All →' : '전체 보기 →'} moreTo="/news" items={news} />
        <Column title="Notes" moreLabel={en ? 'All →' : '전체 보기 →'} moreTo="/notes" items={notes} />
      </div>
    </section>
  );
}
