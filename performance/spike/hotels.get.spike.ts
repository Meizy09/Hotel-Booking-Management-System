import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:3000/api'; // Update if your API runs on a different port

export const options = {
    stages: [
        { duration: '10s', target: 10 },   // ramp-up to 10 users
        { duration: '10s', target: 200 },  // sudden spike to 200 users
        { duration: '20s', target: 300 },  // stay at 300 users
        { duration: '10s', target: 10 },   // quick ramp-down to 10 users
        { duration: '10s', target: 0 },    // ramp-down to 0 users
    ],
    ext: {
        loadimpact: {
            name: 'Hotels GET Spike Test',
        },
    },
};

export default function () {
    const res = http.get(`${BASE_URL}/hotels`, {
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer YOUR_VALID_TOKEN`,
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