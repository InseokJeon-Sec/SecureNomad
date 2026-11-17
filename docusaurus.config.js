// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

// 빌드 · 실행 중인 언어 (ko: 한국어, en: 영어)
const currentLocale = process.env.DOCUSAURUS_CURRENT_LOCALE ?? 'ko';
const isKorean = currentLocale === 'ko';

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

// 첫 화면 '최근 업데이트'용: notes/news 최신 글 + 전체 문서의 최근 변경을 전역 데이터로 주입
function recentPostsPlugin(context) {
  function read(dir, base, limit) {
    const abs = path.join(context.siteDir, dir);
    let files = [];
    try { files = fs.readdirSync(abs); } catch (e) { return []; }
    const items = files
      .filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.mdx?$/.test(f))
      .map((f) => {
        const m = f.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.mdx?$/);
        const raw = fs.readFileSync(path.join(abs, f), 'utf8');
        const tm = raw.match(/^title:\s*(.+?)\s*$/m);
        let title = tm ? tm[1].trim() : m[4];
        title = title.replace(/^['"]|['"]$/g, '');
        return {
          title,
          date: `${m[1]}-${m[2]}-${m[3]}`,
          permalink: `/${base}/${m[1]}/${m[2]}/${m[3]}/${m[4]}`,
        };
      });
    items.sort((a, b) => (a.date < b.date ? 1 : -1));
    return items.slice(0, limit);
  }

  // 소스 파일의 마지막 git 커밋 날짜(YYYY-MM-DD). 실패 시 파일 수정시각으로 대체.
  function lastChanged(absFile) {
    try {
      const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', absFile],
        {cwd: context.siteDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
      if (out) return out.slice(0, 10);
    } catch (e) {}
    try { return new Date(fs.statSync(absFile).mtime).toISOString().slice(0, 10); } catch (e) {}
    return '';
  }

  // docs/ 전체를 걸어 각 문서의 permalink(= Docusaurus 라우팅 규칙)·제목·git 수정일을 구해 최신순 정렬
  function recentDocs(limit) {
    const root = path.join(context.siteDir, 'docs');
    const out = [];
    const strip = (seg) => seg.replace(/^\d+-/, '');           // 세그먼트별 NN- 프리픽스 제거
    function walk(dir) {
      let entries = [];
      try { entries = fs.readdirSync(dir, {withFileTypes: true}); } catch (e) { return; }
      for (const ent of entries) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) { walk(abs); continue; }
        if (!/\.mdx?$/.test(ent.name)) continue;
        if (/^(index|readme)\.mdx?$/i.test(ent.name)) continue; // 카테고리 인덱스 제외
        const rel = path.relative(root, abs).replace(/\\/g, '/');
        const raw = fs.readFileSync(abs, 'utf8');
        const fm = raw.match(/^---\n([\s\S]*?)\n---/);
        const fmText = fm ? fm[1] : '';
        const slugM = fmText.match(/^slug:\s*(.+?)\s*$/m);
        const dirSegs = rel.split('/').slice(0, -1).map(strip);
        let route;
        if (slugM) {
          let slug = slugM[1].trim().replace(/^['"]|['"]$/g, '');
          route = slug.startsWith('/') ? slug : '/' + [...dirSegs, slug].join('/');
        } else {
          const segs = rel.replace(/\.mdx?$/, '').split('/').map(strip);
          route = '/' + segs.join('/');
        }
        if (route.length > 1) route = route.replace(/\/$/, '');
        if (route === '/') continue;                            // 홈(intro) 제외
        const tm = fmText.match(/^title:\s*(.+?)\s*$/m);
        const hm = raw.match(/^#\s+(.+?)\s*$/m);
        let title = (tm ? tm[1] : (hm ? hm[1] : strip(ent.name.replace(/\.mdx?$/, ''))))
          .trim().replace(/^['"]|['"]$/g, '');
        out.push({title, permalink: route, date: lastChanged(abs)});
      }
    }
    walk(root);
    return out
      .filter((d) => d.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, limit);
  }

  return {
    name: 'recent-posts',
    async loadContent() {
      return {
        news: read('news', 'news', 4),
        notes: read('notes', 'notes', 4),
      };
    },
    async contentLoaded({content, actions}) {
      actions.setGlobalData({...content, changes: recentDocs(4)});
    },
  };
}

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'SecureNomad',
  tagline: '보안과 IT 지식 정리',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://wiki.securenomad.kr',
  baseUrl: '/',
  trailingSlash: false,

  organizationName: 'InseokJeon-Sec',
  projectName: 'SecureNomad',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
    localeConfigs: {
      ko: {label: '한국어', htmlLang: 'ko-KR'},
      en: {label: 'English', htmlLang: 'en-US'},
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',          // 문서를 사이트 첫 화면으로
          sidebarPath: './sidebars.js',
          showLastUpdateTime: false,   // 문서 하단 '최종 수정' 표기 끔(홈의 '최근 변경' 칼럼으로 대체)
        },
        blog: {                        // Notes (날짜순 이슈 메모, 번역 없이 한국어로 표시)
          path: 'notes',
          routeBasePath: 'notes',
          blogTitle: 'Notes',
          blogDescription: '보안 · IT · AI 이슈를 그때그때 기록하는 메모',
          blogSidebarTitle: isKorean ? '최근 노트' : 'Recent notes',
          blogSidebarCount: 'ALL',
          postsPerPage: 10,
          showReadingTime: false,       // 예상 읽기 시간 표시 끄기
          showLastUpdateTime: true,
          authorsMapPath: 'authors.yml',
          tags: 'tags.yml',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
          feedOptions: {
            type: ['rss', 'atom'],
            title: 'SecureNomad Notes',
            description: '보안 · IT · AI 이슈 메모',
            language: 'ko',
          },
        },
        sitemap: {
          // 영어 사이트의 Notes는 한국어 글과 같은 내용이므로 영어 사이트맵에서 제외
          ignorePatterns: isKorean ? [] : ['/en/notes', '/en/notes/**', '/en/news', '/en/news/**'],
          lastmod: 'date',             // 검색엔진에 문서 수정일 전달
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
        },
        gtag: {                        // Google Analytics 4 방문 통계
          trackingID: 'G-JM4LD4WP7D',
          anonymizeIP: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    recentPostsPlugin,
    [
      '@docusaurus/plugin-content-blog',
      /** @type {import('@docusaurus/plugin-content-blog').Options} */
      ({
        id: 'news',                    // 두 번째 블로그: 보안 뉴스 (주간 브리핑 등)
        path: 'news',
        routeBasePath: 'news',
        blogTitle: 'News',
        blogDescription: '주간 보안 브리핑과 보안 뉴스 정리',
        blogSidebarTitle: isKorean ? '최근 뉴스' : 'Recent news',
        blogSidebarCount: 'ALL',
        postsPerPage: 10,
        showReadingTime: false,
        showLastUpdateTime: true,
        authorsMapPath: 'authors.yml',
        tags: 'tags.yml',
        onInlineTags: 'warn',
        onInlineAuthors: 'warn',
        onUntruncatedBlogPosts: 'warn',
        feedOptions: {
          type: ['rss', 'atom'],
          title: 'SecureNomad News',
          description: '주간 보안 브리핑과 보안 뉴스 정리',
          language: 'ko',
        },
      }),
    ],
    [
      '@docusaurus/plugin-pwa',
      {
        debug: false,
        offlineModeActivationStrategies: [
          'appInstalled',
          'standalone',
          'queryString',
        ],
        pwaHead: [
          {tagName: 'link', rel: 'icon', href: '/img/logo192.png'},
          {tagName: 'link', rel: 'manifest', href: '/manifest.json'},
          {tagName: 'meta', name: 'theme-color', content: '#2f6fb3'},
          {tagName: 'meta', name: 'apple-mobile-web-app-capable', content: 'yes'},
          {tagName: 'meta', name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent'},
          {tagName: 'link', rel: 'apple-touch-icon', href: '/img/logo192.png'},
        ],
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/docusaurus-social-card.jpg',
      metadata: [
        {name: 'keywords', content: '정보보안, 보안, 침해사고 대응, 보안관제, SOC, OT 보안, 클라우드 보안, ISMS, ISO 27001, 네트워크 보안, IT'},
        {name: 'author', content: 'Inseok Jeon'},
        {name: 'naver-site-verification', content: '0d19a96a355dc5842307a811d9a57ccf53438376'},
      ],
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: 'SecureNomad',
        logo: {
          alt: 'SecureNomad Logo',
          src: 'img/logo.svg',
        },
        items: [
          {to: '/news', label: 'News', position: 'left'},
          {type: 'docSidebar', sidebarId: 'itSidebar', position: 'left', label: 'IT'},
          {type: 'docSidebar', sidebarId: 'aiSidebar', position: 'left', label: 'AI'},
          {
            type: 'dropdown',
            label: 'Security',
            position: 'left',
            items: [
              {type: 'docSidebar', sidebarId: 'securitySidebar', label: 'Overview'},
              {type: 'doc', docId: 'security/soc/overview', label: 'SOC'},
              {type: 'doc', docId: 'security/ai-for-security/overview', label: 'AI for Security'},
              {type: 'doc', docId: 'security/ai-security-assessment/overview', label: 'Securing AI'},
              {type: 'doc', docId: 'security/pki-certificates/overview', label: 'PKI · Certificates'},
            ],
          },
          {type: 'docSidebar', sidebarId: 'labSidebar', position: 'left', label: 'Lab'},
          {type: 'docSidebar', sidebarId: 'certsSidebar', position: 'left', label: 'Certs'},
          {type: 'docSidebar', sidebarId: 'topicsSidebar', position: 'left', label: 'Topics'},
          {to: '/notes', label: 'Notes', position: 'left'},
          {type: 'localeDropdown', position: 'right'},
          {to: '/about', label: 'Profile', position: 'right'},
          {
            href: 'https://securenomad-private.pages.dev',
            label: 'Private',
            position: 'right',
            className: 'navbar-private-link',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} SecureNomad · Built with Docusaurus<br/>Contact: <a class="footer__link-item" href="mailto:securenomad@naver.com">securenomad@naver.com</a> · <a class="footer__link-item" href="/privacy">Analytics Notice</a>`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'powershell', 'sql', 'http'],
      },
    }),
};

export default config;