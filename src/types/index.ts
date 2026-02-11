import { Timestamp } from 'firebase/firestore';

export interface Abbreviation {
    id: string;                    // 문서 ID (자동 생성)
    inputAbbr: string;             // 입력 약어 (예: "포터2", "포타2")
    standardAbbr: string;          // 표준 약어 (예: "포터2")
    productCode: string;           // 품목 코드 (예: "16212")
    productName: string;           // 품목명 (예: "포터2 RH")
    createdAt: Timestamp | Date;   // 생성 일시
    source: 'default' | 'auto_learn' | 'manual';  // 출처
    usageCount: number;            // 사용 횟수
    status: 'active' | 'inactive'; // 상태
    notes?: string;                // 비고
    confidence?: number;           // 매칭 신뢰도 (UI용)
}

export interface Conversion {
    id: string;                    // 문서 ID
    userId: string;                // 사용자 ID (Firebase Auth UID)
    createdAt: Timestamp | Date;   // 생성 일시
    originalText: string;          // 원본 주문서 전체
    totalItems: number;            // 총 항목 수
    autoMatched: number;           // 자동 매칭 수
    manuallyEdited: number;        // 수동 수정 수
    items: ConversionItem[];       // 변환 항목 배열
}

export interface ConversionItem {
    lineNumber: number;            // 줄 번호
    originalLine: string;          // 원본 라인
    parsedProduct: string;         // 파싱된 제품명
    matchedCode: string;           // 매칭된 코드
    matchedName: string;           // 매칭된 품목명
    position: '전방' | '후방';      // 위치
    quantity: number;              // 수량
    side: 'LH' | 'RH';             // 측면
    confidence: number;            // 신뢰도 (0-100)
    status: 'confirmed' | 'edited' | 'failed' | 'pending';  // 상태
    userEdited: boolean;           // 사용자 수정 여부
}

export interface ParsedItem {
    original: string;
    product: string;
    position: '전방' | '후방';
    side: 'LH' | 'RH';
    quantity: number;
}
