import React from 'react';
import Content from '@theme-original/BlogSidebar/Content';
import {useLocation} from '@docusaurus/router';

// 블로그 사이드바(최근 노트/뉴스) 아래에 작은 RSS 구독 링크 추가
export default function ContentWrapper(props) {
  const {pathname} = useLocation();
  const feed = pathname.includes('/news') ? '/news/rss.xml' : '/notes/rss.xml';
  return (
    <>
      <Content {...props} />
      <a
        className="blog-rss-link"
        href={feed}
        target="_blank"
        rel="noopener noreferrer"
        title="RSS 구독"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="6.18" cy="17.82" r="2.18" />
          <path d="M4 10.1v2.9c3.9 0 7 3.1 7 7h2.9C13.9 15.5 9.5 11.1 4 11.1zm0-5.6v2.9C10.6 7.4 16 12.8 16 19.5h2.9C18.9 11.2 12.3 4.6 4 4.6z" />
        </svg>
        <span>RSS 구독</span>
      </a>
    </>
  );
}
