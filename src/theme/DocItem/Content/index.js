import React from 'react';
import Content from '@theme-original/DocItem/Content';
import Admonition from '@theme/Admonition';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// 영어 화면에서 번역본이 없는 문서(한국어 원문으로 대체 표시)에 안내 문구를 표시
export default function ContentWrapper(props) {
  const {metadata} = useDoc();
  const {
    i18n: {currentLocale, defaultLocale},
  } = useDocusaurusContext();

  // 번역본이 있으면 source가 '@site/i18n/...', 없으면 원문 '@site/docs/...'
  const isFallback =
    currentLocale !== defaultLocale && metadata.source.startsWith('@site/docs/');

  return (
    <>
      {isFallback && (
        <Admonition type="info" title="Korean only">
          This page is available in Korean only. An English version will be added later.
        </Admonition>
      )}
      <Content {...props} />
    </>
  );
}
