import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:3000/api'; // Update if your API runs on a different port

export const options = {
    stages: [
        { duration: '30s', target: 40 }, // ramp-up to 40 users over 30 seconds
        { duration: '40s', target: 50 }, // stay at 50 users for 40 seconds
        { duration: '10s', target: 0 },  // ramp-down to 0 users
    ],
    ext: {
        loadimpact: {
            name: 'Payments POST Load Test',
        },
    },
};

export default function () {
    
    const res = http.get(`${BASE_URL}/payments`, {
        headers: {
            'Content-Type': 'application/json',
           
        },
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        // 'has data array': (r) => {
        //     try {
        //         const body = JSON.parse(r.body as string);
        //         return Array.isArray(body.data);
        //     } catch {
        //         return false;
        //     }
        // },
    });

    sleep(1);
}