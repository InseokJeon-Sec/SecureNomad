import React from 'react';

// 문서 상단 등에서 유튜브 영상을 반응형(16:9)으로 임베드하는 컴포넌트
// 사용: <YouTube id="영상ID" title="영상 제목" />
export default function YouTube({id, title = '영상'}) {
  if (!id) return null;
  return (
    <div className="yt-embed">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
