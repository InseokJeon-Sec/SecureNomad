// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

// 빌드 · 실행 중인 언어 (ko: 한국어, en: 영어)
const currentLocale = process.env.DOCUSAURUS_CURRENT_LOCALE ?? 'ko';
const isKorean = currentLocale === 'ko';

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
          showLastUpdateTime: true,    // 문서 하단에 마지막 수정일 표시
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
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'SecureNomad',
        logo: {
          alt: 'SecureNomad Logo',
          src: 'img/logo.svg',
        },
        items: [
          {type: 'docSidebar', sidebarId: 'itSidebar', position: 'left', label: 'IT'},
          {type: 'docSidebar', sidebarId: 'securitySidebar', position: 'left', label: 'Security'},
          {type: 'docSidebar', sidebarId: 'aiSidebar', position: 'left', label: 'AI for Security'},
          {to: '/news', label: 'News', position: 'left'},
          {to: '/notes', label: 'Notes', position: 'left'},
          {type: 'localeDropdown', position: 'right'},
          {to: '/about', label: 'Profile', position: 'right'},
          {
            href: 'https://github.com/InseokJeon-Sec/SecureNomad',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} SecureNomad. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'powershell', 'sql', 'http'],
      },
    }),
};

export default config;