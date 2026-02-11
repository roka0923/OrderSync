# OrderSync - Firebase 버전 Replit Agent 프롬프트

## 🎯 프로젝트 개요

**Firebase 기반** 자동차 부품 주문서 변환 웹 애플리케이션을 만들어주세요.

**중요:** 이미 Firebase를 사용하는 다른 앱이 있으므로, 같은 Firebase 프로젝트를 사용합니다.

---

## 🔥 기술 스택

### Frontend
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6

### Backend (Firebase)
- **Firestore Database** ← 메인 DB
- **Firebase Authentication** ← 사용자 인증 (기존 공유)
- **Firebase Hosting** ← 배포 (선택)

### 상태 관리
- Zustand 또는 React Context

---

## 📋 핵심 요구사항

### 1단계: 주문서 입력
사용자가 텍스트 주문서를 복사하여 붙여넣을 수 있는 페이지

**예시 주문서:**
```
포터2 20대분
HD 후 L 30
그스타후 10대분
K5 R 15
```

### 2단계: 1차 변환 (파싱)
주문서의 각 줄을 분석하여 표준 형식으로 변환

**파싱 규칙:**
1. **수량 패턴:**
   - `20대분` → LH 20개 + RH 20개 (2줄 분리)
   - `6/42` → LH 6개, RH 42개
   - `R 15` → RH 15개만
   - `L 30` → LH 30개만

2. **위치 감지:**
   - `후` 또는 `(후)` → 후방
   - 없으면 → 전방

3. **측면 감지:**
   - `L` → LH (Left Hand)
   - `R` → RH (Right Hand)
   - `대분` → LH + RH 모두

### 3단계: 약어 매칭
Firestore에서 약어를 검색하여 품목 코드와 매칭

**매칭 로직:**
1. 정확 매칭 (100% 신뢰도)
2. 유사도 매칭 (80-99%)
3. 부분 매칭 (60-79%)
4. 매칭 실패 (0%)

### 4단계: 수동 수정
매칭 실패 시 사용자가 직접 품목 선택

**수정 UI:**
- 실시간 품목 검색
- 추천 목록 표시
- "약어표에 저장" 체크박스

### 5단계: 약어표 자동 업데이트
사용자가 수정한 내용을 Firestore에 자동 저장

### 품목정보 관리 페이지
약어 조회/편집/추가/삭제 페이지

---

## 🗄️ Firestore 데이터 구조

### Collection 1: `abbreviations` (약어 매핑)

```typescript
interface Abbreviation {
  id: string;                    // 문서 ID (자동 생성)
  inputAbbr: string;             // 입력 약어 (예: "포터2", "포타2")
  standardAbbr: string;          // 표준 약어 (예: "포터2")
  productCode: string;           // 품목 코드 (예: "16212")
  productName: string;           // 품목명 (예: "포터2 RH")
  createdAt: Timestamp;          // 생성 일시
  source: 'default' | 'auto_learn' | 'manual';  // 출처
  usageCount: number;            // 사용 횟수
  status: 'active' | 'inactive'; // 상태
  notes?: string;                // 비고
}
```

**인덱스 필요:**
- `inputAbbr` (Ascending)
- `status` (Ascending)
- `usageCount` (Descending)

### Collection 2: `conversions` (변환 기록)

```typescript
interface Conversion {
  id: string;                    // 문서 ID
  userId: string;                // 사용자 ID (Firebase Auth UID)
  createdAt: Timestamp;          // 생성 일시
  originalText: string;          // 원본 주문서 전체
  totalItems: number;            // 총 항목 수
  autoMatched: number;           // 자동 매칭 수
  manuallyEdited: number;        // 수동 수정 수
  items: ConversionItem[];       // 변환 항목 배열
}

interface ConversionItem {
  lineNumber: number;            // 줄 번호
  originalLine: string;          // 원본 라인
  parsedProduct: string;         // 파싱된 제품명
  matchedCode: string;           // 매칭된 코드
  matchedName: string;           // 매칭된 품목명
  position: '전방' | '후방';    // 위치
  quantity: number;              // 수량
  side: 'LH' | 'RH';            // 측면
  confidence: number;            // 신뢰도 (0-100)
  status: 'confirmed' | 'edited' | 'failed';  // 상태
  userEdited: boolean;           // 사용자 수정 여부
}
```

---

## 💻 Firebase 설정 및 초기화

### 1. Firebase 설정 파일

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase 설정 (환경 변수 사용)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 인스턴스
export const db = getFirestore(app);

// Auth 인스턴스
export const auth = getAuth(app);
```

### 2. 환경 변수 설정

```.env
# .env.local 파일
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## 🔧 Firebase 함수 구현

### 1. 약어 추가 (자동 학습)

```typescript
// src/lib/abbreviations.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function addAbbreviation(
  inputAbbr: string,
  productCode: string,
  productName: string,
  notes?: string
): Promise<string> {
  const docRef = await addDoc(collection(db, 'abbreviations'), {
    inputAbbr,
    standardAbbr: inputAbbr,
    productCode,
    productName,
    createdAt: serverTimestamp(),
    source: 'auto_learn',
    usageCount: 1,
    status: 'active',
    notes: notes || ''
  });
  
  return docRef.id;
}
```

### 2. 약어 검색 (매칭)

```typescript
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit 
} from 'firebase/firestore';

export async function findAbbreviation(
  inputAbbr: string
): Promise<Abbreviation | null> {
  // 정확 매칭
  const q = query(
    collection(db, 'abbreviations'),
    where('inputAbbr', '==', inputAbbr),
    where('status', '==', 'active'),
    orderBy('usageCount', 'desc'),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data() as Omit<Abbreviation, 'id'>,
      confidence: 100
    };
  }
  
  return null;
}
```

### 3. 사용 횟수 증가

```typescript
import { doc, updateDoc, increment } from 'firebase/firestore';

export async function incrementUsageCount(abbrevId: string): Promise<void> {
  const docRef = doc(db, 'abbreviations', abbrevId);
  await updateDoc(docRef, {
    usageCount: increment(1)
  });
}
```

### 4. 약어 목록 가져오기 (실시간)

```typescript
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';

export function subscribeToAbbreviations(
  callback: (abbreviations: Abbreviation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'abbreviations'),
    orderBy('usageCount', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const abbreviations: Abbreviation[] = [];
    snapshot.forEach((doc) => {
      abbreviations.push({
        id: doc.id,
        ...doc.data() as Omit<Abbreviation, 'id'>
      });
    });
    
    callback(abbreviations);
  });
}
```

### 5. 변환 기록 저장

```typescript
import { auth } from './firebase';

export async function saveConversion(
  originalText: string,
  items: ConversionItem[],
  stats: {
    totalItems: number;
    autoMatched: number;
    manuallyEdited: number;
  }
): Promise<string> {
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  const docRef = await addDoc(collection(db, 'conversions'), {
    userId,
    createdAt: serverTimestamp(),
    originalText,
    totalItems: stats.totalItems,
    autoMatched: stats.autoMatched,
    manuallyEdited: stats.manuallyEdited,
    items
  });
  
  return docRef.id;
}
```

---

## 🎨 UI 컴포넌트 구조

```
src/
├── components/
│   ├── OrderInput.tsx          // 주문서 입력 영역
│   ├── ParsedLineItem.tsx      // 파싱된 항목 카드
│   ├── MatchingCard.tsx        // 매칭 확인 카드
│   ├── ProductSearchModal.tsx  // 품목 검색 모달
│   ├── AbbreviationTable.tsx   // 약어표 테이블
│   └── EditAbbreviationModal.tsx // 약어 편집 모달
│
├── pages/
│   ├── OrderInputPage.tsx      // 1단계: 주문 입력
│   ├── ParseResultPage.tsx     // 2단계: 파싱 결과
│   ├── MatchingPage.tsx        // 3-4단계: 매칭 확인/수정
│   ├── CompletedPage.tsx       // 5단계: 완료
│   └── AbbreviationsPage.tsx   // 품목정보 관리
│
├── lib/
│   ├── firebase.ts             // Firebase 설정
│   ├── abbreviations.ts        // 약어 관련 함수
│   ├── conversions.ts          // 변환 기록 함수
│   └── parser.ts               // 파싱 로직
│
└── types/
    └── index.ts                // TypeScript 타입 정의
```

---

## 🔐 Firestore 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 약어 컬렉션
    match /abbreviations/{abbrevId} {
      // 인증된 사용자만 읽기
      allow read: if request.auth != null;
      
      // 인증된 사용자만 생성/수정
      allow create, update: if request.auth != null;
      
      // 삭제 권한 (선택사항)
      allow delete: if request.auth != null;
    }
    
    // 변환 기록 컬렉션
    match /conversions/{conversionId} {
      // 본인 것만 읽기
      allow read: if request.auth != null 
        && resource.data.userId == request.auth.uid;
      
      // 본인만 생성
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid;
      
      // 수정/삭제 불가 (기록 보존)
      allow update, delete: if false;
    }
  }
}
```

---

## 📱 파싱 로직 (JavaScript)

```typescript
// src/lib/parser.ts

interface ParsedItem {
  original: string;
  product: string;
  position: '전방' | '후방';
  side: 'LH' | 'RH';
  quantity: number;
}

export function parseOrderLine(line: string): ParsedItem[] {
  const result: ParsedItem[] = [];
  const tokens = line.trim().split(/\s+/);
  
  if (tokens.length === 0) return result;
  
  // 제품명
  let product = tokens[0];
  const remaining = tokens.slice(1).join(' ');
  
  // 위치 감지
  const isRear = product.includes('후') || remaining.includes('후');
  const position = isRear ? '후방' : '전방';
  product = product.replace('후', '');
  
  // 측면 감지
  let side: 'LH' | 'RH' | null = null;
  if (remaining.match(/\bR\b/i)) side = 'RH';
  else if (remaining.match(/\bL\b/i)) side = 'LH';
  
  // 수량 파싱
  // 패턴 1: 6/42
  const slashMatch = remaining.match(/(\d+)\s*\/\s*(\d+)/);
  if (slashMatch) {
    result.push({
      original: line,
      product,
      position,
      side: 'LH',
      quantity: parseInt(slashMatch[1])
    });
    result.push({
      original: line,
      product,
      position,
      side: 'RH',
      quantity: parseInt(slashMatch[2])
    });
    return result;
  }
  
  // 패턴 2: 20대분
  const setMatch = remaining.match(/(\d+)\s*대분/);
  if (setMatch) {
    const qty = parseInt(setMatch[1]);
    result.push({
      original: line,
      product,
      position,
      side: 'LH',
      quantity: qty
    });
    result.push({
      original: line,
      product,
      position,
      side: 'RH',
      quantity: qty
    });
    return result;
  }
  
  // 패턴 3: R 15, L 30, 또는 숫자만
  const qtyMatch = remaining.match(/(\d+)/);
  if (qtyMatch) {
    const qty = parseInt(qtyMatch[1]);
    const finalSide = side || 'RH';
    result.push({
      original: line,
      product,
      position,
      side: finalSide,
      quantity: qty
    });
  }
  
  return result;
}

export function parseOrderText(text: string): ParsedItem[] {
  const lines = text.split('\n').filter(line => line.trim());
  const results: ParsedItem[] = [];
  
  lines.forEach(line => {
    const parsed = parseOrderLine(line);
    results.push(...parsed);
  });
  
  return results;
}
```

---

## 🚀 초기 데이터 Import

```typescript
// scripts/importInitialData.ts
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

const initialAbbreviations = [
  { inputAbbr: '포터2', productCode: '16212', productName: '포터2 RH' },
  { inputAbbr: '포터2', productCode: '16211', productName: '포터2 LH' },
  { inputAbbr: '그스타', productCode: '16032', productName: '그랜드스타렉스 RH' },
  { inputAbbr: '그스타', productCode: '16031', productName: '그랜드스타렉스 LH' },
  { inputAbbr: '그스타후', productCode: '16034', productName: '그랜드스타렉스(후) RH' },
  { inputAbbr: '그스타후', productCode: '16033', productName: '그랜드스타렉스(후) LH' },
  { inputAbbr: 'HD', productCode: '13032', productName: '아반떼HD RH' },
  { inputAbbr: 'HD', productCode: '13031', productName: '아반떼HD LH' },
  { inputAbbr: 'HD후', productCode: '13034', productName: '아반떼HD(후) RH' },
  { inputAbbr: 'HD후', productCode: '13033', productName: '아반떼HD(후) LH' },
  // ... 더 많은 초기 데이터
];

async function importData() {
  const batch = writeBatch(db);
  
  initialAbbreviations.forEach((abbr) => {
    const ref = doc(collection(db, 'abbreviations'));
    batch.set(ref, {
      ...abbr,
      standardAbbr: abbr.inputAbbr,
      createdAt: new Date(),
      source: 'default',
      usageCount: 0,
      status: 'active',
      notes: ''
    });
  });
  
  await batch.commit();
  console.log(`${initialAbbreviations.length}개 약어 Import 완료!`);
}

importData();
```

---

## 📦 Package.json 의존성

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "firebase": "^10.7.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🎨 스타일 가이드

### Tailwind 색상
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      }
    }
  }
}
```

---

## ✅ 구현 체크리스트

### Phase 1: Firebase 설정
- [ ] Firebase 프로젝트 생성/연결
- [ ] Firestore 데이터베이스 활성화
- [ ] Firebase 설정 파일 작성
- [ ] 환경 변수 설정

### Phase 2: 기본 구조
- [ ] React 프로젝트 생성
- [ ] 라우팅 설정
- [ ] Tailwind CSS 설정
- [ ] Firebase 초기화

### Phase 3: 핵심 기능
- [ ] 주문서 입력 페이지
- [ ] 파싱 로직 구현
- [ ] Firestore 약어 검색
- [ ] 매칭 확인 UI
- [ ] 수동 수정 기능

### Phase 4: 자동 학습
- [ ] 약어 추가 함수
- [ ] 사용 횟수 증가
- [ ] 변환 기록 저장

### Phase 5: 관리 기능
- [ ] 품목정보 관리 페이지
- [ ] 실시간 약어 목록
- [ ] 약어 편집/삭제
- [ ] 검색 및 필터

### Phase 6: 완성도
- [ ] 보안 규칙 설정
- [ ] 에러 처리
- [ ] 로딩 상태
- [ ] 반응형 디자인

---

## 🚀 Replit Agent 사용 방법

### Step 1: 프로젝트 생성
```
1. Replit → Create Repl → Agent
2. 이 프롬프트 복사하여 붙여넣기
3. "Create" 클릭
```

### Step 2: Firebase 설정 제공
```
Agent가 요청하면:
- Firebase 프로젝트 ID
- API Key
- Auth Domain
등을 제공
```

### Step 3: 초기 데이터 Import
```
Agent가 스크립트 실행:
npm run import-data

또는 수동으로:
node scripts/importInitialData.ts
```

---

## 🎯 성공 기준

다음 시나리오가 모두 작동하면 성공:

1. ✅ 주문서 입력 → 파싱 완료
2. ✅ Firestore에서 약어 자동 매칭
3. ✅ 수동 수정 → Firestore에 즉시 저장
4. ✅ 품목정보 페이지에서 실시간 업데이트 확인
5. ✅ 다른 브라우저에서도 동일한 약어 사용 가능

---

## 💡 추가 기능 (선택사항)

### 1. 오프라인 지원
```typescript
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db)
  .then(() => console.log('오프라인 모드 활성화'))
  .catch((err) => console.error('오프라인 모드 실패:', err));
```

### 2. 데이터 내보내기
```typescript
import * as XLSX from 'xlsx';

async function exportToExcel(items: ConversionItem[]) {
  const ws = XLSX.utils.json_to_sheet(items);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, 'orders.xlsx');
}
```

---

이 프롬프트로 Replit Agent가 Firebase 기반 OrderSync를 구현할 수 있습니다! 🚀
