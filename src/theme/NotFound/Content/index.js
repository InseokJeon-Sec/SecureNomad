import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// 브랜드 404 (터미널 느낌)
export default function NotFoundContent({className}) {
  const {i18n} = useDocusaurusContext();
  const en = i18n.currentLocale !== 'ko';
  const home = en ? '/en/' : '/';
  return (
    <main className={clsx('container margin-vert--xl', className)}>
      <div className="notfound">
        <div className="notfound__code">&gt;_ 404</div>
        <h1 className="notfound__title">
          {en ? 'Page not found' : '페이지를 찾을 수 없습니다'}
        </h1>
        <p className="notfound__desc">
          {en
            ? 'The page may have moved or never existed.'
            : '주소가 바뀌었거나 존재하지 않는 페이지입니다.'}
        </p>
        <Link className="button button--primary" to={home}>
          {en ? 'Back to home' : '홈으로'}
        </Link>
      </div>
    </main>
  );
}
