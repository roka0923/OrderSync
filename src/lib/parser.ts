import { ParsedItem } from '../types';

export function parseOrderLine(line: string): ParsedItem[] {
    const result: ParsedItem[] = [];
    const trimmedLine = line.trim();
    if (!trimmedLine) return result;

    // 1. 위치(전/후) 감지
    let position: '전방' | '후방' = '전방';
    if (trimmedLine.includes('후')) {
        position = '후방';
    } else if (trimmedLine.includes('전')) {
        position = '전방';
    }

    // 2. 방향(LH/RH) 감지
    let side: 'LH' | 'RH' | null = null;
    const lowerLine = trimmedLine.toLowerCase();

    if (lowerLine.includes('조수대') || lowerLine.includes('조') || lowerLine.match(/\br\b/)) {
        side = 'RH';
    } else if (lowerLine.includes('운전석') || lowerLine.includes('운') || lowerLine.match(/\bl\b/)) {
        side = 'LH';
    }

    // 3. 수량 및 대분 패턴 분석
    let matchedQtyStr = "";
    let quantities: { lh: number; rh: number } | null = null;

    const setMatch = trimmedLine.match(/(\d+)\s*대분/i);
    const slashMatch = trimmedLine.match(/(\d+)\s*[\/\.]\s*(\d+)/);

    // 수량 매칭 개선: "개/ea"가 붙은 것을 최우선, 아니면 문장 끝의 숫자를 우선시
    let qtyMatch = trimmedLine.match(/(\d+)\s*(개|ea)(?:\s|$)/i);
    if (!qtyMatch) {
        // 문장 끝의 숫자 또는 기호/공백 뒤의 숫자들을 찾음
        const allNums = Array.from(trimmedLine.matchAll(/(\d+)(?:\s|$|(?=[^0-9가-힣]))/g));
        if (allNums.length > 0) {
            // 마지막 숫자를 수량으로 선택 (보통 모델명 뒤에 수량이 오므로)
            qtyMatch = allNums[allNums.length - 1];
        } else {
            // 기본 qtyMatch (문장 중간의 숫자라도 일단 후보로 둠)
            qtyMatch = trimmedLine.match(/(\d+)\s*(개|ea)?(?:\s|$)/i);
        }
    }

    if (setMatch) {
        const qty = parseInt(setMatch[1]);
        quantities = { lh: qty, rh: qty };
        matchedQtyStr = setMatch[0];
    } else if (slashMatch) {
        quantities = { lh: parseInt(slashMatch[1]), rh: parseInt(slashMatch[2]) };
        matchedQtyStr = slashMatch[0];
    } else if (qtyMatch) {
        const qty = parseInt(qtyMatch[1]);
        quantities = { lh: qty, rh: qty };
        matchedQtyStr = qtyMatch[0];
    }

    // 4. 제품명 추출 (수량 문자열 및 방향 지시어 제거)
    let product = trimmedLine;
    if (matchedQtyStr) {
        product = product.replace(matchedQtyStr, '').trim();
    }

    // 방향 지시어 제거 (L, R, LH, RH, 운전석, 조수대 등) - 파싱에 이미 반영되었으므로 검색어에서 제외
    const sideKeywords = ['조수대', '운전석', '조', '운', 'lh', 'rh', 'l', 'r'];
    sideKeywords.forEach(kw => {
        const regex = new RegExp(`(^|[^a-zA-Z가-힣])${kw}(?![a-zA-Z가-힣])`, 'gi');
        product = product.replace(regex, '$1');
    });

    // 불필요한 기호 정리 및 최종 트림 (소수점은 보존)
    product = product.replace(/\.(?!\d)/g, ' ').replace(/(?<!\d)\./g, ' ');
    product = product.replace(/[\/\(\)]/g, ' ').replace(/\s+/g, ' ').trim();

    // 만약 제품명이 비어있거나 방향/위치 단어만 있다면 이전 맥락이 필요하도록 함
    const keywordOnlyRegex = /^(전방|후방|전|후|조수대|운전석|조|운|lh|rh|l|r)$/i;
    if (!product || keywordOnlyRegex.test(product)) {
        product = "알 수 없는 품목";
    }

    if (quantities) {
        if (setMatch || slashMatch) {
            result.push({ original: line, product, position, side: 'LH', quantity: quantities.lh });
            result.push({ original: line, product, position, side: 'RH', quantity: quantities.rh });
        } else {
            result.push({ original: line, product, position, side: side || 'RH', quantity: quantities.lh });
        }
    }

    return result;
}

export function parseOrderText(text: string): ParsedItem[] {
    // 줄바꿈 또는 마침표(.)로 구분하여 항목 추출 (단, 숫자로 된 소수점 1.2 등은 제외)
    // 마침표 뒤에 공백이 있거나 마침표가 단어/숫자 끝에 오는 경우만 분리
    const items = text.split(/\n|(?<!\d)\.|\.(?!\d)/).map(i => i.trim()).filter(i => i);
    const results: ParsedItem[] = [];
    let lastProduct = "";

    items.forEach(item => {
        const parsed = parseOrderLine(item);

        // "후6대분" 처럼 품목명이 생략된 경우 앞선 품목명을 복사
        parsed.forEach(p => {
            if (p.product === "알 수 없는 품목" && lastProduct) {
                p.product = lastProduct;
            } else if (p.product !== "알 수 없는 품목") {
                lastProduct = p.product;
            }
        });

        results.push(...parsed);
    });

    return results;
}

