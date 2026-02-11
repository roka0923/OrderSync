import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

// .env.local 파일 로드 (개발 시)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
];

async function importData() {
    console.log('초기 데이터 Import 시작...');
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
            notes: 'Initial Import'
        });
    });

    try {
        await batch.commit();
        console.log(`${initialAbbreviations.length}개 약어 Import 완료!`);
    } catch (error) {
        console.error('Import 중 오류 발생:', error);
        console.log('팁: Firebase Config가 올바른지 확인하고, Firestore 보안 규칙을 확인하세요.');
    }
}

importData();
