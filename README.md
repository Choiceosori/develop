# 🎈 발명 탐험대 팡팡!

초등학교 1학년을 위한 카드 놀이 · 대화형 발명 웹앱입니다.

- 🧩 **카드 발명기**: 트리즈 카드 8종 중 1장 뽑기 → 물건 고르기 → 아이디어 완성 → 보물상자 저장
- 🤖 **팡팡이**: 버튼만 눌러서 3단계(불편한 점 → 상상하기 → 이름 짓기)로 발명품 완성
- 🎁 **보물상자**: '참 잘했어요!' 스티커 카드, 🖍️ 그림 그리기, 🖨️ 한 장씩 프린트
- 🔊 팡팡이 말풍선 읽어주기 (기기 음성 사용)

빌드 과정이 없는 정적 사이트(`index.html`, `style.css`, `app.js`)와 Vercel 서버리스 함수 1개(`api/chat.js`)로 되어 있습니다.
보물상자는 각 기기의 브라우저(localStorage)에 저장됩니다.

## Vercel 배포

### 방법 A: GitHub 연결 (추천)
1. 이 폴더를 GitHub 저장소에 올립니다.
2. https://vercel.com/new 에서 저장소를 Import → Framework Preset은 **Other** 그대로 → Deploy.

### 방법 B: Vercel CLI
```bash
npx vercel        # 미리보기 배포
npx vercel --prod # 실제 배포
```

## (선택) Gemini AI 연결

AI 없이도 모든 기능이 정해진 대사로 동작합니다.
AI를 연결하면 아이가 **"직접 쓸래요! ✏️"** 로 쓴 내용에 팡팡이가 맞춤 대답과 선택지를 만들어 줍니다.

Vercel 프로젝트 → Settings → Environment Variables:

| 이름 | 값 |
| --- | --- |
| `GEMINI_API_KEY` | Google AI Studio에서 받은 키 |
| `GEMINI_MODEL` | (선택) 기본값 `gemini-2.5-flash` |

추가 후 다시 배포(Redeploy)해야 적용됩니다.
※ 누구나 접속할 수 있는 주소라면, Google AI Studio에서 키 사용량 한도를 걸어 두는 것을 권장합니다.
