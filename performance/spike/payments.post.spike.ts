import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:3000';

export const options = {
    stages: [
        { duration: '10s', target: 10 },
        { duration: '10s', target: 200 },
        { duration: '20s', target: 300 },
        { duration: '10s', target: 10 },
        { duration: '10s', target: 0 },
    ],
    ext: {
        loadimpact: {
            name: 'Payments POST Spike Test',
        },
    },
};

export default function () {
    const payload = JSON.stringify({
       Booking_id: 147,
       user_id: 1,
       Amount: 2000,
       Payment_status: "paid",
       Payment_date: new Date().toISOString(),
       Payment_method: "card",
       Transaction_id: `TXN-${Math.random().toString(36).substring(2, 12)}`
    });

    const headers = {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer YOUR_VALID_TOKEN`, // <-- Add your token here if needed
    };

    const res = http.post(`${BASE_URL}/api/payments`, payload, { headers });

    // Optional: debug output
    console.log(`Status: ${res.status}`);
    // console.log(`Body: ${res.body}`); // Uncomment if needed

    check(res, {
    'status is 201': (r) => r.status === 201,
    // 'has Transaction_id': (r) => {
    //     if (typeof r.body === 'string') {
    //         try {
    //             const body = JSON.parse(r.body);
    //             return Array.isArray(body.data);
    //         } catch {
    //             return false;
    //         }
    //     }
    //     return false;
    // },
});


    sleep(1);
}
