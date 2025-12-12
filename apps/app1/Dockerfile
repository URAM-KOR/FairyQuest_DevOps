# Node.js Application Dockerfile
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 공용 라이브러리 복사 (빌드 시 필요)
# docker-compose에서 볼륨 마운트로 처리

# 앱 실행 포트
EXPOSE 3001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:3001/health || exit 1

# 앱 실행
CMD ["node", "src/index.js"]

