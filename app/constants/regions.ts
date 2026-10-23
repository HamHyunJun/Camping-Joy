/** 모임 지역. 전국은 특정 지역에 묶이지 않는 모임이다. DB의 check(groups.region)와 같은 목록이다. */
export const ALL_REGIONS = '전국'

export const REGIONS = [
  '서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주',
] as const
